import { expect, test, type Page } from "@playwright/test";

// Landing > Fair judging motion: as the worked example scrolls into view, each
// team's total counts up and its points bar fills, once. The numbers must be
// right whenever they can be read: they end on rankTeams' totals, never pass
// them, and with reduced motion, without IntersectionObserver, without
// JavaScript or on a 320×256 screen they (and the full bars) are simply there.

const TOTALS = ["82.0", "79.5", "75.0"];
const SHOTS = "/tmp/oll-motion-shots";

const cards = (page: Page) => page.locator("#fair-judging ol > li");

/** What a sighted user reads in each total, best first. */
const shownTotals = (page: Page) =>
  page.$$eval("#fair-judging [data-total]", (els) =>
    els.map(
      (el) =>
        (el.querySelector("[aria-hidden]") ?? el).textContent?.trim() ?? "",
    ),
  );

/** What a screen reader gets for each total, best first. */
const spokenTotals = (page: Page) =>
  page.$$eval("#fair-judging [data-total]", (els) =>
    els.map((el) => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelectorAll("[aria-hidden]").forEach((n) => n.remove());
      return copy.textContent?.trim() ?? "";
    }),
  );

/** Each points bar's filled share of its track, as a percentage. */
const barFill = (page: Page) =>
  page.$$eval("#fair-judging [data-points-fill]", (els) =>
    els.map((el) => {
      const fill = el.getBoundingClientRect().width;
      const track = el.parentElement!.getBoundingClientRect().width;
      return Math.round((fill / track) * 1000) / 10;
    }),
  );

/** The example is on the page (React reveals streamed content a beat after load). */
const ready = async (page: Page) => {
  await expect(cards(page)).toHaveCount(3);
  for (const card of await cards(page).all()) {
    await expect(card.locator("[data-total]")).toBeVisible();
  }
};

const noSidewaysScroll = async (page: Page) => {
  const [scrollWidth, clientWidth] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ]);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
};

const scrollThroughCards = async (page: Page) => {
  for (const card of await cards(page).all()) {
    await card.scrollIntoViewIfNeeded();
  }
};

