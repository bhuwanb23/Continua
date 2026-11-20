import { expect, test } from "@playwright/test";

test.describe("coordinator critical path", () => {
  test("opens the panel, sees the prioritized queue, and reviews a patient", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Good morning, Sarah" })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText("80 patients in your panel.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Review patient" })).toHaveCount(5);

    await page.getByRole("link", { name: "Review patient" }).first().click();
    await expect(page.getByRole("heading", { name: "Patient journey" })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("heading", { name: "Verified issues" })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("remains readable at a narrow viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Good morning, Sarah" })).toBeVisible({ timeout: 25_000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
