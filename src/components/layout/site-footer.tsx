import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

// The site footer (landing plan > Footer). Shown on the public and auth pages
// only: (public)/layout.tsx and (auth)/layout.tsx mount it. The organizer,
// judge and participant app areas don't, since the phone tab bar lives there.
// Static: it reads no session, so it needs no Suspense.

const REPO_URL = "https://github.com/ollayorbek0833/HackHub";
const LICENSE_URL = `${REPO_URL}/blob/master/LICENSE`;

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Events", href: "/events" },
      { label: "Run a hackathon", href: "/contact#run-an-event" },
      { label: "Log in", href: "/login" },
      { label: "Register", href: "/register" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "GitHub", href: REPO_URL, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

// 44 px tall on phones (docs/08 > Accessibility), 36 px with a pointer on
// desktop; the amber focus ring.
const LINK_CLASS =
  "inline-flex min-h-11 items-center gap-1 rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-9";

function FooterLinkItem({
  link,
  className,
}: {
  link: FooterLink;
  className?: string;
}) {
  if (link.external) {
    return (
      <a href={link.href} className={cn(LINK_CLASS, className)}>
        {link.label}
        <ArrowUpRightIcon aria-hidden className="size-3.5" />
      </a>
    );
  }
  return (
    <Link href={link.href} className={cn(LINK_CLASS, className)}>
      {link.label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-8 md:pt-14">
        <div className="grid gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-10">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              aria-label="HackHub home"
              className="flex min-h-11 w-fit items-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Logo />
            </Link>
            <p className="max-w-xs text-small text-pretty text-muted-foreground">
              Run a whole hackathon in one place: registration, teams,
              submissions, judging and the ranking.
            </p>
          </div>

          {COLUMNS.map((column) => {
            const headingId = `footer-${column.title.toLowerCase()}`;
            return (
              <nav key={column.title} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="text-small font-semibold text-foreground"
                >
                  {column.title}
                </h2>
                <ul className="mt-2 flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 border-t pt-4 text-small text-muted-foreground">
          <p>© 2026 HackHub</p>
          <p>Made in Tashkent</p>
          <p className="w-full sm:ml-auto sm:w-auto">
            <FooterLinkItem
              link={{ label: "MIT licence", href: LICENSE_URL, external: true }}
            />
          </p>
        </div>
      </div>
    </footer>
  );
}
