import { expect, test, type Locator, type Page } from "@playwright/test";

// The phone ActionDock regression (redesign plan > Phone): on /profile, inside
// a Card (overflow: hidden), the sticky dock used to float over the last
// fields, so "Add link" and the extra link fields couldn't be reached. The dock
// is now fixed above the tab bar and the page leaves room for it.

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
test.describe.configure({ timeout: 60_000 });

const PASSWORD = "correct-horse-1";

async function registerFresh(page: Page) {
  await page.goto("/register");
  await page
    .getByLabel("Email")
    .fill(`dock.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/);
}

async function dockTop(page: Page) {
  const box = await page.locator("[data-action-dock]").boundingBox();
  return box ? box.y : Number.POSITIVE_INFINITY;
}

async function expectAboveDock(page: Page, target: Locator) {
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual((await dockTop(page)) + 1);
}

test("every profile link field is reachable above the docked Save", async ({
  page,
}) => {
  await registerFresh(page);

  const dock = page.locator("[data-action-dock]");
  await expect(dock).toBeVisible();
  expect(await dock.evaluate((d) => getComputedStyle(d).position)).toBe(
    "fixed",
  );

  // Add links until there are three, each time reaching "Add link" first.
  for (let n = 1; n < 3; n++) {
    const add = page.getByRole("button", { name: /Add link/ });
    await add.scrollIntoViewIfNeeded();
    await expectAboveDock(page, add);
    await add.click();
  }
  const links = page.locator('input[name="links"]');
  await expect(links).toHaveCount(3);

  // At the very bottom of the page, the last link field clears the dock.
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expectAboveDock(page, links.last());

  // Keyboard focus scrolls each link field clear of the dock.
  await page.evaluate(() => window.scrollTo(0, 0));
  for (let i = 0; i < 3; i++) {
    await links.nth(i).focus();
    await expectAboveDock(page, links.nth(i));
  }
});
