import "dotenv/config";

import { expect, test, type Page } from "@playwright/test";

// The site footer (landing plan > Footer): on every public and auth page, with
// the Product, Project and Legal columns and the bottom row; never inside the
// app areas, where the phone tab bar lives.

const REPO = "https://github.com/ollayorbek0833/HackHub";

const COLUMNS: Record<string, [string, string][]> = {
  Product: [
    ["Events", "/events"],
    ["Run a hackathon", "/contact#run-an-event"],
    ["Log in", "/login"],
    ["Register", "/register"],
  ],
  Project: [
    ["About", "/about"],
    ["Contact", "/contact"],
    ["GitHub", REPO],
  ],
  Legal: [
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
  ],
};

async function expectFooter(page: Page) {
  const footer = page.getByRole("contentinfo");
  await expect(footer).toBeVisible();
  for (const [column, links] of Object.entries(COLUMNS)) {
    const nav = footer.getByRole("navigation", { name: column });
    await expect(nav).toBeVisible();
    for (const [name, href] of links) {
      await expect(
        nav.getByRole("link", { name, exact: true }),
      ).toHaveAttribute("href", href);
    }
  }
  await expect(footer.getByText("© 2026 HackHub")).toBeVisible();
  await expect(footer.getByText("Made in Tashkent")).toBeVisible();
  await expect(
    footer.getByRole("link", { name: "MIT licence" }),
  ).toHaveAttribute("href", `${REPO}/blob/master/LICENSE`);
}

for (const path of ["/", "/events", "/login", "/register"]) {
  test(`the footer is on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectFooter(page);
  });
}

test("footer links are at least 44 px tall on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/events");
  const links = page.getByRole("contentinfo").getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const box = await links.nth(i).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
  // Nothing scrolls sideways.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the footer stays out of the organizer area", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.SEED_ORGANIZER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.SEED_ORGANIZER_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/organizer$/);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
});
