"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action-state";

import { fieldErrorsFor } from "./field-errors";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  /** Where to go after logging in; checked again on the server. */
  callbackUrl: string | null;
};

export function LoginForm({ action, callbackUrl }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const failed = state?.ok === false ? state : null;
  const errors = fieldErrorsFor(failed);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {failed?.formError && (
        <Alert variant="destructive">
          <AlertDescription>{failed.formError}</AlertDescription>
        </Alert>
      )}

      {callbackUrl && (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
            autoComplete="current-password"
            required
            className="h-11"
            aria-invalid={!!errors.password}
          />
          <FieldError errors={errors.password} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={pending} className="h-11 text-base">
        {pending ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to HackHub?{" "}
        <Link href="/register" className="font-medium text-foreground underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
