import { expect, test } from "@playwright/test";

// Landing > Fair judging: each team's score table must fit inside its card on
// phones. It used to need ~331 px ("Judge 1"/"Judge 2" headers, wide gutters,
// no wrapping), so at 390 px it ran 8 px past the card border and at 360 px
// the whole page scrolled sideways.

for (const width of [360, 375, 390, 1440]) {
  test(`the fair judging score tables fit their cards at ${width} px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const section = page.locator("#fair-judging");
    await expect(
      section.getByRole("heading", {
        level: 2,
        name: "Judging that's visibly fair",
      }),
    ).toBeVisible();

    const cards = section.locator("ol > li");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      const table = card.getByRole("table");
      await expect(table).toBeVisible();
      const [tableWidth, cardWidth] = await card.evaluate((li) => [
        li.querySelector("table")!.scrollWidth,
        li.clientWidth,
      ]);
      expect(tableWidth).toBeLessThanOrEqual(cardWidth);
      // Screen readers still hear the full column name behind "J1".
      await expect(
        table.getByRole("columnheader", { name: "Judge 1" }),
      ).toBeAttached();
    }

    const [scrollWidth, clientWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}
