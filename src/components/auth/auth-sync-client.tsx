"use client";

import { useEffect, useRef } from "react";

import {
  AUTH_STORAGE_KEY,
  staleCheck,
} from "@/lib/auth/auth-state";

// The header and tab bar live in the root layout, which a client-side
// navigation never re-renders. A tab opened before a log in or log out
// elsewhere would keep the other state's shell (on a phone, tapping "Log in"
// there left a blank page). So when the tab comes back into view:
// - if another tab of this browser has rendered a different state since
//   (localStorage, no request), reload;
// - otherwise ask /api/auth-state, at most once per 30 s, and reload if the
//   session no longer matches what this tab shows.
// A hard reload, not router.refresh(): it also drops the client router cache,
// whose stale segments caused the blank page. No timers, no polling.

function readStored(): string | null {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function AuthSyncClient({ authKey }: { authKey: string }) {
  const rendered = useRef(authKey);
  // Off when storage is blocked or full, so a value that can't be updated
  // never makes the tab reload on every focus.
  const storageWorks = useRef(false);

  // This tab's state is the newest the browser has seen: tell the others.
  useEffect(() => {
    rendered.current = authKey;
    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, authKey);
      storageWorks.current = readStored() === authKey;
    } catch {
      storageWorks.current = false;
    }
  }, [authKey]);

  useEffect(() => {
    let lastCheck = 0;
    let asking = false;
    let reloading = false;

    function reload() {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    }

    async function onShow() {
      if (reloading || document.visibilityState !== "visible") return;
      const decision = staleCheck({
        rendered: rendered.current,
        stored: storageWorks.current ? readStored() : null,
        now: Date.now(),
        lastCheck,
      });
      if (decision === "reload") return reload();
      if (decision !== "ask-server" || asking) return;

      lastCheck = Date.now();
      asking = true;
      try {
        const response = await fetch("/api/auth-state", { cache: "no-store" });
        if (!response.ok) return;
        const { key } = (await response.json()) as { key?: unknown };
        if (typeof key === "string" && key !== rendered.current) reload();
      } catch {
        // Offline or the server is restarting: try again on the next focus.
      } finally {
        asking = false;
      }
    }

    function onStorage(event: StorageEvent) {
      if (event.key === AUTH_STORAGE_KEY) void onShow();
    }
    function onPageShow(event: PageTransitionEvent) {
      // Restored from the back/forward cache: the page didn't re-render.
      if (event.persisted) void onShow();
    }
    const onVisible = () => void onShow();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
