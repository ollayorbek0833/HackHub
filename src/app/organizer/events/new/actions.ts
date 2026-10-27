"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth/dal";
import { validateEventDates } from "@/lib/domain/event-state";
import { prisma } from "@/lib/prisma";
import {
  END_BEFORE_START,
  eventSchema,
  readEventForm,
  withDateOrderError,
} from "@/lib/validation/event";

/**
 * Creates an event with registration closed, so it stays off /events until the
 * organizer opens it (TC-27). Then the overview, with the "Event created" toast.
 */
export async function createEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("ORGANIZER");

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

  const event = await prisma.event.create({
    data: { ...data, registrationOpen: false, createdById: user.id },
    select: { id: true },
  });

  revalidatePath("/organizer");
  redirect(`/organizer/events/${event.id}?saved=created`);
}