for (const width of [390, 1440]) {
  test.describe(`at ${width} px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
    });

    test("scrolling in slowly, a total never shows its final value early and never drops", async ({
      page,
    }) => {
      await page.goto("/");
      await ready(page);
      for (const card of await cards(page).all()) {
        await expect(card).toHaveAttribute("data-draw", "idle");
      }

      // Start just above the section, then sample every frame: each card's
      // shown total and how much of its track its bar fills.
      await page.evaluate(() => {
        const section = document.querySelector("#fair-judging")!;
        scrollTo(
          0,
          scrollY + section.getBoundingClientRect().top - innerHeight,
        );
        type Sample = { at: number; text: string; fill: number };
        const log: Sample[][] = [];
        (window as unknown as { log: Sample[][] }).log = log;
        const cardEls = [
          ...document.querySelectorAll<HTMLElement>("#fair-judging ol > li"),
        ];
        const frame = (at: number) => {
          log.push(
            cardEls.map((card) => {
              const fill = card.querySelector("[data-points-fill]")!;
              return {
                at,
                text:
                  card.querySelector("[data-total] [aria-hidden]")
                    ?.textContent ?? "",
                fill:
                  fill.getBoundingClientRect().width /
                  fill.parentElement!.getBoundingClientRect().width,
              };
            }),
          );
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });

      // A slow wheel, 40 px a step, until every card has been revealed.
      for (let step = 0; step < 200; step++) {
        const done = await page.$$eval("#fair-judging ol > li", (els) =>
          els.every((el) => el.dataset.draw === "done"),
        );
        if (done) break;
        await page.mouse.wheel(0, 40);
        await page.waitForTimeout(30);
      }
      await expect.poll(() => shownTotals(page)).toEqual(TOTALS);
      await expect.poll(() => barFill(page)).toEqual(TOTALS.map(Number));

      const log = await page.evaluate(
        () =>
          (
            window as unknown as {
              log: { at: number; text: string; fill: number }[][];
            }
          ).log,
      );
      TOTALS.forEach((final, c) => {
        const samples = log.map((frame) => frame[c]);
        for (let i = 1; i < samples.length; i++) {
          // Never drops.
          expect(
            Number(samples[i].text),
            `team ${c + 1}: ${samples
              .slice(Math.max(0, i - 3), i + 1)
              .map((s) => s.text)
              .join(" → ")}`,
          ).toBeGreaterThanOrEqual(Number(samples[i - 1].text));
        }
        // Never the final value while the bar hasn't started.
        for (const s of samples.filter((s) => s.fill === 0)) {
          expect(s.text).not.toBe(final);
          expect(s.text).toBe("0.0");
        }
        // The number and its bar start together (within a few frames).
        const textStart = samples.find((s) => Number(s.text) > 0)!.at;
        const barStart = samples.find((s) => s.fill > 0)!.at;
        expect(Math.abs(textStart - barStart)).toBeLessThan(100);
        expect(samples.at(-1)!.text).toBe(final);
      });
    });

    test("the totals count up once to rankTeams' values and the bars fill", async ({
      page,
    }) => {
      await page.goto("/");
      // Below the fold, waiting to enter (DrawIn has hydrated).
      await ready(page);
      for (const card of await cards(page).all()) {
        await expect(card).toHaveAttribute("data-draw", "idle");
      }

      // Record every value the leader's total shows while it counts.
      await page.evaluate(() => {
        const digits = document.querySelector(
          "#fair-judging [data-total] [aria-hidden]",
        )!;
        const seen: string[] = [];
        (window as unknown as { seen: string[] }).seen = seen;
        new MutationObserver(() => seen.push(digits.textContent ?? "")).observe(
          digits,
          { childList: true, characterData: true, subtree: true },
        );
      });

      await scrollThroughCards(page);
      await expect.poll(() => shownTotals(page)).toEqual(TOTALS);
      expect(await spokenTotals(page)).toEqual(TOTALS);
      for (const card of await cards(page).all()) {
        await expect(card).toHaveAttribute("data-draw", "done");
      }
      await expect.poll(() => barFill(page)).toEqual(TOTALS.map(Number));

      // It moved, it only went up, it never passed the total, and it ended
      // exactly on it.
      const seen = await page.evaluate(
        () => (window as unknown as { seen: string[] }).seen,
      );
      expect(seen.length).toBeGreaterThan(1);
      const values = seen.map(Number);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
      }
      expect(Math.max(...values)).toBeLessThanOrEqual(82);
      expect(seen.at(-1)).toBe("82.0");

      await noSidewaysScroll(page);
      await page
        .locator("#fair-judging figure")
        .screenshot({ path: `${SHOTS}/motion-${width}.png` });
    });

    test("with reduced motion the totals and bars are final at once", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await ready(page);

      // No waiting: read straight after load, and again straight after
      // scrolling to them.
      expect(await shownTotals(page)).toEqual(TOTALS);
      expect(await barFill(page)).toEqual(TOTALS.map(Number));
      await scrollThroughCards(page);
      expect(await shownTotals(page)).toEqual(TOTALS);
      expect(await spokenTotals(page)).toEqual(TOTALS);
      expect(await barFill(page)).toEqual(TOTALS.map(Number));
      for (const card of await cards(page).all()) {
        await expect(card).not.toHaveAttribute("data-draw");
      }

      await noSidewaysScroll(page);
      await page
        .locator("#fair-judging figure")
        .screenshot({ path: `${SHOTS}/reduced-motion-${width}.png` });
    });
  });
}

test("without IntersectionObserver everything is final and nothing breaks", async ({
  page,
}) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.addInitScript(() => {
    delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await ready(page);
  await scrollThroughCards(page);

  expect(await shownTotals(page)).toEqual(TOTALS);
  expect(await spokenTotals(page)).toEqual(TOTALS);
  expect(await barFill(page)).toEqual(TOTALS.map(Number));
  await expect(page.locator("#fair-judging [data-draw]")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the totals and full bars are in the page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");
    // The whole landing page streams in behind (public)/loading.tsx, which
    // needs JavaScript to swap in. Show the streamed HTML as it arrived (no
    // app code runs) to check what the server rendered.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("div[hidden][id^='S:']")) {
        el.removeAttribute("hidden");
      }
    });
    await ready(page);
    await expect(page.locator("#fair-judging [data-draw]")).toHaveCount(0);
    expect(await shownTotals(page)).toEqual(TOTALS);
    expect(await barFill(page)).toEqual(TOTALS.map(Number));
  });
});

test("at 320×256 every total and bar ends complete as it scrolls in", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.goto("/");
  await ready(page);
  await scrollThroughCards(page);
  // The principle points end in place too.
  for (const point of await page
    .locator("#fair-judging ul > li[data-draw-item]")
    .all()) {
    await point.scrollIntoViewIfNeeded();
    await expect(point).toHaveCSS("opacity", "1");
  }

  await expect.poll(() => shownTotals(page)).toEqual(TOTALS);
  await expect.poll(() => barFill(page)).toEqual(TOTALS.map(Number));
  await noSidewaysScroll(page);
});
