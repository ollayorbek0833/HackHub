"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action-state";
import { DUPLICATE_EMAIL } from "@/lib/auth/messages";

import { fieldErrorsFor } from "./field-errors";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

export function RegisterForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const failed = state?.ok === false ? state : null;
  const errors = fieldErrorsFor(failed);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {failed?.formError && (
        <Alert variant="destructive">
          <AlertDescription>
            {failed.formError === DUPLICATE_EMAIL ? (
              <>
                An account with this email already exists.{" "}
                <Link href="/login" className="font-medium underline">
                  Log in instead.
                </Link>
              </>
            ) : (
              failed.formError
            )}
          </AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11"
            defaultValue={failed?.values?.email}
            aria-invalid={!!errors.email}
          />
          <FieldError errors={errors.email} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-11"
            aria-invalid={!!errors.password}
            aria-describedby="password-rule"
          />
          {/* The rule is shown before the user types (docs/08 > /register). */}
          <FieldDescription id="password-rule">
            At least 8 characters.
          </FieldDescription>
          <FieldError errors={errors.password} />
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="h-11"
            aria-invalid={!!errors.confirmPassword}
          />
          <FieldError errors={errors.confirmPassword} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={pending} className="h-11 text-base">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
