import { expect, test, type Page } from "@playwright/test";

// Landing > For organizers and Happening now (landing plan, sections 3 and 6).
// Works on any seed: it checks the rules, not particular events.

const section = (page: Page, name: string) =>
  page.getByRole("region", { name, exact: true });

test("For organizers tells the command-centre story in four rows", async ({
  page,
}) => {
  await page.goto("/");
  const organizers = section(
    page,
    "Your hackathon, run from one command centre",
  );
  await expect(organizers).toBeVisible();
  await expect(organizers.getByRole("heading", { level: 3 })).toHaveText([
    "Create an event with a logo and a banner",
    "Set weighted criteria",
    "Run every phase with one Next step",
    "See participants and teams in tables",
  ]);

  // The vignettes are decorative: hidden from assistive tech, and nothing in
  // them takes focus.
  const vignettes = organizers.locator("[aria-hidden='true'][inert]");
  await expect(vignettes).toHaveCount(4);
  for (const vignette of await vignettes.all()) {
    await expect(vignette.getByText("Example", { exact: true })).toBeVisible();
  }
  await expect(organizers.getByRole("textbox")).toHaveCount(0);
  await expect(organizers.getByRole("button")).toHaveCount(0);
  await expect(organizers.getByRole("table")).toHaveCount(0);
});

test("Happening now lists open events, registration first, at most six", async ({
  page,
}) => {
  await page.goto("/");
  const now = section(page, "Happening now");
  await expect(now).toBeVisible();
  // The events stream in after the shell: wait for the skeleton to go, or a
  // slow query reads as "no events" and the test skips.
  await expect(now.locator("[aria-busy='true']")).toHaveCount(0);

  const cards = now.getByRole("listitem").filter({
    has: page.getByRole("link", { name: /\S/ }),
  });
  const count = await cards.count();
  test.skip(count === 0, "No open events in this database.");
  expect(count).toBeLessThanOrEqual(6);

  let seenRegistrationClosed = false;
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const link = card.getByRole("link").first();
    await expect(link).toHaveAttribute("href", /^\/events\/[^/]+$/);

    const status = card.getByRole("list", { name: "Status" });
    const text = (await status.textContent()) ?? "";
    // Every card is open for registration or for submissions.
    expect(text).toMatch(/Registration open|Submissions open/);
    // Registration-open events come first.
    if (text.includes("Registration open")) {
      expect(seenRegistrationClosed).toBe(false);
    } else {
      seenRegistrationClosed = true;
    }
  }

  await expect(now.getByRole("link", { name: "See all events" })).toHaveAttribute(
    "href",
    "/events",
  );
});

test("the landing page doesn't scroll sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(section(page, "Happening now")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
