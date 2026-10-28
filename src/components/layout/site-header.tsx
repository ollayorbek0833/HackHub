import Link from "next/link";
import { connection } from "next/server";
import { Logo as BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

import { MobileNav } from "./mobile-nav";
import { getNavItems, ROLE_LABEL } from "./nav-items";
import { NavLinks } from "./nav-links";
import { SectionNav } from "./section-nav";
import { UserMenu } from "./user-menu";

function Logo() {
  return (
    <Link
      href="/"
      aria-label="HackHub home"
      className="flex min-h-11 items-center rounded-lg px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <BrandLogo />
    </Link>
  );
}

const HEADER_CLASS =
  "sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70";
const INNER_CLASS =
  "mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4";

/**
 * Logo, navigation for the current audience and the account area. Reads the
 * session, so the root layout renders it inside <Suspense> (Cache Components).
 */
export async function SiteHeader() {
  // Per-request data: tell Cache Components not to prerender this (Auth.js uses
  // randomness before it reads any request data).
  await connection();
  const user = await getCurrentUser();

  let account: { displayName: string; roleLabel: string } | null = null;
  if (user) {
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { name: true },
    });
    account = {
      // The email stands in until the profile has a name.
      displayName: profile?.name?.trim() || user.email,
      roleLabel: ROLE_LABEL[user.role],
    };
  }

  const items = getNavItems(user?.role ?? null);

  return (
    <header className={HEADER_CLASS}>
      <div className={INNER_CLASS}>
        <div className="flex min-w-0 items-center gap-6">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            <NavLinks items={items} />
            {/* Visitors: quick links to the landing page's sections. */}
            {!account && <SectionNav />}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {account ? (
            <UserMenu
              displayName={account.displayName}
              roleLabel={account.roleLabel}
            />
          ) : (
            <>
              <Button asChild variant="ghost" className="h-11 px-4">
                <Link href="/login">Log in</Link>
              </Button>
              {/* Outline: amber is the page's own primary action (DESIGN.md). */}
              <Button asChild variant="outline" className="h-11 px-4">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <MobileNav items={items} user={account} sections={!account} />
      </div>
    </header>
  );
}

/** Shown while the session loads, so the header doesn't jump. */
export function SiteHeaderSkeleton() {
  return (
    <header className={HEADER_CLASS}>
      <div className={INNER_CLASS}>
        <Logo />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </header>
  );
}
