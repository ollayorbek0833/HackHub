"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action-state";

// The submit form (docs/08 > Submit project). Fields are controlled so the
// values survive React's form reset after the action returns; the server's
// result is the one that counts.

export type SubmissionValues = {
  title: string;
  description: string;
  repoUrl: string;
};

const MAX_DESCRIPTION = 2000;

export function SubmissionForm({
  action,
  initial,
  teamHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  /** The saved submission, or null before the team's first submit. */
  initial: SubmissionValues | null;
  /** Where the first submit goes on to (the team page). */
  teamHref: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  // Read once: the page re-renders with the saved row in the same update as
  // the action's result.
  const [isFirstSubmit] = useState(initial === null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? "");

  useEffect(() => {
    if (!state?.ok) return;
    toast.success(state.message);
    if (isFirstSubmit) router.push(teamHref);
  }, [state, isFirstSubmit, router, teamHref]);

  const errors = state?.ok === false ? (state.fieldErrors ?? {}) : {};
  const fieldError = (key: string) =>
    errors[key]?.map((message) => ({ message }));

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state?.ok === false && state.formError && (
        <Alert variant="destructive">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="title">Project title</FieldLabel>
          <Input
            id="title"
            name="title"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errors.title}
          />
          <FieldError errors={fieldError("title")} />
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={8}
            className="min-h-40"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errors.description}
            aria-describedby="description-count"
          />
          <FieldDescription id="description-count" aria-live="polite">
            {description.length} / {MAX_DESCRIPTION} characters
          </FieldDescription>
          <FieldError errors={fieldError("description")} />
        </Field>

        <Field data-invalid={!!errors.repoUrl}>
          <FieldLabel htmlFor="repoUrl">Repository link</FieldLabel>
          <Input
            id="repoUrl"
            name="repoUrl"
            type="url"
            inputMode="url"
            placeholder="https://github.com/team/project"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            aria-invalid={!!errors.repoUrl}
          />
          <FieldError errors={fieldError("repoUrl")} />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="min-h-11 self-start md:min-h-9"
        >
          {pending
            ? "Saving…"
            : isFirstSubmit
              ? "Submit project"
              : "Save changes"}
        </Button>
        {isFirstSubmit && (
          <p className="text-muted-foreground text-sm">
            Submitting locks your team: nobody can join or leave after this.
          </p>
        )}
      </div>
    </form>
  );
}
