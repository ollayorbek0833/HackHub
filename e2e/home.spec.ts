import { expect, test } from "@playwright/test";

// docs/08 > "/ Landing": what HackHub is, one line per role, the steps of a
// hackathon, and the two actions.
test("the home page loads and names the three role areas", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /Run a hackathon/ }),
  ).toBeVisible();
  for (const role of ["Participants", "Judges", "Organizers"]) {
    await expect(page.getByRole("heading", { name: role })).toBeVisible();
  }
  await expect(
    page.getByRole("main").getByRole("link", { name: "Browse events" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Create an account" }),
  ).toBeVisible();
});
