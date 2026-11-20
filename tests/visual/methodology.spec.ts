import { expect, test } from "@playwright/test";

test("methodology renders", async ({ page }) => {
  await page.goto("/methodology");
  await expect(page).toHaveURL(/methodology/);
});
