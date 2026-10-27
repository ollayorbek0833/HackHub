import { Suspense } from "react";

import {
  ProfileForm,
  type ProfileFormValues,
} from "@/components/profile/profile-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

import { saveProfile } from "./actions";

// The signed-in user's own profile, for every role (docs/08 > /profile, #4).
// The session is read inside Suspense because Cache Components is on.

const ROLE_LABEL: Record<Role, string> = {
  PARTICIPANT: "Participant",
  JUDGE: "Judge",
  ORGANIZER: "Organizer",
};

export default function MyProfilePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Suspense fallback={<MyProfileSkeleton />}>
        <MyProfile />
      </Suspense>
    </main>
  );
}

async function MyProfile() {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { name: true, faculty: true, skills: true, bio: true, links: true },
  });

  const initial: ProfileFormValues = {
    name: profile?.name ?? "",
    faculty: profile?.faculty ?? "",
    skills: profile?.skills ?? [],
    bio: profile?.bio ?? "",
    links: profile?.links ?? [],
  };
  const incomplete = !initial.name.trim() || !initial.faculty.trim();

  return (
    <div className="flex flex-col gap-4">
      {incomplete && (
        <Alert>
          <AlertDescription>
            Add your name and faculty to finish your profile. You need them to
            register for events.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">My profile</h1>
          </CardTitle>
          <CardDescription>
            Other signed-in users see this on your team and in rankings.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">{user.email}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Role</dt>
              <dd>{ROLE_LABEL[user.role]}</dd>
            </div>
          </dl>

          <ProfileForm
            action={saveProfile}
            initial={initial}
            goToEventsAfterSave={!profile && user.role === "PARTICIPANT"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MyProfileSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}
