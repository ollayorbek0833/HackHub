import { Skeleton } from "@/components/ui/skeleton";

/** The event form's shape while the page checks the session and loads the event. */
export function EventFormSkeleton() {
  return (
    <div className="flex max-w-2xl flex-col gap-6" aria-busy="true">
      <Skeleton className="h-14" />
      <Skeleton className="h-36" />
      <div className="grid gap-6 sm:grid-cols-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <Skeleton className="h-14 w-28" />
    </div>
  );
}
