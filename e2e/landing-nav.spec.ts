import { expect, test, type Page } from "@playwright/test";

// The landing page's section links (header for visitors) and the section
// reveal: every link lands its section just under the sticky header, the
// current section is marked while scrolling, deep links work, and no section
// content is ever left hidden (reduced motion, no JavaScript, a 320×256
// viewport).

const SECTIONS: [label: string, id: string][] = [
  ["How it works", "how-it-works"],
  ["Organizers", "for-organizers"],
  ["Judging", "fair-judging"],
  ["Events", "happening-now"],
  ["FAQ", "faq"],
];

const HEADER_H = 64;

/** The section's top sits on the header line and its heading shows below it. */
async function expectLandedOn(page: Page, id: string) {
  await expect(page).toHaveURL(new RegExp(`/#${id}$`));
  // Where the section and its heading come to rest (two equal reads in a
  // row, so a smooth scroll passing by doesn't count).
  const settled = () =>
    page.evaluate(async (sectionId) => {
      const read = () => {
        const section = document.getElementById(sectionId)!;
        const heading = document.getElementById(`${sectionId}-heading`)!;
        return [
          Math.round(section.getBoundingClientRect().top),
          Math.round(heading.getBoundingClientRect().top),
          Math.round(heading.getBoundingClientRect().bottom),
        ];
      };
      const first = read();
      await new Promise((resolve) => setTimeout(resolve, 150));
      const second = read();
      return first.join() === second.join() ? second : null;
    }, id);
  await expect
    .poll(
      async () => {
        const at = await settled();
        if (!at) return "moving";
        const [sectionTop, headingTop, headingBottom] = at;
        const viewport = page.viewportSize()!.height;
        return Math.abs(sectionTop - HEADER_H) <= 2 &&
          headingTop >= HEADER_H &&
          headingBottom <= viewport
          ? "landed"
          : `section at ${sectionTop}, heading at ${headingTop}`;
      },
      { message: `#${id} lands just under the header`, timeout: 8000 },
    )
    .toBe("landed");
}

function sectionNav(page: Page) {
  return page.getByRole("banner").getByRole("navigation", {
    name: "Page sections",
  });
}

test.describe("desktop, 1440 px", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("every section link scrolls to its section and marks it current", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = sectionNav(page);
    // The page link and the section link never share a label.
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link"),
    ).toHaveText(["All events"]);
    const scrollBehavior = () =>
      page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      );
    // Load-time jumps are instant; from the first click, jumps glide.
    expect(await scrollBehavior()).toBe("auto");
    await expect
      .poll(async () => {
        await page.keyboard.press("Shift");
        return scrollBehavior();
      })
      .toBe("smooth");

    for (const [label, id] of SECTIONS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", `#${id}`);
      await link.click();
      await expectLandedOn(page, id);
      await expect(link).toHaveAttribute("aria-current", "location");
      await expect(
        nav.locator('[aria-current="location"]:visible'),
      ).toHaveCount(1);
    }
  });

  test("the current link follows the reader while scrolling", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = sectionNav(page);
    const current = nav.locator('[aria-current="location"]:visible');
    // In the hero, no section is current.
    await expect(current).toHaveCount(0);

    for (const [label, id] of SECTIONS) {
      await page.evaluate((sectionId) => {
        const el = document.getElementById(sectionId)!;
        const top = el.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top: top + 40, behavior: "instant" });
      }, id);
      await expect(current).toHaveText(label);
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(current).toHaveCount(0);
  });

  test("a deep link to /#faq lands on the FAQ", async ({ page }) => {
    await page.goto("/#faq");
    await expectLandedOn(page, "faq");
    await expect(
      sectionNav(page).getByRole("link", { name: "FAQ", exact: true }),
    ).toHaveAttribute("aria-current", "location");
  });

  test("a deep link still lands when the browser's own jump came too early", async ({
    page,
  }) => {
    // Stand-in for a load where the browser looked for #faq before the page
    // was tall enough and gave up: until the page has loaded, every scroll
    // is undone, so the browser's own jump never sticks.
    await page.addInitScript(() => {
      const undo = () => window.scrollTo({ top: 0, behavior: "instant" });
      window.addEventListener("scroll", undo);
      window.addEventListener(
        "load",
        () => {
          undo();
          window.removeEventListener("scroll", undo);
        },
        { once: true },
      );
    });
    await page.goto("/#faq");
    await expectLandedOn(page, "faq");
  });

  test("from another page, a section link goes to /#faq", async ({ page }) => {
    await page.goto("/about");
    const link = sectionNav(page).getByRole("link", {
      name: "FAQ",
      exact: true,
    });
    await expect(link).toHaveAttribute("href", "/#faq");
    await link.click();
    await expect(page).toHaveURL(/\/#faq$/);
    await expectLandedOn(page, "faq");
  });
});

