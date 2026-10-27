"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fromZodError, RuleError, type ActionState } from "@/lib/action-state";
import { requireEvent, requireRole } from "@/lib/auth/dal";
import { validateEventDates } from "@/lib/domain/event-state";
import { prisma } from "@/lib/prisma";
import {
  END_BEFORE_START,
  eventSchema,
  readEventForm,
  withDateOrderError,
} from "@/lib/validation/event";

/**
 * Saves the event's details. The new max team size can't be below the largest
 * current team (docs/07 > Transactions > Edit event). Then the overview, with
 * the "Event saved." toast.
 */
export async function updateEvent(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ORGANIZER");
  await requireEvent(eventId);

  const values = readEventForm(formData);
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) {
    const result = fromZodError(parsed.error);
    const fieldErrors = result?.ok === false ? result.fieldErrors : undefined;
    return {
      ok: false,
      fieldErrors: withDateOrderError(fieldErrors, values),
      values,
    };
  }
  const data = parsed.data;

  if (!validateEventDates(data.startDate, data.endDate)) {
    return { ok: false, fieldErrors: { endDate: [END_BEFORE_START] }, values };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Lock the event's teams: joining a team locks its row first (#6), so
      // nobody can join between counting the members and saving the new max.
      await tx.$queryRaw`SELECT id FROM teams WHERE event_id = ${eventId} FOR UPDATE`;
      const largest = await tx.team.findFirst({
        where: { eventId },
        orderBy: { members: { _count: "desc" } },
        select: { name: true, _count: { select: { members: true } } },
      });
      const n = largest?._count.members ?? 0;
      if (largest && n > data.maxTeamSize) {
        throw new RuleError(
          `${largest.name} already has ${n} members, so the max can't be lower than ${n}.`,
        );
      }
      await tx.event.update({ where: { id: eventId }, data });
    });
  } catch (e) {
    // The only rule here is about the team size, so show it under that field.
    if (e instanceof RuleError) {
      return { ok: false, fieldErrors: { maxTeamSize: [e.message] }, values };
    }
    throw e;
  }

  revalidatePath("/organizer");
  redirect(`/organizer/events/${eventId}?saved=updated`);
}
