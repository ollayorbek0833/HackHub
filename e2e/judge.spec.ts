import "dotenv/config";

import { expect, test, type Page } from "@playwright/test";

// docs/06 TC-01, TC-02, TC-04, TC-07 on the demo seed (npm run db:seed:demo):
// "Demo Hack · judging" has three criteria (max 10) and two submitted teams.
// Logs in as judge@hackhub.test with SEED_DEMO_PASSWORD.

test.describe.configure({ mode: "serial", timeout: 60_000 });

async function openNullPointers(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("judge@hackhub.test");
  await page.getByLabel("Password").fill(process.env.SEED_DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/judge$/);
  await page.getByRole("link", { name: /Null Pointers/ }).click();
  await expect(page).toHaveURL(/\/judge\/teams\//);
}

const innovation = (page: Page) => page.getByRole("textbox", { name: /Innovation/ });

test("one input per criterion with its range; scores save and update (TC-01, TC-04)", async ({
  page,
}) => {
  await openNullPointers(page);
  await expect(page.getByText("0–10")).toHaveCount(3);

  await innovation(page).fill("10");
  await page.getByRole("button", { name: "Save scores" }).click();
  await expect(page.getByText("Scores saved.")).toBeVisible();
  await page.reload();
  await expect(innovation(page)).toHaveValue("10");
});

test("out of range and junk are refused and keep the saved score (TC-02, TC-07)", async ({
  page,
}) => {
  await openNullPointers(page);
  await expect(innovation(page)).toHaveValue("10");

  for (const junk of ["11", "1e", "-1", "7.5"]) {
    await innovation(page).fill(junk);
    await page.getByRole("button", { name: "Save scores" }).click();
    await expect(page.getByText("Enter a whole number from 0 to 10.")).toBeVisible();
    await expect(page.getByText("Scores saved.")).toHaveCount(0);
  }

  await page.reload();
  await expect(innovation(page)).toHaveValue("10");
});
