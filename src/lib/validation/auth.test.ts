import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  emailSchema,
  loginSchema,
  passwordSchema,
  registerSchema,
} from "@/lib/validation/auth";

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message);

describe("emailSchema", () => {
  it("trims and lowercases the email", () => {
    expect(emailSchema.parse("  Organizer@HackHub.Test ")).toBe(
      "organizer@hackhub.test",
    );
  });

  it("asks for an email when it is empty or missing", () => {
    expect(messages(emailSchema.safeParse("   "))).toEqual([
      "Enter your email.",
    ]);
    expect(messages(emailSchema.safeParse(undefined))).toEqual([
      "Enter your email.",
    ]);
  });

  it("rejects a malformed email", () => {
    expect(messages(emailSchema.safeParse("not-an-email"))).toEqual([
      "Enter a valid email address, like name@example.com.",
    ]);
  });
});

describe("passwordSchema", () => {
  it("accepts 8 characters and refuses 7", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
    expect(messages(passwordSchema.safeParse("1234567"))).toEqual([
      "Use at least 8 characters.",
    ]);
  });

  it("gives one message for an empty password", () => {
    expect(messages(passwordSchema.safeParse(""))).toEqual([
      "Enter a password.",
    ]);
  });
});

const fieldErrors = (result: { error?: z.ZodError }) =>
  result.error ? z.flattenError(result.error).fieldErrors : undefined;

describe("registerSchema", () => {
  it("lowercases the email (TC-45)", () => {
    const result = registerSchema.parse({
      email: " Ana@Example.com ",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.email).toBe("ana@example.com");
  });

  it("refuses a password under 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "ana@example.com",
      password: "1234567",
      confirmPassword: "1234567",
    });
    expect(fieldErrors(result)).toEqual({
      password: ["Use at least 8 characters."],
    });
  });

  it("refuses a confirmation that doesn't match", () => {
    const result = registerSchema.safeParse({
      email: "ana@example.com",
      password: "12345678",
      confirmPassword: "12345679",
    });
    expect(fieldErrors(result)).toEqual({
      confirmPassword: ["The passwords don't match."],
    });
  });

  it("names every missing field", () => {
    const result = registerSchema.safeParse({});
    expect(fieldErrors(result)).toMatchObject({
      email: ["Enter your email."],
      password: ["Enter a password."],
    });
  });
});

describe("loginSchema", () => {
  it("lowercases the email so either spelling logs in", () => {
    expect(
      loginSchema.parse({ email: "ANA@example.COM", password: "x" }).email,
    ).toBe("ana@example.com");
  });

  it("asks for both fields", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(fieldErrors(result)).toEqual({
      email: ["Enter your email."],
      password: ["Enter your password."],
    });
  });
});
