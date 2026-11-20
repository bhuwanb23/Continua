import { expect, test } from "@playwright/test";

test("today renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good morning/i })).toBeVisible();
});
