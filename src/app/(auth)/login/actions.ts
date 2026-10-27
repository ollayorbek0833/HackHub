"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { fromZodError } from "@/lib/action-state";
import type { ActionState } from "@/lib/action-state";
import { WRONG_CREDENTIALS } from "@/lib/auth/messages";
import { ROLE_HOME } from "@/lib/auth/permissions";
import { safeCallbackUrl } from "@/lib/auth/redirects";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";

// Log in needs no role (docs/07 > Auth and session flow, step 2).
export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) {
    const invalid = fromZodError(parsed.error);
    return invalid && !invalid.ok ? { ...invalid, values } : invalid;
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    // Only a failed sign-in becomes the form error. Anything else (database
    // down) goes to error.tsx.
    if (e instanceof AuthError) {
      return { ok: false, formError: WRONG_CREDENTIALS, values };
    }
    throw e;
  }

  // The role decides only where to land; every page re-checks it.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));
  redirect(callbackUrl ?? (user ? ROLE_HOME[user.role] : "/"));
}
