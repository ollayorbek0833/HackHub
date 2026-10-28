import { expect, test, type Page } from "@playwright/test";

// docs/06 TC-44 – TC-51 (docs/07 > Testing). Needs a migrated database; each
// run registers a fresh address, so the spec doesn't depend on the seed.

const PASSWORD = "correct-horse-1";

// bcrypt runs on register and log in, so the tests run one at a time and get
// more time than usual. /profile must exist (card #4) for the first test.
test.describe.configure({ mode: "default", timeout: 60_000 });

function uniqueEmail() {
  return `Ana.${Date.now()}.${Math.floor(Math.random() * 1e6)}@Example.com`;
}

async function registerAs(page: Page, email: string, password = PASSWORD) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
}

async function logIn(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

test("register signs in and lands on /profile (TC-44, TC-49)", async ({
  page,
}) => {
  await registerAs(page, uniqueEmail());
  await expect(page).toHaveURL(/\/profile$/);
  await expect(
    page.getByText(
      "Account created. Add your name and faculty to finish your profile.",
    ),
  ).toBeVisible();
});

test("a short password and a mismatch are refused (TC-45)", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password").fill("different");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("register validates each field on blur, and the error goes once it's fixed", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill("not-an-email");
  // Retry the blur until React has hydrated and the handler reacts.
  await expect(async () => {
    await page.getByLabel("Email").focus();
    await page.getByLabel("Password", { exact: true }).focus();
    await expect(
      page.getByText("Enter a valid email address, like name@example.com."),
    ).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 15_000 });

  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password").focus();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  // Typing a valid password clears the message without another blur.
  await page.getByLabel("Password", { exact: true }).fill("long-enough-1");
  await expect(page.getByText("Use at least 8 characters.")).toHaveCount(0);

  await page.getByLabel("Confirm password").fill("different-1");
  await page.getByLabel("Email").focus();
  await expect(page.getByText("The passwords don't match.")).toBeVisible();
  // Nothing was submitted: still on /register with the values kept.
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
});

test("login asks for both fields on blur", async ({ page }) => {
  await page.goto("/login");
  // Blur handlers only exist once React has hydrated: retry the blur until
  // they react, instead of racing a cold page.
  await expect(async () => {
    await page.getByLabel("Email").focus();
    await page.getByLabel("Password").focus();
    await page.getByRole("button", { name: "Log in" }).focus();
    await expect(page.getByText("Enter your email.")).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByText("Enter your password.")).toBeVisible();
});

test("a duplicate email in another letter case is refused (TC-46, TC-50)", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail();
  await registerAs(page, email);
  await expect(page).toHaveURL(/\/profile$/);

  const other = await browser.newPage();
  await registerAs(other, email.toLowerCase());
  await expect(
    other.getByText("An account with this email already exists."),
  ).toBeVisible();
  await expect(other.getByRole("link", { name: "Log in instead." })).toBeVisible();
  await other.close();
});

test("either spelling of the email logs in, and log out works (TC-48)", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail();
  await registerAs(page, email);
  await expect(page).toHaveURL(/\/profile$/);

  const other = await browser.newPage();
  await other.goto("/login");
  await logIn(other, email.toLowerCase());
  await expect(other).toHaveURL(/\/my-events$/);

  await other.getByRole("button", { name: email.toLowerCase() }).click();
  await other.getByRole("menuitem", { name: "Log out" }).click();
  await expect(other.getByText("You're logged out.")).toBeVisible();
  await expect(other).toHaveURL(/\/$/);
  // The session is really gone, not only hidden: the cookie isn't there and a
  // signed-in page sends the visitor to log in.
  const cookies = await other.context().cookies();
  expect(cookies.filter((c) => c.name.includes("session-token"))).toEqual([]);
  await other.goto("/my-events");
  await expect(other).toHaveURL(/\/login\?callbackUrl=%2Fmy-events$/);
  await other.close();
});

test("a signed-in request doesn't re-issue the session cookie, so one in flight can't undo log out", async ({
  page,
}) => {
  await registerAs(page, uniqueEmail());
  await expect(page).toHaveURL(/\/profile$/);

  // Prefetches leave while signed in and can land after log out. If the proxy
  // set the session cookie on them, they would sign the user back in.
  // /api/auth-state is what a tab asks when it comes back into view.
  for (const path of ["/my-events", "/", "/events", "/api/auth-state"]) {
    const response = await page.request.get(path, { maxRedirects: 0 });
    const setCookies = response
      .headersArray()
      .filter((h) => h.name.toLowerCase() === "set-cookie")
      .map((h) => h.value);
    expect(
      setCookies.filter((c) => c.includes("session-token")),
      path,
    ).toEqual([]);
  }
});

test("a wrong password shows one message and creates no session (TC-51)", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail();
  await registerAs(page, email);

  const other = await browser.newPage();
  await other.goto("/login");
  await logIn(other, email, "wrong-password");
  await expect(other.getByText("Email or password is incorrect.")).toBeVisible();
  await other.goto("/my-events");
  await expect(other).toHaveURL(/\/login\?callbackUrl=%2Fmy-events$/);
  await other.close();
});

test("a signed-out visitor goes to /login and back after logging in", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail();
  await registerAs(page, email);

  const other = await browser.newPage();
  await other.goto("/profile");
  await expect(other).toHaveURL(/\/login\?callbackUrl=%2Fprofile$/);
  await logIn(other, email);
  await expect(other).toHaveURL(/\/profile$/);
  // Signed in now, so /login sends the user to their role home.
  await other.goto("/login");
  await expect(other).toHaveURL(/\/my-events$/);
  await other.close();
});
