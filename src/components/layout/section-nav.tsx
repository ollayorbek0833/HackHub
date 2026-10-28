"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { PAGE_SECTIONS, sectionHref } from "./nav-items";
import { useActiveSection } from "./use-active-section";

// The current section gets the same mark as the current page in NavLinks:
// bold, the highlight underline and aria-current, so colour is never the only
// signal.
export function sectionLinkClass(isCurrent: boolean) {
  return cn(
    "inline-flex min-h-11 items-center rounded-lg px-3 text-sm whitespace-nowrap outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
    isCurrent
      ? "font-semibold text-foreground underline decoration-2 underline-offset-8 decoration-highlight"
      : "font-medium text-muted-foreground hover:text-foreground",
  );
}

/**
 * A link to one landing section: a plain `#id` anchor on "/" (works without
 * JavaScript; the scroll is smooth only when motion is allowed, globals.css),
 * and a Link to "/#id" from every other page.
 */
export function SectionLink({
  id,
  pathname,
  isCurrent,
  className,
  onClick,
  children,
}: {
  id: string;
  pathname: string;
  isCurrent: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  const props = {
    href: sectionHref(id, pathname),
    className,
    onClick,
    "aria-current": isCurrent ? ("location" as const) : undefined,
  };
  return pathname === "/" ? <a {...props}>{children}</a> : <Link {...props}>{children}</Link>;
}

/**
 * Quick links to the landing page's sections, for visitors, in the header from
 * md up: inline from lg (they need about 680 px with the logo; lg leaves
 * ~120 px spare next to Log in and Register), and a compact "Jump to"
 * disclosure between md and lg, where they don't fit on one line. Phones get
 * them in MobileNav.
 *
 * The disclosure is a native <details>, so it opens and its links work without
 * JavaScript; with it, a pick, Escape or a click outside closes it.
 */
export function SectionNav() {
  const pathname = usePathname();
  const active = useActiveSection(pathname === "/");
  const details = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (details.current) details.current.open = false;
  };

  useEffect(() => {
    const el = details.current;
    if (!el) return;
    const onPointerDown = (event: PointerEvent) => {
      if (el.open && !el.contains(event.target as Node)) el.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !el.open) return;
      el.open = false;
      el.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <nav aria-label="Page sections">
      <ul className="hidden items-center gap-1 lg:flex">
        {PAGE_SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <SectionLink
              id={id}
              pathname={pathname}
              isCurrent={id === active}
              className={sectionLinkClass(id === active)}
            >
              {label}
            </SectionLink>
          </li>
        ))}
      </ul>

      <details ref={details} className="group relative lg:hidden">
        <summary
          className={cn(
            sectionLinkClass(false),
            "cursor-pointer list-none gap-1 group-open:text-foreground [&::-webkit-details-marker]:hidden",
          )}
        >
          Jump to
          <ChevronDownIcon
            aria-hidden
            className="size-4 group-open:rotate-180 motion-safe:transition-transform"
          />
        </summary>
        <ul className="absolute top-full left-0 z-50 mt-1 flex min-w-44 flex-col gap-0.5 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 motion-safe:animate-fade-in">
          {PAGE_SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <SectionLink
                id={id}
                pathname={pathname}
                isCurrent={id === active}
                onClick={close}
                className={cn(sectionLinkClass(id === active), "w-full")}
              >
                {label}
              </SectionLink>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
