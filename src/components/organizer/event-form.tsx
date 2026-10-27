"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

// The event form (docs/08 > Event form), the same for create and edit. Both
// actions redirect to the overview on success, which shows the toast; a
// failure comes back with field errors and the submitted values.

export type EventFormValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  maxTeamSize: string;
};

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial: EventFormValues;
  submitLabel: string;
  /** Where Cancel goes when there's no page to go back to. */
  cancelHref: string;
};

export function EventForm({ action, initial, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const failed = state?.ok === false ? state : null;
  const values = { ...initial, ...failed?.values };
  const errorsFor = (field: keyof EventFormValues) =>
    failed?.fieldErrors?.[field]?.map((message) => ({ message }));

  function leave() {
    // Back to where the user came from; a page opened directly has no history.
    if (window.history.length > 1) router.back();
    else router.push(cancelHref);
  }

  function cancel() {
    // A refused save still holds the values that weren't saved.
    if (dirty || failed) setConfirming(true);
    else leave();
  }

  return (
    <form
      action={formAction}
      onChange={() => setDirty(true)}
      // The server's messages are the ones from the spec, so skip the browser's.
      noValidate
      className="flex max-w-2xl flex-col gap-6"
    >
      {failed?.formError && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden />
          <AlertDescription>{failed.formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <TextField
          name="name"
          label="Name"
          defaultValue={values.name}
          errors={errorsFor("name")}
          maxLength={100}
          required
        />

        <Field data-invalid={!!errorsFor("description")}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            defaultValue={values.description}
            rows={6}
            maxLength={2000}
            required
            aria-invalid={!!errorsFor("description")}
            aria-describedby={
              errorsFor("description") ? "description-error" : undefined
            }
          />
          <FieldError
            id="description-error"
            errors={errorsFor("description")}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            name="startDate"
            label="Start date"
            type="date"
            defaultValue={values.startDate}
            errors={errorsFor("startDate")}
            required
          />
          <TextField
            name="endDate"
            label="End date"
            type="date"
            defaultValue={values.endDate}
            errors={errorsFor("endDate")}
            description="The same day as the start is fine."
            required
          />
        </div>

        <TextField
          name="maxTeamSize"
          label="Max team size"
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          step={1}
          className="max-w-28"
          defaultValue={values.maxTeamSize}
          errors={errorsFor("maxTeamSize")}
          description="From 1 to 10 people."
          required
        />
      </FieldGroup>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 px-4 md:h-9"
          onClick={cancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-11 px-4 md:h-9" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              What you&apos;ve entered on this form won&apos;t be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={leave}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function TextField({
  name,
  label,
  description,
  errors,
  className,
  ...input
}: React.ComponentProps<typeof Input> & {
  name: keyof EventFormValues;
  label: string;
  description?: string;
  errors?: { message: string }[];
}) {
  const invalid = !!errors?.length;
  const describedBy = [
    description && `${name}-description`,
    invalid && `${name}-error`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        className={className}
        aria-invalid={invalid}
        aria-describedby={describedBy || undefined}
        {...input}
      />
      {description && (
        <FieldDescription id={`${name}-description`}>
          {description}
        </FieldDescription>
      )}
      <FieldError id={`${name}-error`} errors={errors} />
    </Field>
  );
}
