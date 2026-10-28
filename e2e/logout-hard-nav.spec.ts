import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";

// Log out used to be a client-side redirect. The signed-in routes the router
// keeps alive stayed in the page (the email, My events, My profile), Back
// showed the signed-in My events again before the proxy sent it to /login,
// the phone menu stayed open over the landing, and nothing showed that log
// out had started. On a slow phone it looked as if log out hadn't worked
// until the page was reloaded. Log out is now a full page load, with a pending
// state, under a slow network and CPU like a mid-range phone's.

const PHONE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const PASSWORD = "correct-horse-1";

// bcrypt on register, then every step under a throttled network.
test.describe.configure({ timeout: 120_000 });

function uniqueEmail() {
  return `logout.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/);
}

/** DevTools' "Slow 4G" and a 4x slower CPU. */
async function slowPhoneConditions(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 562.5,
    downloadThroughput: (1.6 * 1024 * 1024 * 0.9) / 8,
    uploadThroughput: (750 * 1024 * 0.9) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}

/**
 * Records every signed-in page heading that becomes visible, in this and every
 * later document of the page.
 */
async function watchSignedInHeadings(page: Page) {
  const seen: string[] = [];
  await page.exposeFunction("reportSignedInHeading", (text: string) => {
    seen.push(text);
  });
  await page.addInitScript(() => {
    const report = (window as unknown as {
      reportSignedInHeading: (text: string) => void;
    }).reportSignedInHeading;
    new MutationObserver(() => {
      for (const h1 of document.querySelectorAll("h1")) {
        const text = h1.textContent ?? "";
        if (/My events|My profile/.test(text) && h1.checkVisibility()) {
          report(`${location.pathname}: ${text}`);
        }
      }
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
  return seen;
}

/** Server action posts (log out is the only one on these pages). */
function countActions(page: Page) {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) {
      posts.push(request.url());
    }
  });
  return posts;
}

const tabBar = (page: Page) =>
  page.getByRole("navigation", { name: "Sections", exact: true });

async function visit(nav: Locator, page: Page, label: string, path: string) {
  await nav.getByRole("link", { name: label, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await page.waitForLoadState("networkidle");
}

/** A second press while logging out is under way must not post again. */
async function pressAgain(button: Locator) {
  await button.evaluate((el) => el.closest("form")?.requestSubmit());
}

/** Everything that must hold once log out has finished. */
async function expectLoggedOut(
  page: Page,
  context: BrowserContext,
  email: string,
  seen: string[],
) {
  await expect(page.getByText("You're logged out.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

  const cookies = await context.cookies();
  expect(cookies.filter((c) => c.name.includes("session-token"))).toEqual([]);
  await expect(tabBar(page)).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // Nothing of the signed-in session is left in the page, hidden or not.
  expect(
    (await page.content()).includes(email),
    "the email is still in the page",
  ).toBe(false);
  // The other tabs of the browser follow on focus (AuthSync).
  expect(
    await page.evaluate(() => localStorage.getItem("hackhub:auth")),
  ).toBe("");

  // Back goes to the page before the one log out was pressed on: a signed-in
  // page, so it must show /login, and never the signed-in page on the way.
  seen.length = 0;
  await page.goBack();
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fmy-events$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Log in" }),
  ).toBeVisible();
  await expect(tabBar(page)).toHaveCount(0);
  expect(seen).toEqual([]);

  await page.goto("/my-events");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fmy-events$/);
}

test("log out from the phone menu on a slow phone ends on the signed-out landing, with nothing signed-in left", async ({
  browser,
}) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  const seen = await watchSignedInHeadings(page);
  const email = uniqueEmail();
  await register(page, email);

  await page.goto("/my-events");
  await page.waitForLoadState("networkidle");
  await slowPhoneConditions(page);
  // Around the app with the tab bar, so the router has these routes cached.
  for (const [label, path] of [
    ["Events", "/events"],
    ["My events", "/my-events"],
    ["Profile", "/profile"],
  ]) {
    await visit(tabBar(page), page, label, path);
  }

  const actions = countActions(page);
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(async () => {
    await page.getByRole("button", { name: "Open menu" }).tap();
    await expect(menu).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await menu.getByRole("button", { name: "Log out" }).tap();

  // At once: the button says so and can't be pressed again.
  const pending = menu.getByRole("button", { name: "Logging out…" });
  await expect(pending).toBeVisible();
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute("aria-busy", "true");
  await pressAgain(pending);

  await expectLoggedOut(page, context, email, seen);
  expect(actions).toHaveLength(1);
  await context.close();
});

test("log out from the desktop user menu shows it's under way and ends on the signed-out landing", async ({
  browser,
}) => {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  const seen = await watchSignedInHeadings(page);
  const email = uniqueEmail();
  await register(page, email);

  await page.goto("/my-events");
  await page.waitForLoadState("networkidle");
  await slowPhoneConditions(page);
  const mainNav = page.getByRole("navigation", { name: "Main" });
  await visit(mainNav, page, "Events", "/events");
  await visit(mainNav, page, "My events", "/my-events");
  // On to My profile from the user menu: log out from there, so Back goes to
  // /my-events.
  await page.getByRole("button", { name: email }).click();
  await page.getByRole("menuitem", { name: "My profile" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.waitForLoadState("networkidle");

  const actions = countActions(page);
  await page.getByRole("button", { name: email }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  // The menu stays open, so the form isn't unmounted mid-submit.
  const pending = page.getByRole("menuitem", { name: "Logging out…" });
  await expect(pending).toBeVisible();
  await expect(pending).toHaveAttribute("aria-busy", "true");
  await expect(pending).toHaveAttribute("aria-disabled", "true");
  await pressAgain(pending);

  await expectLoggedOut(page, context, email, seen);
  expect(actions).toHaveLength(1);
  await context.close();
});

test("closing the user menu while logging out still logs out", async ({
  browser,
}) => {
  const context = await browser.newContext(DESKTOP);
  const page = await context.newPage();
  const email = uniqueEmail();
  await register(page, email);
  await page.goto("/my-events");
  await page.waitForLoadState("networkidle");
  await slowPhoneConditions(page);

  await page.getByRole("button", { name: email }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);

  await expect(page.getByText("You're logged out.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  const cookies = await context.cookies();
  expect(cookies.filter((c) => c.name.includes("session-token"))).toEqual([]);
  expect(
    (await page.content()).includes(email),
    "the email is still in the page",
  ).toBe(false);
  await context.close();
});

test("log out without a connection says so and can be tried again", async ({
  browser,
}) => {
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  await register(page, uniqueEmail());
  await page.goto("/my-events");
  await page.waitForLoadState("networkidle");

  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(async () => {
    await page.getByRole("button", { name: "Open menu" }).tap();
    await expect(menu).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await context.setOffline(true);
  await menu.getByRole("button", { name: "Log out" }).tap();
  await expect(
    page.getByText("Couldn't log out. Check your connection and try again."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/my-events$/);
  await expect(menu.getByRole("button", { name: "Log out" })).toBeEnabled();

  await context.setOffline(false);
  await menu.getByRole("button", { name: "Log out" }).tap();
  await expect(page.getByText("You're logged out.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  const cookies = await context.cookies();
  expect(cookies.filter((c) => c.name.includes("session-token"))).toEqual([]);
  await context.close();
});
