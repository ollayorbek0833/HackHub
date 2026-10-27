import { z } from "zod";

// The role-change form on /organizer/users: the new role is the only field;
// the user id is bound by the page.
export const setUserRoleSchema = z.object({
  role: z.enum(["PARTICIPANT", "JUDGE"], {
    error: "Choose participant or judge.",
  }),
});

/** The /organizer/users filters, from the URL. Anything unknown is ignored. */
export const usersFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  role: z.enum(["PARTICIPANT", "JUDGE", "ORGANIZER"]).optional().catch(undefined),
});
