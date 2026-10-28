import "dotenv/config";

import { expect, test, type Page } from "@playwright/test";

// "Events I run" (/organizer) lists only the events the signed-in organizer
// created, and its tab counts and the event chip's switch menu follow. Access
// matches: another organizer's event pages are not found, and posting to an
// action bound to another organizer's event changes nothing.
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

/** The second organizer's event id, read from their own "Events I run". */
async function secondEventId(page: Page) {
  await logIn(page, SECOND);
  await card(page, SECOND_EVENT).getByRole("link").click();
  await expect(page).toHaveURL(/\/organizer\/events\/[^/]+$/);
  // Wait for the page itself, not just the URL: a response still in flight can
  // set the session cookie again after clearCookies().
  await expect(
    page.getByRole("heading", { level: 1, name: SECOND_EVENT }),
  ).toBeVisible();
  const id = new URL(page.url()).pathname.split("/").pop()!;
  await page.context().clearCookies();
  return id;
}

const NOT_FOUND = "We couldn't find this page.";

test("another organizer's events stay off the list and aren't found by URL", async ({
  page,
}) => {
  const secondId = await secondEventId(page);

  await logIn(page, FIRST);
  for (const name of FIRST_EVENTS) await expect(card(page, name)).toHaveCount(1);
  await expect(card(page, SECOND_EVENT)).toHaveCount(0);
  await expectCountsMatchCards(page);

  // Every page of another organizer's event is the not-found page, the same as
  // an unknown id. These pages stream (the guard runs inside Suspense), so the
  // status is already sent; notFound() shows the 404 page and marks it noindex.
  for (const sub of [
    "",
    "/edit",
    "/criteria",
    "/participants",
    "/participants/teams",
    "/ranking",
  ]) {
    await page.goto(`/organizer/events/${secondId}${sub}`);
    await expect(page.getByText(NOT_FOUND), sub || "overview").toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.getByText(SECOND_EVENT)).toHaveCount(0);
  }

  // The public event page offers them no "Manage event" either.
  await page.goto(`/events/${secondId}`);
  await expect(
    page.getByRole("heading", { level: 1, name: SECOND_EVENT }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Manage event" })).toHaveCount(0);
});

test("an action bound to another organizer's event changes nothing", async ({
  page,
}) => {
  const secondId = await secondEventId(page);

  // The first organizer opens their own closed event's overview...
  await logIn(page, FIRST);
  await card(page, "Demo Hack · judging").getByRole("link").click();
  await expect(page).toHaveURL(/\/organizer\/events\/[^/]+$/);
  const ownUrl = page.url();
  const ownId = new URL(ownUrl).pathname.split("/").pop()!;
  const registration = page.getByRole("switch", { name: "Registration" });
  await page.getByText("Manual controls").click();
  await expect(registration).not.toBeChecked();

  // ...and posts "open registration" with the second organizer's event id in
  // place of their own: what a hand-made request to the action would send.
  let rewritten = 0;
  await page.route(ownUrl, async (route) => {
    const request = route.request();
    const body = request.postData();
    if (request.method() !== "POST" || !body?.includes(ownId)) {
      return route.continue();
    }
    rewritten++;
    await route.continue({ postData: body.replaceAll(ownId, secondId) });
  });
  const posted = page.waitForResponse(
    (r) => r.request().method() === "POST" && r.url() === ownUrl,
  );
  await registration.click();
  await posted;
  expect(rewritten).toBe(1);
  await page.unroute(ownUrl);

  // The second organizer's event is still closed, so it isn't listed (wait
  // for the list itself: it streams in)...
  await page.goto("/events");
  await expect(
    page.getByRole("link", { name: /Open Hack · live/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: SECOND_EVENT })).toHaveCount(0);
  // ...and the first organizer's own event wasn't touched either.
  await page.goto(ownUrl);
  await page.getByText("Manual controls").click();
  await expect(
    page.getByRole("switch", { name: "Registration" }),
  ).not.toBeChecked();
});
