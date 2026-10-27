"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// One-off messages that arrive through a redirect, as ?notice=<key>. Shows the
// toast from docs/08 once, then removes the parameter from the URL.
const NOTICES: Record<string, { kind: "success" | "error"; text: string }> = {
  "logged-out": { kind: "success", text: "You're logged out." },
  "account-created": {
    kind: "success",
    text: "Account created. Add your name and faculty to finish your profile.",
  },
  "no-access": {
    kind: "error",
    text: "You don't have access to that page.",
  },
};

export function NoticeToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shown = useRef<string | null>(null);

  const key = searchParams.get("notice");

  useEffect(() => {
    if (!key || shown.current === key) return;
    const notice = NOTICES[key];
    if (!notice) return;
    shown.current = key;

    toast[notice.kind](notice.text);

    const rest = new URLSearchParams(searchParams.toString());
    rest.delete("notice");
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [key, pathname, router, searchParams]);

  return null;
}
