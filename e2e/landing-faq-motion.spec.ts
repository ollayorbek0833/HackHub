import { expect, test, type Locator, type Page } from "@playwright/test";

// Landing > FAQ and "Built for the people in the room": the motion is only an
// enhancement. Questions open and close with the mouse and the keyboard, one
// at a time; where the browser can, the height animates; with reduced motion
// an answer is there at once and in full. The participant and judge vignettes
// play once as they enter view and are fully there without motion or
// JavaScript.

const faqSection = (page: Page) =>
  page.getByRole("region", { name: "Questions, answered", exact: true });
const peopleSection = (page: Page) =>
  page.getByRole("region", {
    name: "Built for the people in the room",
    exact: true,
  });

const item = (page: Page, question: string) =>
  faqSection(page).locator("details").filter({
    has: page.getByRole("heading", { level: 3, name: question, exact: true }),
  });

/** The item's height: the summary plus however much of the answer shows. */
const height = (details: Locator) =>
  details.evaluate((el) => el.getBoundingClientRect().height);

/** Clicks the summary and reads the item's height in the same task, before
 *  any frame of a transition has run. */
const clickAndMeasure = (details: Locator) =>
  details.evaluate((el) => {
    (el.querySelector("summary") as HTMLElement).click();
    return {
      open: (el as HTMLDetailsElement).open,
      height: el.getBoundingClientRect().height,
    };
  });

/** Whether an element is drawn at full strength (no fade or scale left). */
const settled = (el: Element) => {
  const style = getComputedStyle(el);
  return (
    style.opacity === "1" &&
    (style.scale === "none" || style.scale === "1") &&
    (style.transform === "none" ||
      style.transform === "matrix(1, 0, 0, 1, 0, 0)")
  );
};

