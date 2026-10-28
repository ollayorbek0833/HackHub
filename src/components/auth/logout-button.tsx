"use client";

import { useRef, useState, type FormEvent } from "react";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AUTH_STORAGE_KEY, authStateKey } from "@/lib/auth/auth-state";
import { LOGGED_OUT_HREF } from "@/lib/auth/redirects";

import { logout } from "./logout-action";

// "Log out" for the user menu (desktop) and the phone menu.
//
// Log out leaves with a full page load, like HardRedirect. A client-side
// redirect kept the signed-in tab around the signed-out page: the routes the
// router keeps alive (with the email and profile in the DOM, and shown again
// on Back), and the open phone menu. A reload was the only way out.
//
// With JavaScript the form never submits: the action ends the session, the
// other tabs are told through the AuthSync entry, and the page is replaced.
// Without it, the form posts to the same action, which redirects.

function useLogout() {
  const [pending, setPending] = useState(false);
  // A second tap while the first is on its way does nothing.
  const started = useRef(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (started.current) return;
    started.current = true;
    setPending(true);
    try {
      await logout();
    } catch {
      started.current = false;
      setPending(false);
      toast.error("Couldn't log out. Check your connection and try again.");
      return;
    }
    try {
      // Other tabs follow when they come back into view (AuthSync).
      window.localStorage.setItem(AUTH_STORAGE_KEY, authStateKey(null));
    } catch {
      // Storage blocked: they ask the server instead.
    }
    // Replace, so Back doesn't return to the signed-in page.
    window.location.replace(LOGGED_OUT_HREF);
  }

  return { pending, onSubmit };
}

function Label({ pending }: { pending: boolean }) {
  return (
    <>
      <LogOutIcon aria-hidden />
      {pending ? "Logging out…" : "Log out"}
    </>
  );
}

/**
 * "Log out", as the last item of the desktop user menu ("menu-item", inside
 * DropdownMenuContent) or of the phone menu ("sheet").
 */
export function LogoutButton({ variant }: { variant: "menu-item" | "sheet" }) {
  const { pending, onSubmit } = useLogout();
  return (
    <form action={logout} onSubmit={onSubmit}>
      {variant === "menu-item" ? (
        <DropdownMenuItem
          asChild
          className="min-h-10 w-full"
          disabled={pending}
          // Selecting an item closes the menu, which would unmount this form.
          // Keep it open until the page is replaced: it shows "Logging out…".
          onSelect={(event) => event.preventDefault()}
        >
          <button type="submit" aria-busy={pending}>
            <Label pending={pending} />
          </button>
        </DropdownMenuItem>
      ) : (
        <Button
          type="submit"
          variant="ghost"
          className="h-11 w-full justify-start px-3 text-base"
          disabled={pending}
          aria-busy={pending}
        >
          <Label pending={pending} />
        </Button>
      )}
    </form>
  );
}
