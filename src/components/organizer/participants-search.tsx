import Form from "next/form";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { textLink } from "@/components/organizer/stacked-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Search by name or email (docs/08 > Participants and teams). A GET form, so
// the query lives in the URL (?q=) and the page filters on the server.

export function ParticipantsSearch({
  action,
  query,
}: {
  action: string;
  query: string;
}) {
  return (
    <Form action={action} role="search" className="flex flex-col gap-2">
      <Label htmlFor="participants-search">Search by name or email</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="participants-search"
          name="q"
          type="search"
          defaultValue={query}
          className="h-11 w-full max-w-sm md:h-9"
        />
        <Button type="submit" variant="secondary" className="h-11 md:h-9">
          <SearchIcon aria-hidden />
          Search
        </Button>
        {query && (
          <Link
            href={action}
            className={cn(
              textLink,
              "inline-flex min-h-11 items-center px-1 text-sm md:min-h-9",
            )}
          >
            Clear search
          </Link>
        )}
      </div>
    </Form>
  );
}
