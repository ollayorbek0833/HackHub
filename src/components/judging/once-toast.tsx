"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Shows a success toast once after a redirect, then removes `param` from the
 * URL so a reload doesn't show it again. Used after "Save and go to next team".
 */
export function OnceToast({ param, message }: { param: string; message: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shown = useRef(false);

  useEffect(() => {
    if (!message || shown.current || !searchParams.has(param)) return;
    shown.current = true;
    toast.success(message);
    const rest = new URLSearchParams(searchParams.toString());
    rest.delete(param);
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [message, param, pathname, router, searchParams]);

  return null;
}
