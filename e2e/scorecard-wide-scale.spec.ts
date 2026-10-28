import "dotenv/config";

import { execFileSync } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

// A criterion out of 20 has 21 number buttons (0–20). They used to sit in one
// row that never wrapped, so at 1440 px the page scrolled sideways by ~112 px.
// The row now wraps inside its column at every width.
//
// The demo seed only has criteria out of 10, so e2e/fixtures/wide-scale-event.ts
// makes an event in judging with one criterion out of 20 and one submitted
// team, and removes it afterwards. Logs in as judge@hackhub.test with
// SEED_DEMO_PASSWORD.

test.describe.configure({ mode: "serial", timeout: 60_000 });

const fixture = (...args: string[]) =>
  execFileSync("npx", ["tsx", "e2e/fixtures/wide-scale-event.ts", ...args], {
    encoding: "utf8",
  });

let created: { eventId: string; teamId: string; organizerId: string } | null = null;

test.beforeAll(() => {
  created = JSON.parse(fixture("create").trim().split("\n").pop()!);
});

test.afterAll(() => {
  if (created) fixture("delete", created.eventId, created.organizerId);
});

async function openScorecard(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("judge@hackhub.test");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/judge$/);
  await page.goto(`/judge/teams/${created!.teamId}`);
  await expect(impact(page).getByRole("radio")).toHaveCount(21);
}

const impact = (page: Page) => page.getByRole("radiogroup", { name: /Impact/ });
const hiddenImpact = (page: Page) =>
  impact(page).locator("xpath=../..").locator('input[type="hidden"][name^="score:"]');

async function expectNoSidewaysScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

for (const width of [1440, 390]) {
  test(`0–20 buttons fit without sideways scroll at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openScorecard(page);
    await expectNoSidewaysScroll(page);

    // Every button stays inside the scorecard's column and keeps a 44 px target.
    const column = await page.locator("#scorecard").boundingBox();
    for (const score of [0, 10, 20]) {
      const box = await impact(page).getByRole("radio", { name: String(score), exact: true }).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(column!.x + column!.width + 1);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }

    // On wide screens the scale wraps tidily: 0–10, then 11–20 under it.
    if (width >= 640) {
      const at = (n: number) =>
        impact(page).getByRole("radio", { name: String(n), exact: true }).boundingBox();
      const [zero, ten, eleven] = [await at(0), await at(10), await at(11)];
      expect(ten!.y).toBe(zero!.y);
      expect(eleven!.y).toBeGreaterThan(ten!.y);
      expect(eleven!.x).toBe(zero!.x);
    }
  });
}

test("typing 1 then 7 scores 17; arrows step and Backspace clears", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openScorecard(page);
  await impact(page).getByRole("radio", { name: "0", exact: true }).focus();

  await page.keyboard.press("1");
  await page.keyboard.press("7");
  await expect(impact(page).getByRole("radio", { name: "17" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(hiddenImpact(page)).toHaveValue("17");

  await page.keyboard.press("ArrowRight");
  await expect(hiddenImpact(page)).toHaveValue("18");
  await page.keyboard.press("End");
  await expect(hiddenImpact(page)).toHaveValue("20");
  await page.keyboard.press("ArrowRight");
  await expect(hiddenImpact(page)).toHaveValue("20");
  await page.keyboard.press("Backspace");
  await expect(hiddenImpact(page)).toHaveValue("");

  await impact(page).getByRole("radio", { name: "17" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Scores saved.")).toBeVisible();
  await page.reload();
  await expect(impact(page).getByRole("radio", { name: "17" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});
