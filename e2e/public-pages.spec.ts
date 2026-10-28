import { expect, test } from "@playwright/test";

// The public site pages (landing plan > New pages) and the SEO files, on a
// phone: each page loads signed out with its one h1 and its own title, nothing
// scrolls sideways, and robots.txt and sitemap.xml answer.
test.use({ viewport: { width: 390, height: 844 } });

const PAGES = [
  { path: "/about", h1: "About HackHub", title: "About · HackHub" },
  { path: "/privacy", h1: "Privacy", title: "Privacy · HackHub" },
  { path: "/terms", h1: "Terms of use", title: "Terms · HackHub" },
  { path: "/contact", h1: "Contact", title: "Contact · HackHub" },
];

for (const { path, h1, title } of PAGES) {
  test(`${path} loads with its heading and title`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/og\.png$/,
    );

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("the privacy page states the cookies, the analytics and the update date", async ({
  page,
}) => {
  await page.goto("/privacy");
  const main = page.getByRole("main");
  await expect(main.getByText("__Secure-authjs.session-token")).toBeVisible();
  await expect(main.getByText(/Cloudflare Web Analytics/)).toBeVisible();
  await expect(main.getByText("Last updated: 28 October 2026")).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /the cookies it uses/,
  );
});

for (const { path, title } of [
  { path: "/login", title: "Log in · HackHub" },
  { path: "/register", title: "Create an account · HackHub" },
]) {
  test(`${path} has its own title and canonical link`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://hackhub.mekhroj.uz${path}`,
    );
  });
}

test("the contact page points to GitHub only, with no email", async ({ page }) => {
  await page.goto("/contact");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Read the security policy" })).toHaveAttribute(
    "href",
    /\/SECURITY\.md$/,
  );
  await expect(main.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(main.locator("form")).toHaveCount(0);
});

test("the landing page has the participants and judges section and a keyboard FAQ", async ({
  page,
}) => {
  await page.goto("/");

  const roles = page.locator("#participants-judges");
  await expect(roles.getByRole("heading", { level: 2 })).toHaveText("Built for the people in the room");
  for (const name of ["Participants", "Judges"]) {
    await expect(roles.getByRole("heading", { level: 3, name })).toBeVisible();
  }
  // The "Example" vignettes are decorative: nothing in them takes focus.
  await expect(roles.locator("a, button, input, [tabindex]")).toHaveCount(0);

  const faq = page.locator("#faq");
  await expect(faq.getByRole("heading", { level: 2 })).toHaveText("Questions, answered");
  const first = faq.locator("details").first();
  await expect(first).not.toHaveAttribute("open", "");
  await first.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.getByText(/no payments anywhere/)).toBeVisible();
});

test("robots.txt allows the public site and points to the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("Allow: /");
  expect(body).toContain("Disallow: /organizer");
  expect(body).toContain("Sitemap: https://hackhub.mekhroj.uz/sitemap.xml");
});

test("sitemap.xml lists the public pages", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  for (const path of ["", "/events", "/about", "/privacy", "/terms", "/contact"]) {
    expect(body).toContain(`<loc>https://hackhub.mekhroj.uz${path}</loc>`);
  }
});

test("og.png is a 1200×630 PNG", async ({ request }) => {
  const response = await request.get("/og.png");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toBe("image/png");
  const png = await response.body();
  // The IHDR chunk: width and height as big-endian 32-bit ints at bytes 16–23.
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});
