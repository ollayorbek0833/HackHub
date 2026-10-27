import { z } from "zod";

// Field rules and messages from docs/08-ui-spec.md > /register. Shared by the
// register form, its server action and prisma/seed.ts.

/** Trimmed and lowercased, because emails are stored lowercased. */
export const emailSchema = z
  .string({ error: "Enter your email." })
  .trim()
  .toLowerCase()
  .min(1, "Enter your email.")
  .pipe(z.email("Enter a valid email address, like name@example.com."));

/** A new password (Decision 8). Log in only checks that one was entered. */
export const passwordSchema = z
  .string({ error: "Enter a password." })
  .min(1, { error: "Enter a password.", abort: true })
  .min(8, "Use at least 8 characters.");

/** The /register form (docs/08 > /register). */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ error: "The passwords don't match." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "The passwords don't match.",
    path: ["confirmPassword"],
  });

/**
 * The /login form (docs/08 > /login). Both fields are only checked for being
 * there: a wrong email or password gets one message from the action, so the
 * form never hints which one was wrong (TC-51).
 */
export const loginSchema = z.object({
  email: z
    .string({ error: "Enter your email." })
    .trim()
    .toLowerCase()
    .min(1, "Enter your email."),
  password: z
    .string({ error: "Enter your password." })
    .min(1, "Enter your password."),
});
