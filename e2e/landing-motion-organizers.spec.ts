import { expect, test, type Locator, type Page } from "@playwright/test";

// Landing motion in For organizers and Happening now: the cards rise in once,
// hover and focus lift a card with transforms only, the organizer vignettes
// slide in once. The rule under test: motion is an enhancement. Whatever
// happens (reduced motion, no IntersectionObserver, no JavaScript, a 320×256
// screen), every card and every vignette ends up fully visible.

const section = (page: Page, name: string) =>
  page.getByRole("region", { name, exact: true });

/** The Happening now card grid: the section's first list. */
const gridOf = (page: Page) =>
  section(page, "Happening now").getByRole("list").first();

const cardsOf = (page: Page) =>
  gridOf(page).locator(":scope > li");

const vignettesOf = (page: Page) =>
  section(page, "Your hackathon, run from one command centre").locator(
    "[data-draw-item]",
  );

const opacity = (el: Locator) =>
  el.evaluate((node) => getComputedStyle(node).opacity);

/** Where the element sits on the page, independent of the scroll position. */
const layoutBox = (el: Locator) =>
  el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    return {
      x: r.x + window.scrollX,
      y: r.y + window.scrollY,
      width: r.width,
      height: r.height,
    };
  });

/** Waits until every animation on and inside the element has finished. */
const settle = (el: Locator) =>
  el.evaluate((node) =>
    Promise.all(
      node.getAnimations({ subtree: true }).map((a) => a.finished),
    ).then(() => undefined),
  );

async function skipWithoutCards(page: Page) {
  // The events stream in after the shell; wait for the skeleton to go.
  await expect(section(page, "Happening now")).toBeVisible();
  await expect(
    section(page, "Happening now").locator("[aria-busy='true']"),
  ).toHaveCount(0);
  const count = await cardsOf(page).count();
  test.skip(count === 0, "No open events in this database.");
  return count;
}

for (const width of [390, 1440]) {
  test.describe(`at ${width} px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
    });

    test("the event cards rise in once and end fully visible", async ({
      page,
    }) => {
      await page.goto("/");
      const count = await skipWithoutCards(page);
      const grid = gridOf(page);

      // Below the fold, so it waits to be scrolled to.
      await expect(grid).toHaveAttribute("data-draw", "idle");
      await grid.scrollIntoViewIfNeeded();
      await expect(grid).toHaveAttribute("data-draw", "done");
      await settle(grid);
      for (let i = 0; i < count; i++) {
        expect(await opacity(cardsOf(page).nth(i))).toBe("1");
      }
    });

    test("with reduced motion the cards and vignettes are there at once", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await expect(vignettesOf(page)).toHaveCount(4);
      // Nothing is ever hidden: no idle state, full opacity without scrolling.
      for (const vignette of await vignettesOf(page).all()) {
        await expect(vignette).not.toHaveAttribute("data-draw", /.*/);
        expect(await opacity(vignette)).toBe("1");
      }
      const count = await skipWithoutCards(page);
      for (let i = 0; i < count; i++) {
        expect(await opacity(cardsOf(page).nth(i))).toBe("1");
      }
    });

    test("hover and keyboard focus lift a card without moving the layout", async ({
      page,
    }) => {
      await page.goto("/");
      const count = await skipWithoutCards(page);
      const grid = gridOf(page);
      await grid.scrollIntoViewIfNeeded();
      await expect(grid).toHaveAttribute("data-draw", "done");
      await settle(grid);

      const first = cardsOf(page).first();
      const link = first.getByRole("link");
      // The element after the first card: the next card, or the
      // "See all events" line when there is only one.
      const next =
        count > 1
          ? cardsOf(page).nth(1)
          : section(page, "Happening now").getByRole("link", {
              name: "See all events",
            });
      const before = {
        card: await layoutBox(first),
        next: await layoutBox(next),
      };

      const lifted = () =>
        link.evaluate((el) => getComputedStyle(el).translate);
      const zoom = () =>
        link.evaluate(
          (el) =>
            getComputedStyle(
              el.querySelector(":scope > .relative > .overflow-hidden > *")!,
            ).scale,
        );

      await link.hover();
      await expect.poll(lifted).toBe("0px -4px");
      await expect.poll(zoom).toBe("1.03");
      expect(await layoutBox(first)).toEqual(before.card);
      expect(await layoutBox(next)).toEqual(before.next);

      // Keyboard focus gets the same treatment, plus the focus ring.
      await page.mouse.move(0, 0);
      await expect.poll(lifted).not.toBe("0px -4px");
      await link.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(link).toBeFocused();
      expect(await link.evaluate((el) => el.matches(":focus-visible"))).toBe(
        true,
      );
      await expect.poll(lifted).toBe("0px -4px");
      await expect.poll(zoom).toBe("1.03");
      expect(await layoutBox(next)).toEqual(before.next);
    });
  });
}

test("every organizer vignette and card ends up visible at 320×256", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.goto("/");
  await expect(vignettesOf(page)).toHaveCount(4);
  for (const vignette of await vignettesOf(page).all()) {
    await vignette.scrollIntoViewIfNeeded();
    await expect(vignette).toHaveAttribute("data-draw", "done");
    await settle(vignette);
    expect(await opacity(vignette)).toBe("1");
    expect(
      await vignette.evaluate((el) => getComputedStyle(el).translate),
    ).toBe("none");
  }
  // The touches inside end in their resting state: the criteria bar full,
  // the table rows opaque.
  const bar = vignettesOf(page).nth(1).locator(".origin-left");
  expect(await bar.evaluate((el) => getComputedStyle(el).scale)).toBe("none");
  for (const row of await vignettesOf(page).nth(3).locator("tbody tr").all()) {
    expect(await opacity(row)).toBe("1");
  }

  const count = await skipWithoutCards(page);
  const grid = gridOf(page);
  await cardsOf(page).first().scrollIntoViewIfNeeded();
  await expect(grid).toHaveAttribute("data-draw", "done");
  for (let i = 0; i < count; i++) {
    const card = cardsOf(page).nth(i);
    await card.scrollIntoViewIfNeeded();
    await settle(card);
    expect(await opacity(card)).toBe("1");
  }
});

test.describe("without IntersectionObserver", () => {
  test("nothing is hidden", async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error: simulating a browser without the API.
      delete window.IntersectionObserver;
    });
    await page.goto("/");
    await expect(vignettesOf(page)).toHaveCount(4);
    for (const vignette of await vignettesOf(page).all()) {
      await expect(vignette).not.toHaveAttribute("data-draw", /.*/);
      expect(await opacity(vignette)).toBe("1");
    }
    const count = await skipWithoutCards(page);
    for (let i = 0; i < count; i++) {
      expect(await opacity(cardsOf(page).nth(i))).toBe("1");
    }
  });
});

test("the server HTML never hides anything: the hidden state is set by script", async ({
  request,
}) => {
  const html = await (await request.get("/")).text();
  // The four vignettes and the card grid are marked for DrawIn...
  expect(html.match(/data-draw-item="true" class="group\/vignette/g)).toHaveLength(4);
  // ...but none starts idle: only DrawIn, after checking it can reveal them
  // again, sets data-draw.
  expect(html).not.toMatch(/data-draw="/);
});
