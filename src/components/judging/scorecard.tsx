"use client";

import { XIcon } from "lucide-react";
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";

import { SavedTick } from "@/components/feedback/saved-tick";
import { ActionDock } from "@/components/layout/action-dock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action-state";
import { useActionResult } from "@/lib/forms/use-action-result";
import { cn } from "@/lib/utils";

import { canExtend, DIGIT_WINDOW_MS, typeDigit } from "./score-keys";

export type ScoreRow = {
  id: string;
  /** The input name, "score:<criterionId>". */
  field: string;
  name: string;
  weightPercent: number;
  maxScore: number;
  value: number | null;
};

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  criteria: ScoreRow[];
  /** "26 Oct 2026, 14:05", or null before the first save. */
  lastSaved: string | null;
};

/** Above this max the buttons get too many; the criterion takes a typed number instead. */
const MAX_BUTTONS = 20;

const LEAVE_WARNING = "Leave without saving your scores?";

/**
 * The scorecard (redesign > Judging): each criterion as number buttons from 0
 * to its max. Keys 0–9 set the focused criterion, arrows step, Backspace
 * clears, Enter is "Save and next". A criterion can stay empty ("In
 * progress"). Every value is posted as typed and checked again by saveScores.
 */
export function Scorecard({ action, criteria, lastSaved }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(criteria));
  const [savedValues, setSavedValues] = useState(() => initialValues(criteria));
  const nextButton = useRef<HTMLButtonElement>(null);
  const failed = state?.ok === false ? state : null;

  const dirty = criteria.some((c) => (values[c.id] ?? "") !== (savedValues[c.id] ?? ""));
  const scoredCount = criteria.filter((c) => (values[c.id] ?? "") !== "").length;

  // After a save the posted values are the saved ones. Adjusting state while
  // rendering (not in an effect) when a new result arrives.
  const [seenState, setSeenState] = useState(state);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) {
      setSavedValues(values);
      setSavedAt((n) => (n ?? 0) + 1);
    }
  }

  useActionResult(state, (result) => {
    if (result.ok) toast.success("Scores saved.");
  });

  // "Leave without saving your scores?": on closing the tab, and on links
  // inside the app (the queue, the header) while there are unsaved scores.
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank" || e.defaultPrevented) return;
      // In-page links (e.g. "Skip to the scorecard") don't leave the page.
      if (link.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm(LEAVE_WARNING)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const setValue = useCallback((id: string, value: string) => {
    setValues((current) => ({ ...current, [id]: value }));
  }, []);

  const saveAndNext = useCallback(() => {
    const button = nextButton.current;
    if (button && !button.disabled) button.form?.requestSubmit(button);
  }, []);

  return (
    <form action={formAction} noValidate aria-describedby="scorecard-keys" className="flex flex-col gap-5">
      {failed?.formError && (
        <Alert variant="destructive">
          <AlertDescription>{failed.formError}</AlertDescription>
        </Alert>
      )}

      <p id="scorecard-keys" className="hidden text-sm text-muted-foreground md:block">
        Keys <Kbd>0</Kbd>–<Kbd>9</Kbd> score the focused criterion, <Kbd>←</Kbd> <Kbd>→</Kbd> step,{" "}
        <Kbd>Backspace</Kbd> clears, <Kbd>Enter</Kbd> saves and opens the next team.
      </p>

      <ol className="flex flex-col gap-4">
        {criteria.map((c) => (
          <li key={c.id}>
            <CriterionScore
              criterion={c}
              value={values[c.id] ?? ""}
              onChange={(v) => setValue(c.id, v)}
              onEnter={saveAndNext}
              errors={failed?.fieldErrors?.[c.field]}
            />
          </li>
        ))}
      </ol>

      <div className="flex min-h-6 items-center text-sm text-muted-foreground">
        <SavedTick savedAt={dirty ? null : savedAt} className="[&:not(:empty)]:mr-3" />
        <p aria-live="polite">
          {dirty
            ? "Unsaved changes"
            : savedAt
              ? null
              : lastSaved
                ? `Last saved ${lastSaved}`
                : "Not saved yet. You can leave a criterion empty and come back to it."}
        </p>
        <span className="ml-auto pl-3 font-mono tabular-nums">
          {scoredCount}/{criteria.length}
          <span className="sr-only"> criteria scored</span>
        </span>
      </div>

      {/* On phones the actions dock above the tab bar (ActionDock). */}
      <ActionDock className="flex-row md:gap-2">
        <Button
          type="submit"
          name="intent"
          value="save"
          variant="outline"
          disabled={pending}
          className="h-11 flex-1 px-5 md:flex-none"
        >
          Save
        </Button>
        <Button
          ref={nextButton}
          type="submit"
          name="intent"
          value="next"
          disabled={pending}
          className="h-11 flex-[2] px-6 md:flex-none"
        >
          {pending ? "Saving…" : "Save and next"}
        </Button>
      </ActionDock>
    </form>
  );
}

function initialValues(criteria: ScoreRow[]): Record<string, string> {
  return Object.fromEntries(criteria.map((c) => [c.id, c.value === null ? "" : String(c.value)]));
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </kbd>
  );
}

