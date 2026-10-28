"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type MouseEvent } from "react";
import { LogOutIcon, MenuIcon, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { logout } from "./actions";
import { cn } from "@/lib/utils";

import { NavLinks } from "./nav-links";
import { PAGE_SECTIONS, type NavItem } from "./nav-items";
import { SectionLink, sectionLinkClass } from "./section-nav";
import { jumpToSection, useActiveSection } from "./use-active-section";

// Below md the navigation moves into a side sheet: the same items, plus the
// user menu items (or Log in / Register for a visitor). On the landing page a
// visitor also gets its sections, under "On this page".
export function MobileNav({
  items,
  user,
  sections = false,
}: {
  items: NavItem[];
  user: { displayName: string; roleLabel: string } | null;
  /** Show the landing page's section links (visitors, on "/" only). */
  sections?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const pathname = usePathname();
  const showSections = sections && pathname === "/";
  const active = useActiveSection(showSections && open);
  // A section picked in the sheet: the sheet closes first (its scroll lock
  // and focus return end), then the page scrolls there.
  const pendingSection = useRef<string | null>(null);

  const pickSection = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    pendingSection.current = id;
    close();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className="size-11 md:hidden"
          aria-label="Open menu"
        >
          <MenuIcon aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        onCloseAutoFocus={(event) => {
          const id = pendingSection.current;
          if (!id) return;
          pendingSection.current = null;
          // Focus moves with the jump, not back to the menu button.
          event.preventDefault();
          requestAnimationFrame(() => jumpToSection(id));
        }}
      >
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="truncate">
            {user ? `${user.displayName} · ${user.roleLabel}` : "Welcome to HackHub"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <NavLinks items={items} orientation="vertical" onNavigate={close} />
          {showSections && (
            <nav aria-labelledby="mobile-page-sections">
              <p
                id="mobile-page-sections"
                className="px-3 pb-1 font-mono text-small tracking-wide text-muted-foreground uppercase"
              >
                On this page
              </p>
              <ul className="flex flex-col gap-1">
                {PAGE_SECTIONS.map(({ id, label }) => (
                  <li key={id}>
                    <SectionLink
                      id={id}
                      pathname={pathname}
                      isCurrent={id === active}
                      onClick={pickSection(id)}
                      className={cn(
                        sectionLinkClass(id === active),
                        "w-full text-base",
                      )}
                    >
                      {label}
                    </SectionLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <Separator />
          {user ? (
            <div className="flex flex-col gap-1">
              <Button
                asChild
                variant="ghost"
                className="h-11 justify-start px-3 text-base"
              >
                <Link href="/profile" onClick={close}>
                  <UserIcon aria-hidden />
                  My profile
                </Link>
              </Button>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-11 w-full justify-start px-3 text-base"
                >
                  <LogOutIcon aria-hidden />
                  Log out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="h-11 text-base">
                <Link href="/login" onClick={close}>
                  Log in
                </Link>
              </Button>
              <Button asChild className="h-11 text-base">
                <Link href="/register" onClick={close}>
                  Register
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
