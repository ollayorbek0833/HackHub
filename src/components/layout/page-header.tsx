import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// The top of every page's main area (docs/08 > App shell): an optional back
// link, the title, a short description, and the page's primary action. The
// action always sits in the same place: under the title on phone, at the
// right of it from md up.

export function PageHeader({
  title,
  description,
  action,
  back,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  back?: { href: string; label: string };
  /** Extra lines under the description, such as status badges. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {back && (
        <Link
          href={back.href}
          className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-balance break-words">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-pretty text-muted-foreground">
              {description}
            </p>
          )}
          {children}
        </div>
        {action && (
          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
