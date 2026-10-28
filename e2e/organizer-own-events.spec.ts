import "dotenv/config";

import { expect, test, type Page } from "@playwright/test";

// "Events I run" (/organizer) lists only the events the signed-in organizer
// created, and its tab counts and the event chip's switch menu follow. Any
// organizer can still open and manage any event by its URL.
//
// Needs the demo seed (npm run db:seed:demo): the first organizer
// (SEED_ORGANIZER_EMAIL) created "Demo Hack · judging" and "Open Hack · live";
// organizer2@hackhub.test created "Second Hack · upcoming".

test.describe.configure({ timeout: 60_000 });

const FIRST = {
  email: process.env.SEED_ORGANIZER_EMAIL!,
  password: process.env.SEED_ORGANIZER_PASSWORD!,
};
const SECOND = {
  email: "organizer2@hackhub.test",
  password: process.env.SEED_DEMO_PASSWORD!,
};
const FIRST_EVENTS = ["Demo Hack · judging", "Open Hack · live"];
const SECOND_EVENT = "Second Hack · upcoming";

async function logIn(page: Page, { email, password }: typeof FIRST) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/organizer$/);
}

const cards = (page: Page) => page.getByRole("main").getByRole("article");
const card = (page: Page, name: string) =>
  cards(page).filter({ has: page.getByRole("link", { name, exact: true }) });

/** Each tab's count must equal the cards that tab shows. */
async function expectCountsMatchCards(page: Page) {
  const tabs = page
    .getByRole("navigation", { name: "Filter events" })
    .getByRole("link");
  const labels = ["All", "Live", "Upcoming", "Judging", "Finished"];
  for (const label of labels) {
    const tab = tabs.filter({ hasText: new RegExp(`^${label}\\s*\\d+$`) });
    const count = Number(
      ((await tab.textContent()) ?? "").replace(/\D+/g, ""),
    );
    await tab.click();
    await expect(tab).toHaveAttribute("aria-current", "page");
    await expect(cards(page)).toHaveCount(count);
  }
  await tabs.filter({ hasText: /^All/ }).click();
  await expect(page).toHaveURL(/\/organizer$/);
}

test("an organizer sees only the events they created", async ({ page }) => {
  await logIn(page, SECOND);

  await expect(card(page, SECOND_EVENT)).toHaveCount(1);
  for (const name of FIRST_EVENTS) await expect(card(page, name)).toHaveCount(0);
  await expectCountsMatchCards(page);

  // The event chip's switch menu lists the same events.
  await card(page, SECOND_EVENT).getByRole("link").click();
  await expect(page).toHaveURL(/\/organizer\/events\/[^/]+$/);
  await page.getByRole("button", { name: /Switch event/ }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByText(SECOND_EVENT)).toBeVisible();
  for (const name of FIRST_EVENTS) await expect(menu.getByText(name)).toHaveCount(0);
});

test("another organizer's events stay off the list but open by URL", async ({
  page,
}) => {
  await logIn(page, SECOND);
  await card(page, SECOND_EVENT).getByRole("link").click();
  await expect(page).toHaveURL(/\/organizer\/events\/[^/]+$/);
  // Wait for the page itself, not just the URL: a response still in flight can
  // set the session cookie again after clearCookies().
  await expect(
    page.getByRole("heading", { level: 1, name: SECOND_EVENT }),
  ).toBeVisible();
  const secondUrl = page.url();
  await page.context().clearCookies();

  await logIn(page, FIRST);
  for (const name of FIRST_EVENTS) await expect(card(page, name)).toHaveCount(1);
  await expect(card(page, SECOND_EVENT)).toHaveCount(0);
  await expectCountsMatchCards(page);

  // Managing any event is still open to every organizer.
  await page.goto(secondUrl);
  await expect(
    page.getByRole("heading", { level: 1, name: SECOND_EVENT }),
  ).toBeVisible();
});
