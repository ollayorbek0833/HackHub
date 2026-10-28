import { expect, test } from "@playwright/test";

// The landing page (landing plan): the hero with the two ways in, the
// decorative product collage, the five-phase lifecycle and the closing band.
// The event leaderboard is no longer the hero.

test("the hero says what HackHub is and offers the two ways in", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Run your whole hackathon in one place.",
    }),
  ).toBeVisible();
  const hero = page.getByRole("region", { name: /whole hackathon/ });
  await expect(
    hero.getByRole("link", { name: "Run a hackathon" }),
  ).toHaveAttribute("href", "/contact#run-an-event");
  await expect(
    hero.getByRole("link", { name: "Find an event" }),
  ).toHaveAttribute("href", "/events");
  // Registering makes a participant; organizers ask for an account instead.
  await expect(
    hero.getByRole("link", { name: "Join as a participant" }),
  ).toHaveAttribute("href", "/register");
  await expect(page.getByRole("table", { name: /Example ranking/ })).toHaveCount(
    0,
  );
});

test("the product collage is decorative and marks every screen Example", async ({
  page,
}) => {
  await page.goto("/");
  const collage = page.locator('[aria-hidden="true"][inert]').filter({
    hasText: "Tashkent AI Weekend",
  });
  await expect(collage).toBeVisible();
  await expect(collage.getByText("Example", { exact: true })).toHaveCount(4);
  // Nothing in it can take focus.
  await expect(collage.locator("a, button, input")).toHaveCount(0);
});

test("the lifecycle lists the five phases in order", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", {
    name: "One flow, from sign-up to the final ranking",
  });
  await expect(section.getByRole("heading", { level: 3 })).toHaveText([
    /Open registration/,
    /Form teams/,
    /Submit/,
    /Judge/,
    /Publish results/,
  ]);
});

test("the closing band repeats the two ways in", async ({ page }) => {
  await page.goto("/");
  const band = page.getByRole("region", {
    name: "Run your next hackathon on HackHub",
  });
  await expect(
    band.getByRole("link", { name: "Run a hackathon" }),
  ).toHaveAttribute("href", "/contact#run-an-event");
  await expect(
    band.getByRole("link", { name: "Find an event" }),
  ).toHaveAttribute("href", "/events");
});

for (const width of [390, 1440]) {
  test(`the landing page doesn't scroll sideways at ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("with reduced motion the lifecycle is fully drawn", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const rail = page.locator('[data-draw]');
  await rail.scrollIntoViewIfNeeded();
  await expect(rail).toHaveAttribute("data-draw", "done");
  await context.close();
});

test("keyboard: the hero's links come in order and the collage is skipped", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: /whole hackathon/ });
  await hero.getByRole("link", { name: "Run a hackathon" }).focus();
  await page.keyboard.press("Tab");
  await expect(hero.getByRole("link", { name: "Find an event" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    hero.getByRole("link", { name: "Join as a participant" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("[inert]")),
  ).toBe(false);
});
