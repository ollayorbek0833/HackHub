import { z } from "zod";

// The /judge/teams/[teamId] scoring form. Each criterion's input is named
// "score:<criterionId>"; the range check needs the criterion's maxScore from
// the database, so it is parseScore() in lib/domain/scoring.ts.

const SCORE_PREFIX = "score:";

/** The input name for a criterion's score. */
export function scoreFieldName(criterionId: string) {
  return `${SCORE_PREFIX}${criterionId}`;
}

export const scoresFormSchema = z.object({
  /** Typed scores by criterion id, as strings ("" = not scored). */
  scores: z.record(z.string().min(1), z.string().max(20)),
  /** Which button was used: "Save scores" or "Save and go to next team". */
  intent: z.enum(["save", "next"]).catch("save"),
});

/** The scoring form's fields in the shape scoresFormSchema expects. */
export function scoresFormInput(formData: FormData) {
  const scores: Record<string, unknown> = {};
  for (const [name, value] of formData.entries()) {
    if (name.startsWith(SCORE_PREFIX)) scores[name.slice(SCORE_PREFIX.length)] = value;
  }
  return { scores, intent: formData.get("intent") };
}