/** One criterion: its name, weight and range, and the number buttons (or a typed number). */
function CriterionScore({
  criterion: c,
  value,
  onChange,
  onEnter,
  errors,
}: {
  criterion: ScoreRow;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  errors?: string[];
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const invalid = !!errors?.length;
  const buffer = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const group = useRef<HTMLDivElement>(null);
  const useButtons = c.maxScore <= MAX_BUTTONS;
  const numeric = /^\d+$/.test(value) ? Number(value) : null;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const focusValue = (v: number) => {
    group.current?.querySelector<HTMLButtonElement>(`[data-score="${v}"]`)?.focus();
  };

  const select = (v: number | null) => {
    onChange(v === null ? "" : String(v));
    // Focus moves now, not after the re-render, so a key pressed straight
    // after (Tab, another digit) acts from the chosen score.
    if (v !== null) focusValue(v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const typed = typeDigit(buffer.current, e.key, c.maxScore);
      if (!typed) return;
      buffer.current = canExtend(typed.buffer, c.maxScore) ? typed.buffer : "";
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => (buffer.current = ""), DIGIT_WINDOW_MS);
      select(typed.value);
      return;
    }
    buffer.current = "";
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        select(numeric === null ? 0 : Math.min(c.maxScore, numeric + 1));
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        select(numeric === null ? 0 : Math.max(0, numeric - 1));
        break;
      case "Home":
        e.preventDefault();
        select(0);
        break;
      case "End":
        e.preventDefault();
        select(c.maxScore);
        break;
      case "Backspace":
      case "Delete":
        e.preventDefault();
        onChange("");
        break;
      case "Enter":
        e.preventDefault();
        onEnter();
        break;
    }
  };

  const scores = Array.from({ length: c.maxScore + 1 }, (_, i) => i);
  // The one button in the tab order: the chosen score, or 0 before any.
  const tabStop = numeric !== null && numeric <= c.maxScore ? numeric : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3">
        <span id={labelId} className="min-w-0 flex-1 font-medium break-words">
          {c.name}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {c.weightPercent}%<span className="sr-only"> of the total, score from 0 to {c.maxScore}</span>
          </span>
        </span>
        <span aria-hidden className="font-mono text-sm text-muted-foreground tabular-nums">
          <span className={cn(numeric !== null && "text-foreground")}>{value === "" ? "–" : value}</span>{" "}
          / {c.maxScore}
        </span>
      </div>

      {/* Always posted, exactly as chosen or typed: saveScores checks it. */}
      {useButtons && <input type="hidden" name={c.field} value={value} />}

      {useButtons ? (
        <div className="flex items-start gap-2">
          <div
            ref={group}
            role="radiogroup"
            aria-labelledby={labelId}
            aria-describedby={invalid ? errorId : undefined}
            aria-invalid={invalid || undefined}
            onKeyDown={onKeyDown}
            // Phones: a 6-column grid. From sm: a wrapping row that may shrink
            // to its column (min-w-0), capped at 11 buttons a line (11 × 2.75rem
            // + 10 gaps × 0.375rem = 34rem): 0–10 stays one line, and 0–20
            // wraps as 0–10 / 11–20 with the clear button right after.
            className="grid flex-1 grid-cols-6 gap-1.5 sm:flex sm:max-w-[34rem] sm:min-w-0 sm:flex-initial sm:flex-wrap"
          >
            {scores.map((score) => {
              const checked = numeric === score;
              return (
                <button
                  key={score}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  data-score={score}
                  tabIndex={score === tabStop ? 0 : -1}
                  onClick={() => {
                    buffer.current = "";
                    select(score);
                  }}
                  className={cn(
                    "h-11 rounded-lg border font-mono text-base tabular-nums outline-none sm:w-11",
                    "motion-safe:transition-[background-color,color,transform] motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-95",
                    "focus-visible:relative focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50",
                    checked
                      ? "border-foreground bg-foreground font-semibold text-background"
                      : "border-input text-foreground hover:bg-accent",
                    invalid && !checked && "border-destructive/60",
                  )}
                >
                  {score}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            disabled={value === ""}
            aria-label={`Clear the ${c.name} score`}
            // Out of the tab order: Tab moves criterion to criterion, and
            // Backspace or Delete clears from the keyboard.
            tabIndex={-1}
            className="size-11 shrink-0 text-muted-foreground"
          >
            <XIcon aria-hidden />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Input
            name={c.field}
            // Text, not type="number": a number input posts "" for junk like
            // "1e", which would read as "left empty" and delete the score.
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              }
            }}
            aria-labelledby={labelId}
            aria-describedby={invalid ? errorId : undefined}
            aria-invalid={invalid || undefined}
            className="h-11 w-28 font-mono tabular-nums"
          />
          <span className="font-mono text-sm text-muted-foreground tabular-nums">0–{c.maxScore}</span>
        </div>
      )}

      <FieldError id={errorId} errors={errors?.map((message) => ({ message }))} />
    </div>
  );
}
