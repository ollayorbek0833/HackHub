"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** "Copy code" next to the invite code; confirms with the "Code copied." toast. */
export function CopyCodeButton({ code }: { code: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied.");
    } catch {
      // No clipboard access (an insecure origin or a refused permission).
      toast.error("Couldn't copy the code. Select it and copy it by hand.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={copy}
      className="h-11 px-4"
    >
      <CopyIcon aria-hidden />
      Copy code
    </Button>
  );
}
