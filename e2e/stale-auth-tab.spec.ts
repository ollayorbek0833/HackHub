import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

// A tab opened before a log in or log out elsewhere kept the other state's
// shell: the header and tab bar live in the root layout, which a client-side
// navigation never re-renders. On a phone, tapping "Log in" in such a tab left
// a blank page. Any change of auth state must now bring the tab to the right
// shell: on focus, when another tab of the browser logs in or out, and when a
// stale tab opens /login or /register.

const PHONE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};
test.use(PHONE);
// bcrypt runs on register and log in.
test.describe.configure({ timeout: 60_000 });

const PASSWORD = "correct-horse-1";

function uniqueEmail() {
  return `stale.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).tap();
  await expect(page).toHaveURL(/\/profile$/);
}

/** A signed-in session for a fresh participant, made in its own context. */
async function sessionCookies(browser: Browser) {
  const ctx = await browser.newContext(PHONE);
  await register(await ctx.newPage(), uniqueEmail());
  const cookies = (await ctx.cookies()).filter((c) =>
    c.name.includes("session-token"),
  );
  await ctx.close();
  expect(cookies).not.toEqual([]);
  return cookies;
}

const tabBar = (page: Page) =>
  page.getByRole("navigation", { name: "Sections" });

/** Opens the phone menu. The button works once React has hydrated: retry. */
async function openMenu(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Menu" });
  await expect(async () => {
    await page.getByRole("button", { name: "Open menu" }).tap();
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  return dialog;
}

/** The phone menu's line under "Menu": the account, or the visitor greeting. */
async function menuGreeting(page: Page) {
  const dialog = await openMenu(page);
  const text = await dialog.locator("p").first().innerText();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  return text;
}

/** The participant shell: tab bar, the account in the menu, My events. */
async function expectSignedInHome(page: Page) {
  await expect(page).toHaveURL(/\/my-events$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "My events" }),
  ).toBeVisible();
  await expect(tabBar(page)).toBeVisible();
  expect(await menuGreeting(page)).toContain("Participant");
}

/** Wait for hydration: the landing's menu button reacts once React runs. */
async function openLanding(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(tabBar(page)).toHaveCount(0);
}

test("a stale signed-out tab that taps Log in lands on the signed-in home, never a blank page", async ({
  browser,
}) => {
  const ctx: BrowserContext = await browser.newContext(PHONE);
  const page = await ctx.newPage();
  await openLanding(page);

  // Signed in elsewhere: the cookie arrives with no event in this tab.
  await ctx.addCookies(await sessionCookies(browser));

  await (await openMenu(page)).getByRole("link", { name: "Log in" }).tap();

  await expectSignedInHome(page);
  await ctx.close();
});

test("a stale signed-out tab picks up a log in from elsewhere when it regains focus", async ({
  browser,
}) => {
  const ctx = await browser.newContext(PHONE);
  const page = await ctx.newPage();
  await openLanding(page);

  await ctx.addCookies(await sessionCookies(browser));
  // Coming back to the tab: the browser fires these on a real phone.
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });

  await expectSignedInHome(page);
  await ctx.close();
});

test("logging in in one tab brings the other tab of the browser to the signed-in app", async ({
  browser,
}) => {
  const ctx = await browser.newContext(PHONE);
  const a = await ctx.newPage();
  await openLanding(a);

  const b = await ctx.newPage();
  await register(b, uniqueEmail());
  await b.close();

  await a.bringToFront();
  await expectSignedInHome(a);
  await ctx.close();
});

test("logging out in one tab drops the other tab to the signed-out state", async ({
  browser,
}) => {
  const ctx = await browser.newContext(PHONE);
  const a = await ctx.newPage();
  await register(a, uniqueEmail());
  await a.goto("/my-events");
  await expectSignedInHome(a);

  const b = await ctx.newPage();
  await b.goto("/my-events");
  await (await openMenu(b)).getByRole("button", { name: "Log out" }).tap();
  await expect(b.getByText("You're logged out.")).toBeVisible();
  await b.close();

  await a.bringToFront();
  await expect(a).toHaveURL(/\/login\?callbackUrl=%2Fmy-events$/);
  await expect(a.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  await expect(tabBar(a)).toHaveCount(0);
  expect(await menuGreeting(a)).toBe("Welcome to HackHub");
  await ctx.close();
});

test("a signed-in user typing /login or / lands on their home with the signed-in header", async ({
  page,
}) => {
  await register(page, uniqueEmail());
  for (const path of ["/login", "/register", "/"]) {
    await page.goto(path);
    await expectSignedInHome(page);
  }
});

test("without JavaScript a signed-in user on /login or / still goes home", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ ...PHONE, javaScriptEnabled: false });
  await ctx.addCookies(await sessionCookies(browser));
  const page = await ctx.newPage();
  for (const path of ["/login", "/"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/my-events$/);
  }
  await ctx.close();
});
