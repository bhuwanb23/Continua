import { expect, test } from "@playwright/test";

test("evaluation renders", async ({ page }) => {
  await page.goto("/evaluation");
  await expect(page).toHaveURL(/evaluation/);
});
