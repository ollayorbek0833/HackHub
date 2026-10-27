"use server";

import { revalidatePath } from "next/cache";

import {
  isUniqueViolation,
  RuleError,
  type ActionState,
} from "@/lib/action-state";
import { requireEvent, requireRole } from "@/lib/auth/dal";
import { ALREADY_REGISTERED, registrationRefusal } from "@/lib/domain/registration";
import { prisma } from "@/lib/prisma";

/**
 * Register the signed-in participant for an event (docs/08 > Event details).
 * Server actions are public endpoints, so this checks everything itself: the
 * role (judges and organizers are refused), the event, its state and the
 * profile. The form has no fields; the event id is bound by the page.
 */
export async function registerForEvent(
  eventId: string,
  // The shape every action has (docs/07); this form sends no fields.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("PARTICIPANT");
  // Unknown id → not-found page. Called outside the try: notFound() throws.
  const { id, name } = await requireEvent(eventId);

  try {
    await prisma.$transaction(async (tx) => {
      // Re-read inside the transaction: registration may have closed since the
      // page was rendered.
      const [event, profile, existing] = await Promise.all([
        tx.event.findUniqueOrThrow({
          where: { id },
          select: { registrationOpen: true },
        }),
        tx.profile.findUnique({
          where: { userId: user.id },
          select: { name: true, faculty: true },
        }),
        tx.eventRegistration.findUnique({
          where: { eventId_userId: { eventId: id, userId: user.id } },
          select: { id: true },
        }),
      ]);

      const refusal = registrationRefusal({
        event,
        profile,
        alreadyRegistered: existing !== null,
      });
      if (refusal) throw new RuleError(refusal);

      await tx.eventRegistration.create({
        data: { eventId: id, userId: user.id },
      });
    });
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, formError: e.message };
    // A double-click races past the check; the unique index refuses it.
    if (isUniqueViolation(e)) return { ok: false, formError: ALREADY_REGISTERED };
    throw e;
  }

  revalidatePath(`/events/${id}`);
  revalidatePath("/events");
  revalidatePath("/my-events");
  return { ok: true, message: `You're registered for ${name}.` };
}
