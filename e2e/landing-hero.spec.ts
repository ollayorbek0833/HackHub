import { expect, test, type Page } from "@playwright/test";

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
  await expect(
    page.getByRole("table", { name: /Example ranking/ }),
  ).toHaveCount(0);
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
  // "sign‑up" with a non-breaking hyphen (U+2011), so it never splits.
  const section = page.getByRole("region", {
    name: "One flow, from sign‑up to the final ranking",
  });
  await expect(section).toBeVisible();
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

const steps = (page: Page) => page.locator("#how-it-works ol > li");

/** Every lifecycle step is fully shown: none waiting, all at full opacity. */
async function expectAllStepsShown(page: Page) {
  await expect(steps(page)).toHaveCount(5);
  await expect(page.locator('[data-draw="idle"]')).toHaveCount(0);
  for (let i = 0; i < 5; i++) {
    const content = steps(page).nth(i).locator("> div");
    await expect
      .poll(() => content.evaluate((el) => getComputedStyle(el).opacity))
      .toBe("1");
  }
}

test("with reduced motion the lifecycle steps are never hidden", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectAllStepsShown(page);
  await context.close();
});

// Short viewports: the WCAG 400% zoom reflow case (1280×1024 at 400%) and
// small phones in landscape. The list is far taller than the viewport, so
// each step must reveal on its own as it arrives.
for (const [width, height] of [
  [320, 256],
  [667, 280],
  [568, 270],
]) {
  test(`at ${width}×${height} with motion, every step reveals while scrolling`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= pageHeight; y += 120) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(30);
    }
    await expectAllStepsShown(page);
    await context.close();
  });
}

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
