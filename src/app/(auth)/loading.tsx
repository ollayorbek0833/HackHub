import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// The shape of the auth card while the session is read (docs/08: skeletons,
// not a full-page spinner).
export default function Loading() {
  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="mt-2 h-4 w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </CardContent>
    </Card>
  );
}
