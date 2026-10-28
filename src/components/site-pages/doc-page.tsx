import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

// The reading layout for /about, /privacy, /terms and /contact: one h1, a
// short intro, an optional "On this page" list, then sections with h2s. Text
// stays under about 70 characters a line, at the body size (DESIGN.md > Type
// scale), so it reads well on a phone.

/** A text link inside the copy: underlined, in the text colour, amber on hover. */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

export function DocPage({
  title,
  intro,
  updated,
  contents,
  children,
}: {
  title: string;
  intro: ReactNode;
  /** Shown as "Last updated: …" under the intro. */
  updated?: string;
  /** Section ids and titles for the "On this page" list. */
  contents?: { id: string; title: string }[];
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-16">
      <article className="max-w-[70ch]">
        <header className="flex flex-col gap-4 border-b pb-8">
          <h1 className="text-page-title text-balance">{title}</h1>
          <div className="text-lg text-pretty text-muted-foreground">{intro}</div>
          {updated && (
            <p className="text-small text-muted-foreground">
              Last updated: <time>{updated}</time>
            </p>
          )}
        </header>

        {contents && (
          <nav aria-labelledby="contents-heading" className="border-b py-6">
            <h2
              id="contents-heading"
              className="font-mono text-small tracking-wide text-muted-foreground uppercase"
            >
              On this page
            </h2>
            <ol className="mt-2 grid gap-x-6 sm:grid-cols-2">
              {contents.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="inline-flex min-h-11 items-center rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-9"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex flex-col">{children}</div>
      </article>
    </main>
  );
}

/** One section of a DocPage: an h2 and its copy, with list and paragraph spacing. */
export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-20 border-b py-8 last:border-b-0"
    >
      <h2 id={`${id}-heading`} className="text-section-title text-balance">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4 text-body text-pretty [&_li]:pl-1 [&_li+li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-primary/70">
        {children}
      </div>
    </section>
  );
}
