"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { RuleError, type ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth/dal";
import { ROLE_MESSAGES, roleChangeError } from "@/lib/domain/roles";
import { prisma } from "@/lib/prisma";
import { setUserRoleSchema, userIdSchema } from "@/lib/validation/roles";

/**
 * Makes a participant a judge or a judge a participant (docs/07 >
 * Transactions > Change role, Decision 11). The user id is bound by the page,
 * but anyone can call this with any id, so every rule is checked here, in one
 * transaction so a user can't join a team between the check and the update.
 * The new role applies on the user's next request: requireRole() reads it
 * from the database, so they don't need to log in again (Decision 8).
 */
export async function setUserRole(
  userId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const organizer = await requireRole("ORGANIZER");
  // An id that can't be a user id is the same as an unknown user.
  if (!userIdSchema.safeParse(userId).success) notFound();

  const parsed = setUserRoleSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) {
    return { ok: false, formError: parsed.error.issues[0].message };
  }
  const to = parsed.data.role;

  let message: string | null;
  try {
    message = await prisma.$transaction(async (tx) => {
      // Lock the user row, so a concurrent team join waits for this change.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          profile: { select: { name: true } },
          memberships: {
            select: { event: { select: { name: true } } },
            orderBy: { joinedAt: "asc" },
          },
        },
      });
      if (!user) return null;

      const displayName = user.profile?.name.trim() || user.email;
      const error = roleChangeError(
        organizer.id,
        {
          id: user.id,
          role: user.role,
          displayName,
          teamEvents: user.memberships.map((m) => m.event.name),
        },
        to,
      );
      if (error) throw new RuleError(error);

      await tx.user.update({ where: { id: user.id }, data: { role: to } });
      return ROLE_MESSAGES.changed(displayName, to);
    });
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, formError: e.message };
    throw e;
  }
  // notFound() throws, so it stays outside the try.
  if (message === null) notFound();

  revalidatePath("/organizer/users");
  return { ok: true, message };
}
