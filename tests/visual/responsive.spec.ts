import { expect, test } from "@playwright/test";

test("mobile today renders", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page).toHaveURL("/");
});
