"use client";

import { LogInIcon, PlusIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  fieldError,
  previousValue,
  useToastAction,
  type FormAction,
} from "./use-toast-action";

// The two forms of the "no team" state on /events/[eventId]/team (docs/08 >
// My team). Each is one field and one button; the page shows them side by side
// with equal weight.

export function CreateTeamForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useToastAction(action);
  const error = fieldError(state, "name");

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.ok === false && state.formError && (
        <Alert variant="destructive">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="team-name">Team name</FieldLabel>
        <Input
          id="team-name"
          name="name"
          autoComplete="off"
          maxLength={40}
          required
          defaultValue={previousValue(state, "name")}
          aria-invalid={Boolean(error)}
          aria-describedby="team-name-help"
          className="h-11"
        />
        <FieldDescription id="team-name-help">
          2–40 characters. You become the first member.
        </FieldDescription>
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 w-full text-base"
      >
        <PlusIcon aria-hidden />
        {pending ? "Creating…" : "Create team"}
      </Button>
    </form>
  );
}

export function JoinTeamForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useToastAction(action);
  const error = fieldError(state, "code");

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.ok === false && state.formError && (
        <Alert variant="destructive">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="invite-code">Invite code</FieldLabel>
        <Input
          id="invite-code"
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={10}
          required
          defaultValue={previousValue(state, "code")}
          aria-invalid={Boolean(error)}
          aria-describedby="invite-code-help"
          className="h-11 font-mono text-lg tracking-[0.3em] uppercase"
        />
        <FieldDescription id="invite-code-help">
          The 6-character code from your team. Upper or lower case both work.
        </FieldDescription>
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 w-full text-base"
      >
        <LogInIcon aria-hidden />
        {pending ? "Joining…" : "Join team"}
      </Button>
    </form>
  );
}
