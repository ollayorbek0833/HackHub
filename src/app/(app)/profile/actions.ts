"use server";

import { revalidatePath } from "next/cache";

import { type ActionState, fromZodError } from "@/lib/action-state";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { profileSchema, readProfileForm } from "@/lib/validation/profile";

// Save the signed-in user's profile (docs/08 > /profile, #4). The user id
// comes from the session, never from the form, so nobody can write someone
// else's profile by posting a different id.
export async function saveProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const raw = readProfileForm(formData);
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ...fromZodError(parsed.error),
      ok: false,
      values: { name: raw.name, faculty: raw.faculty, bio: raw.bio },
    };
  }

  const data = parsed.data;
  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  revalidatePath("/profile");
  revalidatePath(`/profile/${user.id}`);
  return { ok: true, message: "Profile saved." };
}
