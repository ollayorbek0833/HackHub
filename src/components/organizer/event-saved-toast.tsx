"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// The event form's actions redirect to the overview with ?saved=created or
// ?saved=updated. This shows the docs/08 toast once, then drops the parameter.
const MESSAGES: Record<string, string> = {
  created:
    "Event created. It's hidden from participants until you open registration.",
  updated: "Event saved.",
};

export function EventSavedToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shown = useRef<string | null>(null);

  const key = searchParams.get("saved");

  useEffect(() => {
    if (!key || shown.current === key) return;
    const message = MESSAGES[key];
    if (!message) return;
    shown.current = key;

    toast.success(message);

    const rest = new URLSearchParams(searchParams.toString());
    rest.delete("saved");
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [key, pathname, router, searchParams]);

  return null;
}
