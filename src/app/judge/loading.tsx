import { Skeleton } from "@/components/ui/skeleton";

// Skeletons in the shape of a judge page: title, then event or team blocks.
// The judge layout already supplies <main>.
export default function Loading() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-8 w-1/2 max-w-xs" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}
