import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  ProfileCard,
  ProfileCardSkeleton,
} from "@/components/profile/profile-card";
import { requireUser } from "@/lib/auth/dal";
import { canSeePhone } from "@/lib/domain/profile";
import { prisma } from "@/lib/prisma";

// Any signed-in user can view any profile, read-only (Decision 12). The
// phone is only read for the owner and for an organizer of an event the
// owner registered for (canSeePhone); everyone else gets null, so it never
// reaches their page. The session and params are read inside Suspense
// because Cache Components is on.

export default function ProfilePage({
  params,
}: PageProps<"/profile/[userId]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<ProfileCardSkeleton />}>
        <UserProfile params={params} />
      </Suspense>
    </main>
  );
}

async function UserProfile({
  params,
}: Pick<PageProps<"/profile/[userId]">, "params">) {
  const viewer = await requireUser();
  const { userId } = await params;
  // One small lookup, for organizers only: is this person registered for
  // any event the viewer created?
  const sharedRegistration =
    viewer.role === "ORGANIZER" && viewer.id !== userId
      ? await prisma.eventRegistration.findFirst({
          where: { userId, event: { createdById: viewer.id } },
          select: { id: true },
        })
      : null;
  const showPhone = canSeePhone({
    viewerId: viewer.id,
    viewerRole: viewer.role,
    ownerId: userId,
    ownerRegisteredWithViewerEvent: sharedRegistration !== null,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      profile: {
        select: {
          name: true,
          faculty: true,
          phone: showPhone,
          skills: true,
          bio: true,
          links: true,
        },
      },
    },
  });
  if (!user) notFound();

  const profile = user.profile && {
    ...user.profile,
    phone: showPhone ? (user.profile.phone ?? null) : null,
  };

  return (
    <ProfileCard
      user={{ role: user.role, profile }}
      isOwn={viewer.id === userId}
    />
  );
}
