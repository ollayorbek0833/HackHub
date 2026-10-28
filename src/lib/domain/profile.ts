import type { Role } from "@/generated/prisma/enums";

// Who may see a profile's phone. /profile/[userId] is open to every
// signed-in user (Decision 12), but the phone is for an organizer to reach a
// team (docs/08 > /profile/[userId]): only the owner and the organizers of
// events the owner registered for see it. Being an organizer isn't enough on
// its own. `ownerRegisteredWithViewerEvent` is true when the owner is
// registered for at least one event the viewer created; the caller only
// looks it up for organizers.
export function canSeePhone({
  viewerId,
  viewerRole,
  ownerId,
  ownerRegisteredWithViewerEvent,
}: {
  viewerId: string;
  viewerRole: Role;
  ownerId: string;
  ownerRegisteredWithViewerEvent: boolean;
}): boolean {
  if (viewerId === ownerId) return true;
  return viewerRole === "ORGANIZER" && ownerRegisteredWithViewerEvent;
}