test.describe("tablet, 900 px", () => {
  test.use({ viewport: { width: 900, height: 900 } });

  test("the sections sit in a Jump to menu that fits the header", async ({
    page,
  }) => {
    await page.goto("/about");
    const nav = sectionNav(page);
    const jump = nav.locator("summary", { hasText: "Jump to" });
    await expect(jump).toBeVisible();
    // One line, no sideways scroll.
    expect((await page.getByRole("banner").boundingBox())!.height).toBeLessThan(
      70,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    await jump.click();
    await nav.getByRole("link", { name: "Judging", exact: true }).click();
    await expectLandedOn(page, "fair-judging");

    // On the landing page it closes on a pick, and on Escape.
    await jump.click();
    await nav.getByRole("link", { name: "FAQ", exact: true }).click();
    await expectLandedOn(page, "faq");
    await expect(
      nav.getByRole("link", { name: "FAQ", exact: true }),
    ).toBeHidden();
    await jump.click();
    await page.keyboard.press("Escape");
    await expect(
      nav.getByRole("link", { name: "FAQ", exact: true }),
    ).toBeHidden();
    await expect(jump).toBeFocused();
  });
});

test.describe("phone, 390 px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu's On this page links close the menu, then scroll", async ({
    page,
  }) => {
    await page.goto("/");
    for (const [label, id] of SECTIONS) {
      await page.getByRole("button", { name: "Open menu" }).click();
      const dialog = page.getByRole("dialog", { name: "Menu" });
      const nav = dialog.getByRole("navigation", { name: "On this page" });
      const link = nav.getByRole("link", { name: label, exact: true });
      // Big enough to tap.
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await link.click();
      await expect(dialog).toBeHidden();
      await expectLandedOn(page, id);
    }

    // The current section is marked when the menu opens again.
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page
        .getByRole("dialog", { name: "Menu" })
        .getByRole("link", { name: "FAQ", exact: true }),
    ).toHaveAttribute("aria-current", "location");
  });

  test("a deep link to /#faq lands on the FAQ", async ({ page }) => {
    await page.goto("/#faq");
    await expectLandedOn(page, "faq");
  });

  test("the On this page group is only on the landing page", async ({
    page,
  }) => {
    await page.goto("/about");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog.getByRole("link", { name: "All events" })).toBeVisible();
    await expect(
      dialog.getByRole("navigation", { name: "On this page" }),
    ).toHaveCount(0);
  });
});

/** Every reveal block on the page is fully shown and back in place. */
async function expectAllRevealed(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
          .filter((el) => {
            const style = getComputedStyle(el);
            return style.opacity !== "1" || style.translate !== "none";
          })
          .map((el) => el.closest("section")?.id ?? "?"),
      ),
    )
    .toEqual([]);
}

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

  test("every section is visible at once, and jumps don't glide", async ({
    page,
  }) => {
    await page.goto("/");
    expect(await page.locator("[data-reveal]").count()).toBeGreaterThanOrEqual(
      12,
    );
    await expect(page.locator('[data-reveal="idle"]')).toHaveCount(0);
    await expectAllRevealed(page);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
    ).toBe("auto");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });

  // The page's content is in the first HTML (no route-wide loading skeleton
  // in front of it), so no-JS visitors and link previews see the landing.
  test("the hero and every section heading are there, fully visible", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Run your whole hackathon in one place.",
      }),
    ).toBeVisible();
    for (const [, id] of SECTIONS) {
      // Happening now: the skeleton's heading (the event cards stream in,
      // which needs JavaScript).
      await expect(page.locator(`#${id}-heading:visible`)).toHaveCount(1);
    }
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Run your next hackathon on HackHub",
      }),
    ).toBeVisible();
    await expectAllRevealed(page);
  });

  test("the about page and the events list show their content", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/events");
    await expect(
      page.getByRole("heading", { level: 1, name: "Events" }),
    ).toBeVisible();
  });
});

// The page's own content is in the first HTML, so nothing jumps when the
// streamed parts arrive (a route-wide loading skeleton used to be swapped for
// the whole page: CLS ≈ 0.39 at 1440 px, 0.10 at 390 px).
for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  test(`loading the landing page shifts no layout at ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[]) {
          if (!entry.hadRecentInput) w.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    // A few loads: the shift depended on when the stream landed.
    for (let i = 0; i < 3; i++) {
      await page.goto("/", { waitUntil: "load" });
      await page.waitForTimeout(800);
      const cls = await page.evaluate(
        () => (window as unknown as { __cls: number }).__cls,
      );
      expect(cls).toBeLessThan(0.1);
    }
  });
}

test.describe("before the app's JavaScript runs", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the section links are plain anchors that jump", async ({ page }) => {
    // The streamed HTML still arrives, but React never hydrates.
    await page.route("**/_next/static/chunks/**", (route) => route.abort());
    await page.goto("/");
    await sectionNav(page).getByRole("link", { name: "FAQ", exact: true }).click();
    await expect(page).toHaveURL(/\/#faq$/);
    await expect(page.locator("#faq-heading")).toBeInViewport();
    await expectAllRevealed(page);
  });
});

test.describe("a 320×256 viewport", () => {
  test.use({ viewport: { width: 320, height: 256 } });

  test("every section's content ends up visible after scrolling", async ({
    page,
  }) => {
    await page.goto("/");
    // Something below the fold waits to reveal.
    await expect(page.locator('[data-reveal="idle"]').first()).toBeAttached();

    // Read the page top to bottom, a screen at a time.
    for (let i = 0; i < 400; i++) {
      const atEnd = await page.evaluate(() => {
        window.scrollBy({ top: 200, behavior: "instant" });
        return (
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 1
        );
      });
      if (atEnd) break;
      await page.waitForTimeout(20);
    }

    await expect(page.locator('[data-reveal="idle"]')).toHaveCount(0);
    await expectAllRevealed(page);
  });
});
