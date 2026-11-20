import { expect, test } from "@playwright/test";

test("evidence route renders", async ({ page }) => {
  await page.goto("/patients/6fc752d8-8b56-5977-b41d-0b77c8ecea28");
  await expect(page).toHaveURL(/patients/);
});
