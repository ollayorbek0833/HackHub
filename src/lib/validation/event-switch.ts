import { z } from "zod";

// The event overview's switches post one field, `open`, as "true" or "false"
// (docs/08 > Event overview).
export const eventSwitchSchema = z.object({
  open: z.enum(["true", "false"]).transform((v) => v === "true"),
});
