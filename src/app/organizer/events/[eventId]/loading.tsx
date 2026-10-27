import { Skeleton } from "@/components/ui/skeleton";

// Shown below the event header while a sub-page loads, so the name, badges and
// sub-nav stay in place when switching between Overview, Edit, Criteria, ….
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
  );
}
