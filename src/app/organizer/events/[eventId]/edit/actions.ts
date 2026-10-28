"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fromZodError, RuleError, type ActionState } from "@/lib/action-state";
import { requireOwnedEvent } from "@/lib/auth/dal";
import { validateEventDates } from "@/lib/domain/event-state";
import { prisma } from "@/lib/prisma";
import {
  deleteUploads,
  PATH_COLUMN,
  readEventImages,
  storeEventImages,
} from "@/lib/uploads/event-images";
import {
  END_BEFORE_START,
  eventSchema,
  readEventForm,
  withDateOrderError,
} from "@/lib/validation/event";

/**
 * Saves the event's details and images. The new max team size can't be below
 * the largest current team (docs/07 > Transactions > Edit event). A replaced
 * or removed image's file is deleted once the database update has succeeded.
 * Then the overview, with the "Event saved." toast.
 */
export async function updateEvent(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Only the organizer who created the event; anyone else gets not-found.
  const { user } = await requireOwnedEvent(eventId);

  const values = readEventForm(formData);
  const parsed = eventSchema.safeParse(values);
  const images = await readEventImages(formData);
  if (!parsed.success) {
    const result = fromZodError(parsed.error);
    const fieldErrors = result?.ok === false ? result.fieldErrors : undefined;
    return {
      ok: false,
      fieldErrors: {
        ...withDateOrderError(fieldErrors, values),
        ...images.fieldErrors,
      },
      values,
    };
  }
  const data = parsed.data;

  const dateErrors: Record<string, string[]> = validateEventDates(
    data.startDate,
    data.endDate,
  )
    ? {}
    : { endDate: [END_BEFORE_START] };
  if (
    Object.keys(dateErrors).length ||
    Object.keys(images.fieldErrors).length
  ) {
    return {
      ok: false,
      fieldErrors: { ...dateErrors, ...images.fieldErrors },
      values,
    };
  }

  // New files first, under fresh random names, so the update can point at them.
  const added = await storeEventImages(eventId, images.images);
  const removed = Object.fromEntries(
    images.remove.map((kind) => [PATH_COLUMN[kind], null]),
  );

  let previous: { logoPath: string | null; bannerPath: string | null };
  try {
    previous = await prisma.$transaction(async (tx) => {
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
      const before = await tx.event.findUniqueOrThrow({
        where: { id: eventId, createdById: user.id },
        select: { logoPath: true, bannerPath: true },
      });
      await tx.event.update({
        where: { id: eventId },
        data: { ...data, ...removed, ...added },
      });
      return before;
    });
  } catch (e) {
    // Nothing points at the new files, so they go.
    await deleteUploads(Object.values(added));
    // The only rule here is about the team size, so show it under that field.
    if (e instanceof RuleError) {
      return { ok: false, fieldErrors: { maxTeamSize: [e.message] }, values };
    }
    throw e;
  }

  // The update succeeded: the old files of replaced or removed images go.
  await deleteUploads(
    (["logoPath", "bannerPath"] as const)
      .filter((column) => column in added || column in removed)
      .map((column) => previous[column]),
  );

  revalidatePath("/organizer");
  redirect(`/organizer/events/${eventId}?saved=updated`);
}
