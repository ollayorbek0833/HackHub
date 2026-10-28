import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One landing section, so every section has the same spacing and heading
 * scale (landing plan). Renders a <section> labelled by its <h2>.
 *
 * Props:
 * - `id`: the section's anchor (`/#lifecycle`). The heading gets `${id}-heading`.
 * - `title`: the h2. The page's only h1 is in the Hero.
 * - `eyebrow` (optional): a short label above the title, e.g. "For organizers".
 * - `intro` (optional): one or two sentences under the title, in muted text.
 * - `children`: the section's content, placed under the heading block.
 * - `className` (optional): extra classes for the <section>, e.g. a border.
 *
 * Widths: the page is `max-w-6xl` with `px-4`; the section adds only vertical
 * rhythm (py-16, py-24 from md), so sections stack evenly.
 */
export function LandingSection({
  id,
  title,
  eyebrow,
  intro,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-20 py-16 md:py-24", className)}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-3 font-mono text-small tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h2
          id={headingId}
          className="text-[clamp(1.625rem,1.3rem+1.2vw,2.25rem)] leading-[1.15] font-bold tracking-[-0.02em] text-balance"
        >
          {title}
        </h2>
        {intro && (
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            {intro}
          </p>
        )}
      </div>
      <div className="mt-10 md:mt-12">{children}</div>
    </section>
  );
}
