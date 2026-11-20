import { expect, test } from "@playwright/test";

test("the flagship demo falls back honestly when its API is unavailable", async ({ page }) => {
  await page.route("**/api/v1/**", (route) => route.abort());
  await page.goto("/demo");

  const alert = page.getByRole("alert").filter({ hasText: "Flagship data unavailable" });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Do not narrate around missing data.");
  await expect(alert.getByRole("link", { name: "Open patient workspace" })).toBeVisible();
  await expect(alert.getByRole("link", { name: "Open evaluation" })).toBeVisible();
});

test("the frozen evaluation remains reachable as the proof fallback", async ({ page }) => {
  await page.goto("/evaluation");
  await expect(page.getByRole("heading", { name: "How Continua performs" })).toBeVisible();
  await expect(page.getByText("Measured means: produced by this frozen run.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What this benchmark does not prove" })).toBeVisible();
});
