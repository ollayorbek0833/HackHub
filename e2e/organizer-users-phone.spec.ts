import "dotenv/config";

import { expect, test, type Browser, type Page } from "@playwright/test";

// /organizer/users lists everyone, but sends a phone only for people who
// registered for at least one event the signed-in organizer created. For
// anyone else no phone leaves the server: not in the panel, not in the page's
// HTML or its React payload.
//
// Needs the demo seed: the first organizer (SEED_ORGANIZER_EMAIL) created
// "Open Hack · live", which has registration open.

test.describe.configure({ timeout: 120_000 });

const PASSWORD = "correct-horse-1";

async function newPage(browser: Browser) {
  return (await browser.newContext()).newPage();
}

/** A fresh participant with a complete profile and this phone. */
async function participantWithPhone(page: Page, phone: string) {
  const email = `users.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByLabel("Name").fill("Phone Owner");
  await page.getByLabel("Faculty").fill("Computer Science");
  await page.getByLabel("Phone", { exact: true }).fill(phone);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page).toHaveURL(/\/events$/);
  return email;
}

async function logInOrganizer(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.SEED_ORGANIZER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.SEED_ORGANIZER_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/organizer$/);
}

/** Opens the user's detail panel on /organizer/users. */
async function openUser(page: Page, email: string) {
  await page.goto(`/organizer/users?q=${encodeURIComponent(email)}`);
  await page
    .getByRole("button", { name: /open details/ })
    .first()
    .click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByText(email)).toBeVisible();
  return panel;
}

test("a user who isn't registered for any of your events shows no phone", async ({
  browser,
}) => {
  // Registered for nothing.
  const stranger = await newPage(browser);
  const strangerEmail = await participantWithPhone(stranger, "90 777-31-29");

  // Registered for the organizer's "Open Hack · live".
  const entrant = await newPage(browser);
  const entrantEmail = await participantWithPhone(entrant, "90 555-42-18");
  await entrant
    .getByRole("link", { name: /Open Hack · live/ })
    .first()
    .click();
  await expect(entrant).toHaveURL(/\/events\/[^/]+$/);
  await entrant.getByRole("button", { name: "Register", exact: true }).click();
  await expect(
    entrant.getByRole("link", { name: "Registered (done)" }),
  ).toBeVisible();

  const organizer = await newPage(browser);
  await logInOrganizer(organizer);

  // The stranger: listed, but no phone anywhere in the page.
  const strangerPanel = await openUser(organizer, strangerEmail);
  await expect(
    strangerPanel.getByText("Only shown for your events' participants"),
  ).toBeVisible();
  await expect(strangerPanel.locator("a[href^='tel:']")).toHaveCount(0);
  const html = await organizer.content();
  expect(html).not.toContain("907773129");
  expect(html).not.toContain("777 31 29");

  // Searching by their phone finds nobody: it was never sent.
  await organizer.goto("/organizer/users?q=907773129");
  await expect(organizer.getByText(strangerEmail)).toHaveCount(0);

  // The entrant: the phone is there as a tel: link.
  const entrantPanel = await openUser(organizer, entrantEmail);
  await expect(entrantPanel.locator("a[href^='tel:']")).toHaveAttribute(
    "href",
    "tel:+998905554218",
  );
  await expect(entrantPanel.locator("a[href^='tel:']")).toHaveText(
    "+998 90 555 42 18",
  );
});
