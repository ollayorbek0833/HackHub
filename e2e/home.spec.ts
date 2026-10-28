import { expect, test } from "@playwright/test";

// The landing page (landing plan): the sections' composition. The leaderboard
// hero is gone; the real events show under "Happening now".
test("the home page no longer leads with an event leaderboard", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("table", { name: /Example ranking/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { level: 2, name: "Happening now" }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});
