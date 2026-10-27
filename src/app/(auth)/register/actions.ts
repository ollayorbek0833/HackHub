"use server";

import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { fromZodError, isUniqueViolation } from "@/lib/action-state";
import type { ActionState } from "@/lib/action-state";
import { DUPLICATE_EMAIL } from "@/lib/auth/messages";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/auth";

// Register needs no role: anyone may create an account (docs/07 > Permission
// matrix). The email is lowercased by the schema, so "Ana@Example.com" and
// "ana@example.com" are the same account (TC-45, TC-46).
export async function register(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  // Passwords are never sent back to the browser.
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) {
    const invalid = fromZodError(parsed.error);
    return invalid && !invalid.ok ? { ...invalid, values } : invalid;
  }

  const { email, password } = parsed.data;

  try {
    await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password) },
      select: { id: true },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, formError: DUPLICATE_EMAIL, values };
    }
    throw e;
  }

  await signIn("credentials", { email, password, redirect: false });
  // redirect() throws, so it stays outside the try above. The toast
  // "Account created. …" is shown on /profile by <NoticeToast />.
  redirect("/profile?notice=account-created");
}
