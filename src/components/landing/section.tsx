import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

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
 *
 * Anchors: scroll-mt-16 is the sticky header's height (h-16), so a jump to
 * `/#id` (the header's section links) lands just under the header.
 *
 * Motion: as they scroll into view, the heading block fades and rises in once
 * and the content fades in once (Reveal), motion-safe only and never hiding
 * content without JavaScript. The content doesn't rise: a section's own items
 * (DrawIn and the like) move as they enter, and the shell leaves their boxes
 * where they are.
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
      className={cn("scroll-mt-16 py-16 md:py-24", className)}
    >
      <Reveal className="max-w-2xl">
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
      </Reveal>
      <Reveal fadeOnly className="mt-10 md:mt-12">
        {children}
      </Reveal>
    </section>
  );
}
