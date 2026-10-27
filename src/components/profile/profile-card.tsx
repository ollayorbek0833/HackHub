import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/generated/prisma/enums";

// The read-only profile from docs/08 > /profile/[userId] (Decision 12). The
// email is never shown here.

const ROLE_LABEL: Record<Role, string> = {
  PARTICIPANT: "Participant",
  JUDGE: "Judge",
  ORGANIZER: "Organizer",
};

export type ProfileView = {
  role: Role;
  profile: {
    name: string;
    faculty: string;
    skills: string[];
    bio: string | null;
    links: string[];
  } | null;
};

export function ProfileCard({
  user,
  isOwn,
}: {
  user: ProfileView;
  isOwn: boolean;
}) {
  const { profile } = user;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-semibold text-balance">
            {profile?.name ?? "Profile"}
          </h1>
        </CardTitle>
        <CardDescription>
          {profile ? `${profile.faculty} · ` : ""}
          {ROLE_LABEL[user.role]}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {profile ? (
          <>
            {profile.skills.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">Skills</h2>
                <ul className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <li key={skill}>
                      <Badge variant="secondary">{skill}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {profile.bio && (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">About</h2>
                <p className="text-muted-foreground text-sm whitespace-pre-line">
                  {profile.bio}
                </p>
              </section>
            )}

            {profile.links.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-medium">Links</h2>
                <ul className="flex flex-col gap-1">
                  {profile.links.map((link) => (
                    <li key={link} className="min-w-0">
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm break-all text-foreground underline underline-offset-4 hover:text-ring"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            This person hasn&apos;t filled in their profile yet.
          </p>
        )}

        {isOwn && (
          <Link
            href="/profile"
            className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline underline-offset-4 hover:text-ring"
          >
            Edit my profile
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );
}
