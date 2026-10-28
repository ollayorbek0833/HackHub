"use client";

import Link from "next/link";
import { ChevronDownIcon, UserIcon } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Shows the name (or the email until the profile is complete) and the role as
// text. Items: "My profile" and "Log out".
export function UserMenu({
  displayName,
  roleLabel,
}: {
  displayName: string;
  roleLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-11 max-w-64 gap-2 px-3">
          <UserIcon aria-hidden />
          <span className="truncate">{displayName}</span>
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground">{roleLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-10">
          <Link href="/profile">
            <UserIcon aria-hidden />
            My profile
          </Link>
        </DropdownMenuItem>
        <LogoutButton variant="menu-item" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
