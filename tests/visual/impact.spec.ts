import { expect, test } from "@playwright/test";

test("insights renders", async ({ page }) => {
  await page.goto("/insights");
  await expect(page).toHaveURL(/insights/);
});
