"use server";

import { revalidatePath } from "next/cache";

import { isUniqueViolation, RuleError, type ActionState } from "@/lib/action-state";
import { requireEvent, requireRole } from "@/lib/auth/dal";
import {
  CRITERIA_MESSAGES,
  isCriteriaLocked,
  validateCriteria,
  type CriteriaIssue,
} from "@/lib/domain/criteria";
import { prisma } from "@/lib/prisma";
import {
  criteriaFieldErrors,
  criteriaRowsFromFormData,
  criteriaSchema,
  rowErrorKey,
} from "@/lib/validation/criteria";

/** validateCriteria said no; carries the issues out of the transaction. */
class InvalidCriteria extends Error {
  constructor(readonly issues: CriteriaIssue[]) {
    super("Invalid criteria");
  }
}

/**
 * Saves the whole list at once (docs/07 > Transactions > Save criteria). The
 * event id is bound by the page, but anyone can call this with any id, so the
 * role and the event are checked here.
 */
export async function saveCriteria(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ORGANIZER");
  await requireEvent(eventId);

  const parsed = criteriaSchema.safeParse(criteriaRowsFromFormData(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: criteriaFieldErrors(parsed.error) };
  }
  const list = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const scoreCount = await tx.score.count({
        where: { criterion: { eventId } },
      });
      if (isCriteriaLocked(scoreCount)) {
        throw new RuleError(CRITERIA_MESSAGES.locked);
      }

      const issues = validateCriteria(list);
      if (issues.length > 0) throw new InvalidCriteria(issues);

      // Replace the list, so a half-saved total is never visible. createdAt
      // is spaced by a millisecond per row to keep the organizer's order.
      await tx.criterion.deleteMany({ where: { eventId } });
      const now = Date.now();
      await tx.criterion.createMany({
        data: list.map((criterion, i) => ({
          eventId,
          name: criterion.name,
          weightPercent: criterion.weightPercent,
          maxScore: criterion.maxScore,
          createdAt: new Date(now + i),
        })),
      });
    });
  } catch (e) {
    if (e instanceof RuleError) return { ok: false, formError: e.message };
    if (e instanceof InvalidCriteria) return issuesToState(e.issues);
    if (isUniqueViolation(e)) {
      return { ok: false, formError: CRITERIA_MESSAGES.duplicateName };
    }
    throw e;
  }

  revalidatePath(`/organizer/events/${eventId}`, "layout");
  return { ok: true };
}

function issuesToState(issues: CriteriaIssue[]): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  let formError: string | undefined;
  for (const issue of issues) {
    if (issue.row === undefined || issue.field === undefined) {
      formError ??= issue.message;
      continue;
    }
    const key = rowErrorKey(issue.row, issue.field);
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return { ok: false, fieldErrors, formError };
}
