import { expect, test } from "@playwright/test";

test("main landmark exists", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
});
