import { Skeleton } from "@/components/ui/skeleton";

// Skeletons in the shape of an organizer page: title, primary action, rows.
// The organizer layout already supplies <main>.
export default function Loading() {
  return (
    <div aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-1/2 max-w-xs" />
        <Skeleton className="h-11 w-28 md:h-9" />
      </div>
      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    </div>
  );
}
