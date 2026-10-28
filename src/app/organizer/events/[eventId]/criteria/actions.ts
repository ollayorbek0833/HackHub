"use server";

import { revalidatePath } from "next/cache";

import { isUniqueViolation, RuleError, type ActionState } from "@/lib/action-state";
import { requireOwnedEvent } from "@/lib/auth/dal";
import { CRITERIA_MESSAGES, type CriteriaIssue } from "@/lib/domain/criteria";
import { prisma } from "@/lib/prisma";
import { InvalidCriteria, replaceCriteria } from "@/lib/transactions/save-criteria";
import {
  criteriaFieldErrors,
  criteriaRowsFromFormData,
  criteriaSchema,
  rowErrorKey,
} from "@/lib/validation/criteria";

/**
 * Saves the whole list at once (docs/07 > Transactions > Save criteria). The
 * event id is bound by the page, but anyone can call this with any id, so the
 * role and the event's owner are checked here: only the organizer who created
 * the event can change its criteria. The transaction is in
 * lib/transactions/save-criteria.ts.
 */
export async function saveCriteria(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwnedEvent(eventId);

  const parsed = criteriaSchema.safeParse(criteriaRowsFromFormData(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: criteriaFieldErrors(parsed.error) };
  }
  const list = parsed.data;

  try {
    await prisma.$transaction((tx) => replaceCriteria(tx, eventId, list));
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
