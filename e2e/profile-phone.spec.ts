import "dotenv/config";

import { expect, test, type Browser, type Page } from "@playwright/test";

// The optional profile phone: typed any way, saved as +998…, shown grouped;
// a value that isn't a phone is flagged on blur; clearing it saves nothing.
// On /profile/[userId] only the owner and the organizers of events the owner
// registered for see it; other organizers, participants and judges don't.
// Needs the demo seed (npm run db:seed:demo): the first organizer
// (SEED_ORGANIZER_EMAIL / SEED_ORGANIZER_PASSWORD) created "Open Hack · live";
// organizer2@hackhub.test and judge@hackhub.test log in with
// SEED_DEMO_PASSWORD.

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
test.describe.configure({ timeout: 90_000 });

const PASSWORD = "correct-horse-1";
const PHONE_ERROR = "Enter a phone number like +998 90 123 45 67.";

async function registerFresh(page: Page) {
  await page.goto("/register");
  await page
    .getByLabel("Email")
    .fill(`phone.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/);
}

const phoneField = (page: Page) => page.getByLabel("Phone", { exact: true });
const savedToast = (page: Page) =>
  page.locator("[data-sonner-toast]").filter({ hasText: "Profile saved." });

async function saveFirstProfile(page: Page, phone: string) {
  await page.getByLabel("Name").fill("Phone Tester");
  await page.getByLabel("Faculty").fill("Computer Science");
  await phoneField(page).fill(phone);
  await page.getByRole("button", { name: "Save profile" }).click();
  // The first save after registering goes on to /events.
  await expect(page).toHaveURL(/\/events$/);
}

test("a local number is saved as +998 and shown grouped", async ({ page }) => {
  await registerFresh(page);
  await expect(phoneField(page)).toHaveAttribute("type", "tel");
  await expect(phoneField(page)).toHaveAttribute("autocomplete", "tel");
  await expect(phoneField(page)).toHaveAttribute("inputmode", "tel");
  await expect(
    page.getByText("Optional. Organizers use it to reach your team."),
  ).toBeVisible();

  await saveFirstProfile(page, "90 123-45-67");

  await page.goto("/profile");
  await page.reload();
  await expect(phoneField(page)).toHaveValue("+998 90 123 45 67");

  // A later save keeps it as it is.
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(savedToast(page)).toHaveCount(1);
  await page.reload();
  await expect(phoneField(page)).toHaveValue("+998 90 123 45 67");
});

test("a value that isn't a phone is flagged on blur", async ({ page }) => {
  await registerFresh(page);

  await phoneField(page).fill("12ab");
  await phoneField(page).blur();

  await expect(phoneField(page)).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#phone-error")).toHaveText(PHONE_ERROR);

  // The server refuses it too, and the typed value stays.
  await page.getByLabel("Name").fill("Phone Tester");
  await page.getByLabel("Faculty").fill("Computer Science");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.locator("#phone-error")).toHaveText(PHONE_ERROR);
  await expect(page).toHaveURL(/\/profile$/);
  await expect(phoneField(page)).toHaveValue("12ab");

  // Fixing it clears the message as you type.
  await phoneField(page).fill("+998 90 123 45 67");
  await expect(page.locator("#phone-error")).toHaveCount(0);
});

test("clearing the phone saves no phone", async ({ page }) => {
  await registerFresh(page);
  await saveFirstProfile(page, "998901234567");

  await page.goto("/profile");
  await expect(phoneField(page)).toHaveValue("+998 90 123 45 67");
  await phoneField(page).fill("");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(savedToast(page)).toHaveCount(1);

  await page.reload();
  await expect(phoneField(page)).toHaveValue("");
});

/** A new 390 px context, so each person has their own session. */
async function phonePage(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  return context.newPage();
}

async function sessionUserId(page: Page): Promise<string> {
  const res = await page.request.get("/api/auth/session");
  const session = (await res.json()) as { user: { id: string } };
  return session.user.id;
}

const telLink = (page: Page) => page.locator("main a[href^='tel:']");

async function logIn(
  page: Page,
  { email, password }: { email: string; password: string },
  home: RegExp,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(home);
}

const ORGANIZER = {
  email: process.env.SEED_ORGANIZER_EMAIL!,
  password: process.env.SEED_ORGANIZER_PASSWORD!,
};
const ORGANIZER2 = {
  email: "organizer2@hackhub.test",
  password: process.env.SEED_DEMO_PASSWORD!,
};
const JUDGE = {
  email: "judge@hackhub.test",
  password: process.env.SEED_DEMO_PASSWORD!,
};
const OPEN_EVENT = "Open Hack · live";

/** No phone on the page at all, not even its label. */
async function expectNoPhone(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Phone Tester" }),
  ).toBeVisible();
  await expect(telLink(page)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Phone", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("886");
}

test("only the owner and their events' organizers see a profile's phone", async ({
  browser,
}) => {
  // A saves a phone.
  const a = await phonePage(browser);
  await registerFresh(a);
  await saveFirstProfile(a, "90 886-54-12");
  const aId = await sessionUserId(a);

  // A sees their own.
  await a.goto(`/profile/${aId}`);
  await expect(a.getByRole("heading", { name: "Phone Tester" })).toBeVisible();
  await expect(telLink(a)).toHaveAttribute("href", "tel:+998908865412");
  await expect(telLink(a)).toHaveText("+998 90 886 54 12");

  // Until A registers for one of their events, the organizer doesn't.
  const o = await phonePage(browser);
  await logIn(o, ORGANIZER, /\/organizer/);
  await o.goto(`/profile/${aId}`);
  await expectNoPhone(o);

  // A registers for the first organizer's open event.
  await a.goto("/events");
  await a
    .getByRole("link", { name: new RegExp(OPEN_EVENT) })
    .first()
    .click();
  await expect(a).toHaveURL(/\/events\/[^/]+$/);
  await a.getByRole("button", { name: "Register", exact: true }).click();
  await expect(
    a.getByRole("link", { name: "Registered (done)" }),
  ).toBeVisible();

  // Now that organizer does.
  await o.goto(`/profile/${aId}`);
  await expect(telLink(o)).toHaveAttribute("href", "tel:+998908865412");
  await expect(telLink(o)).toHaveText("+998 90 886 54 12");

  // organizer2, whose own event A isn't registered for, doesn't.
  const o2 = await phonePage(browser);
  await logIn(o2, ORGANIZER2, /\/organizer/);
  await o2.goto(`/profile/${aId}`);
  await expectNoPhone(o2);

  // Another participant doesn't.
  const b = await phonePage(browser);
  await registerFresh(b);
  await b.goto(`/profile/${aId}`);
  await expectNoPhone(b);

  // A judge doesn't.
  const j = await phonePage(browser);
  await logIn(j, JUDGE, /\/judge/);
  await j.goto(`/profile/${aId}`);
  await expectNoPhone(j);
});

test("only the organizer who created an event sees Manage event on its page", async ({
  browser,
}) => {
  const manage = (page: Page) =>
    page.getByRole("link", { name: "Manage event" });

  // The first organizer created the open event.
  const o = await phonePage(browser);
  await logIn(o, ORGANIZER, /\/organizer/);
  await o.goto("/events");
  await o
    .getByRole("link", { name: new RegExp(OPEN_EVENT) })
    .first()
    .click();
  await expect(o).toHaveURL(/\/events\/[^/]+$/);
  const eventPath = new URL(o.url()).pathname;
  await expect(manage(o)).toBeVisible();
  await expect(manage(o)).toHaveAttribute("href", `/organizer${eventPath}`);

  // organizer2 gets a note instead: no Manage event, nothing to register.
  const o2 = await phonePage(browser);
  await logIn(o2, ORGANIZER2, /\/organizer/);
  await o2.goto(eventPath);
  await expect(o2.getByRole("heading", { level: 1 })).toHaveText(OPEN_EVENT);
  await expect(manage(o2)).toHaveCount(0);
  // The rail's copy is hidden below md; the docked one shows.
  await expect(
    o2
      .getByText("Organizers don't register for events.")
      .filter({ visible: true }),
  ).toHaveCount(1);
  await expect(o2.getByRole("button", { name: "Register" })).toHaveCount(0);
  await expect(
    o2.getByRole("link", { name: "Log in to register" }),
  ).toHaveCount(0);
});
