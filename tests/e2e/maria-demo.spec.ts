import { expect, test } from "@playwright/test";

const MARIA_ID = "6fc752d8-8b56-5977-b41d-0b77c8ecea28";

test("Maria workspace shows three verified issues and grounded evidence", async ({ page }) => {
  await page.goto(`/patients/${MARIA_ID}`);

  await expect(page.getByRole("heading", { name: "Maria Chen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Verified issues" })).toBeVisible();
  await expect(page.getByText(/3 verified coordination issues/)).toBeVisible();
  await expect(page.getByRole("button", { name: "View evidence" })).toHaveCount(3);

  await page.getByRole("button", { name: "View evidence" }).first().click();
  const drawer = page.getByRole("dialog", { name: "Evidence drawer" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Claims" })).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect(drawer.getByText("verified", { exact: false }).first()).toBeVisible();

  await page.getByRole("button", { name: "Close evidence" }).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("heading", { name: "Maria Chen" })).toBeVisible();
});
