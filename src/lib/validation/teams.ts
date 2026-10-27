import { z } from "zod";

import {
  INVITE_CODE_LENGTH,
  normalizeInviteCode,
} from "@/lib/domain/invite-code";

// Field rules and messages from docs/08 > /events/[eventId]/team.

export const createTeamSchema = z.object({
  name: z
    .string({ error: "Enter a team name." })
    .trim()
    .min(1, "Enter a team name.")
    // Only checked once there is a name, so an empty field gets one message.
    .pipe(
      z
        .string()
        .min(2, "Use at least 2 characters for the team name.")
        .max(40, "Keep the team name under 40 characters."),
    ),
});

export const joinTeamSchema = z.object({
  // Not case-sensitive (Decision 4): normalised before the length check.
  code: z
    .string({ error: "Enter the 6-character code." })
    .transform(normalizeInviteCode)
    .pipe(
      z
        .string()
        .length(INVITE_CODE_LENGTH, "Enter the 6-character code."),
    ),
});
