import { LockIcon } from "lucide-react";
import { Suspense } from "react";

import { CriteriaForm } from "@/components/criteria/criteria-form";
import { CriteriaTable } from "@/components/criteria/criteria-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOwnedEvent } from "@/lib/auth/dal";
import { CRITERIA_MESSAGES, isCriteriaLocked } from "@/lib/domain/criteria";
import { prisma } from "@/lib/prisma";

import { saveCriteria } from "./actions";

// docs/08 > Criteria and weights. The event layout above shows the name,
// badges and sub-nav. The session, params and the database are read inside
// this page's own Suspense (Cache Components).

export default function CriteriaPage({
  params,
}: PageProps<"/organizer/events/[eventId]/criteria">) {
  return (
    <>
      <h2 className="text-2xl font-semibold">Criteria and weights</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Judges score every team on each criterion, from 0 to its max score. The
        weights decide how much each criterion counts and must add up to 100%.
      </p>
      <div className="mt-6">
        <Suspense fallback={<CriteriaSkeleton />}>
          <Criteria params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function Criteria({
  params,
}: Pick<PageProps<"/organizer/events/[eventId]/criteria">, "params">) {
  const { eventId } = await params;
  await requireOwnedEvent(eventId);

  const [criteria, scoreCount] = await Promise.all([
    prisma.criterion.findMany({
      where: { eventId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { name: true, weightPercent: true, maxScore: true },
    }),
    prisma.score.count({ where: { criterion: { eventId } } }),
  ]);

  if (isCriteriaLocked(scoreCount)) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <LockIcon aria-hidden />
          <AlertDescription>{CRITERIA_MESSAGES.locked}</AlertDescription>
        </Alert>
        <CriteriaTable criteria={criteria} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {criteria.length === 0 && (
        <Alert>
          <AlertDescription>
            No criteria yet. Judges can&apos;t score until you add them.
          </AlertDescription>
        </Alert>
      )}
      <CriteriaForm action={saveCriteria.bind(null, eventId)} initial={criteria} />
    </div>
  );
}

function CriteriaSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-11 w-40" />
    </div>
  );
}
