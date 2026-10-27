"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import {
  type ActionState,
  fromZodError,
  isUniqueViolation,
  RuleError,
} from "@/lib/action-state";
import { requireRole, requireTeamMember } from "@/lib/auth/dal";
import { canSubmit } from "@/lib/domain/event-state";
import { prisma } from "@/lib/prisma";
import {
  readSubmissionForm,
  submissionSchema,
} from "@/lib/validation/submission";

const CLOSED = "Submissions are closed for this event.";

// Submit or update the team's project (docs/08 > Submit project, #7). One
// submission per team, upserted while submissions are open (docs/02 >
// Submissions). The event id is bound by the page; the team always comes from
// the signed-in user's membership, never from the form.
export async function submitProject(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("PARTICIPANT");
  const team = await requireTeamMember(eventId); // no team → the team page

  const raw = readSubmissionForm(formData);
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    const result = fromZodError(parsed.error);
    return result?.ok === false ? { ...result, values: raw } : result;
  }

  let outcome: "missing" | "created" | "updated";
  try {
    outcome = await prisma.$transaction(async (tx) => {
      // Hold the event row so "close submissions" can't slip in between the
      // check and the write.
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId} FOR SHARE`;
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { submissionsOpen: true, resultsPublished: true },
      });
      if (!event) return "missing";
      if (!canSubmit(event)) throw new RuleError(CLOSED);

      const existing = await tx.submission.findUnique({
        where: { teamId: team.id },
        select: { id: true },
      });
      await tx.submission.upsert({
        where: { teamId: team.id },
        create: { teamId: team.id, ...parsed.data },
        update: parsed.data,
      });
      return existing ? "updated" : "created";
    });
  } catch (e) {
    if (e instanceof RuleError) {
      return { ok: false, formError: e.message, values: raw };
    }
    // Two teammates submitting for the first time at the same moment: the
    // other one's row won. Ask this one to look at it before saving again.
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        formError:
          "Your team submitted a moment ago. Reload the page to see it before saving again.",
        values: raw,
      };
    }
    throw e;
  }
  if (outcome === "missing") notFound();

  revalidatePath(`/events/${eventId}/team`);
  revalidatePath(`/events/${eventId}/team/submit`);
  return {
    ok: true,
    message:
      outcome === "created" ? "Project submitted." : "Submission updated.",
  };
}
