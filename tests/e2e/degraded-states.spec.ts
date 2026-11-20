import { expect, test } from "@playwright/test";

const MARIA_ID = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";

test("patient load failure offers a usable retry", async ({ page }) => {
  let fail = true;
  await page.route(`**/api/v1/patients/${MARIA_ID}`, async (route) => {
    if (fail) return route.abort();
    return route.continue();
  });

  await page.goto(`/patients/${MARIA_ID}`);
  const alert = page.getByRole("alert").filter({ hasText: "Could not load patient." });
  await expect(alert).toBeVisible();
  fail = false;
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Maria Chen" })).toBeVisible();
});

test("evidence failure is explicit and recoverable", async ({ page }) => {
  let fail = true;
  await page.route("**/api/v1/evidence/**", async (route) => {
    if (fail) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "data_integrity_error", message: "Unavailable" } }),
      });
    }
    return route.continue();
  });

  await page.goto(`/patients/${MARIA_ID}`);
  await page.getByRole("button", { name: "View evidence" }).first().click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Evidence couldn't be loaded. Try again." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Evidence drawer" })).toHaveCount(0);

  fail = false;
  await page.getByRole("button", { name: "View evidence" }).first().click();
  await expect(page.getByRole("dialog", { name: "Evidence drawer" })).toBeVisible();
});
