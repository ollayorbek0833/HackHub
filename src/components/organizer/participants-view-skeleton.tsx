import { Skeleton } from "@/components/ui/skeleton";

// The tabs and a few rows, while the participants or teams view loads.
export function ParticipantsViewSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-[52px] w-64 rounded-lg md:h-11" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
