import { expect, test } from "@playwright/test";

test("the P0 demo makes no external network requests", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) external.push(request.url());
  });

  await page.goto("/");
  await expect(page.getByText("80 patients in your panel.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Review patient" })).toHaveCount(5);
  expect(external).toEqual([]);
});

test("a total API outage produces a truthful panel error, not empty data", async ({ page }) => {
  await page.route("**/api/v1/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByText(/Could not load the panel/)).toBeVisible();
  await expect(page.getByText("No prioritized interventions.")).toHaveCount(0);
});