for (const width of [390, 1440]) {
  test.describe(`at ${width} px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
    });

    test("a question opens and closes with a click, one at a time", async ({
      page,
    }) => {
      await page.goto("/");
      const free = item(page, "Is HackHub free?");
      const winners = item(page, "How are winners chosen?");
      const answer = free.getByText(/no payments anywhere/);

      await expect(answer).toBeHidden();
      await free.locator("summary").click();
      await expect(free).toHaveAttribute("open", "");
      await expect(answer).toBeVisible();
      await expect(answer).toBeInViewport({ ratio: 1 });

      // Opening another closes the first (the native exclusive accordion).
      await winners.locator("summary").click();
      await expect(winners).toHaveAttribute("open", "");
      await expect(free).not.toHaveAttribute("open");
      await expect(answer).toBeHidden();
      await expect(winners.getByText(/weights must add up/)).toBeVisible();

      await winners.locator("summary").click();
      await expect(winners).not.toHaveAttribute("open");
      await expect(winners.getByText(/weights must add up/)).toBeHidden();
    });

    test("a question opens and closes with Enter and Space", async ({
      page,
    }) => {
      await page.goto("/");
      const phones = item(page, "Does it work on phones?");
      const summary = phones.locator("summary");
      const answer = phones.getByText(/designed for a phone first/);

      await summary.focus();
      await expect(summary).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(phones).toHaveAttribute("open", "");
      await expect(answer).toBeVisible();
      await page.keyboard.press("Enter");
      await expect(phones).not.toHaveAttribute("open");
      await expect(answer).toBeHidden();

      await page.keyboard.press("Space");
      await expect(phones).toHaveAttribute("open", "");
      await expect(answer).toBeVisible();
      await page.keyboard.press("Space");
      await expect(phones).not.toHaveAttribute("open");
      await expect(answer).toBeHidden();
    });

    test("the FAQ doesn't scroll sideways, open or closed", async ({
      page,
    }) => {
      await page.goto("/");
      const faq = faqSection(page);
      await faq.scrollIntoViewIfNeeded();
      // The longest answer, open.
      await item(page, "How are winners chosen?").locator("summary").click();
      await expect(faq.getByText(/share a rank/)).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const box = await faq.locator("details").first().boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    });
  });
}

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a question opens instantly and in full", async ({ page }) => {
    await page.goto("/");
    const winners = item(page, "How are winners chosen?");
    await winners.scrollIntoViewIfNeeded();
    const closed = await height(winners);

    const atClick = await clickAndMeasure(winners);
    expect(atClick.open).toBe(true);
    // Fully open in the same frame as the click: no height animation.
    expect(atClick.height).toBeGreaterThan(closed + 50);
    await page.waitForTimeout(500);
    expect(await height(winners)).toBe(atClick.height);

    // And the answer isn't faded or shifted.
    const answer = winners.locator("summary + div");
    expect(await answer.evaluate(settled)).toBe(true);
    await expect(winners.getByText(/share a rank/)).toBeVisible();

    // Closing is instant too.
    const afterClose = await clickAndMeasure(winners);
    expect(afterClose.open).toBe(false);
    expect(afterClose.height).toBe(closed);
  });

  test("Built for the people in the room is all there at once", async ({
    page,
  }) => {
    await page.goto("/");
    const people = peopleSection(page);
    await people.scrollIntoViewIfNeeded();

    // Nothing was put into a hidden starting state.
    await expect(people.locator("[data-draw]")).toHaveCount(0);
    await expect(people.getByRole("heading", { level: 3 })).toHaveText([
      "Participants",
      "Judges",
    ]);
    await expect(people.getByText("Team up with an invite code")).toBeVisible();

    const checks = people.locator("[data-slot=rail-check]");
    await expect(checks).toHaveCount(3);
    for (const check of await checks.all()) {
      expect(await check.evaluate(settled)).toBe(true);
    }
    expect(
      await people.locator("[data-slot=rail-progress]").evaluate(settled),
    ).toBe(true);
    // The chosen score is picked, in the solid style.
    const chosen = people.locator("[data-slot=chosen-score]");
    await expect(chosen).toHaveText("7");
    expect(
      await chosen.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("a question's height animates where the browser supports it", async ({
    page,
  }) => {
    await page.goto("/");
    const supported = await page.evaluate(
      () =>
        CSS.supports("selector(::details-content)") &&
        CSS.supports("interpolate-size", "allow-keywords"),
    );
    test.skip(!supported, "No ::details-content: the item opens instantly.");

    const winners = item(page, "How are winners chosen?");
    await winners.scrollIntoViewIfNeeded();
    const closed = await height(winners);

    const atClick = await clickAndMeasure(winners);
    expect(atClick.open).toBe(true);
    // The answer starts collapsed and grows...
    expect(atClick.height).toBeLessThan(closed + 5);
    // ...to its full height, with the text fully shown.
    await expect
      .poll(() => height(winners), { timeout: 2000 })
      .toBeGreaterThan(closed + 50);
    await page.waitForTimeout(600);
    const answer = winners.locator("summary + div");
    expect(await answer.evaluate(settled)).toBe(true);
    const answerBox = await answer.boundingBox();
    const itemBox = await winners.boundingBox();
    expect(answerBox!.y + answerBox!.height).toBeLessThanOrEqual(
      itemBox!.y + itemBox!.height + 1,
    );
  });

  test("the vignettes light up once as they come into view", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const people = peopleSection(page);
    const rail = people.locator("[data-slot=rail-progress]").locator("..");
    const scorecard = people
      .locator("[data-slot=chosen-score]")
      .locator("xpath=ancestor::*[@data-draw-item][1]");

    // Below the fold: waiting, unlit.
    await expect(rail).toHaveAttribute("data-draw", "idle");
    await expect(scorecard).toHaveAttribute("data-draw", "idle");

    await people.getByText("Participants", { exact: true }).scrollIntoViewIfNeeded();
    await rail.scrollIntoViewIfNeeded();
    await expect(rail).toHaveAttribute("data-draw", "done");
    await scorecard.scrollIntoViewIfNeeded();
    await expect(scorecard).toHaveAttribute("data-draw", "done");

    // Once played, everything ends fully drawn.
    await page.waitForTimeout(1000);
    for (const check of await people.locator("[data-slot=rail-check]").all()) {
      expect(await check.evaluate(settled)).toBe(true);
    }
    expect(
      await people.locator("[data-slot=chosen-score]").evaluate(settled),
    ).toBe(true);
  });
});

test("the server sends the finished state: native details, nothing waiting", async ({
  request,
}) => {
  // What a browser without JavaScript gets. The questions are plain
  // <details> in one exclusive group, and no vignette starts unlit (only
  // DrawIn, in the browser, sets data-draw).
  const html = await (await request.get("/")).text();
  expect(html.match(/<details[^>]* name="faq"/g)).toHaveLength(8);
  expect(html).not.toMatch(/data-draw="/);
  expect(html).toContain('data-slot="chosen-score"');
});

// Blocked on the (public)/loading.tsx fix in Xurliman's landing-nav PR, which
// owns the deep link. Until then it's flaky (about 2 in 10): at load the page
// is sometimes still the loading skeleton, one viewport tall, so Chromium's
// hash jump finds nothing to scroll and never retries. Same on master.
test.fixme("/#faq lands on the FAQ", async ({ page }) => {
  await page.goto("/#faq");
  await expect(
    faqSection(page).getByRole("heading", { level: 2 }),
  ).toBeInViewport();
});
