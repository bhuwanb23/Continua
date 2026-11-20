import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test.use({ video: { mode: "on", size: { width: 1280, height: 720 } } });

/**
 * Produces the recorded walkthrough fallback from the real interface. This is a
 * rehearsal backup, not a claim that the production demo is recorded.
 */
test("records the six-scene flagship walkthrough", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/demo");
  const next = page.getByRole("button", { name: "Next scene" });
  await expect(next).toBeVisible({ timeout: 25_000 });
  await page.waitForTimeout(1500);

  for (let scene = 1; scene < 6; scene += 1) {
    await next.click();
    await page.waitForTimeout(1500);
  }

  const video = page.video();
  expect(video).not.toBeNull();
  await page.close();
  const source = await video!.path();
  const outputDir = join(process.cwd(), "artifacts", "reliability");
  mkdirSync(outputDir, { recursive: true });
  const output = join(outputDir, "backup-walkthrough.webm");
  copyFileSync(source, output);
  expect(statSync(output).size).toBeGreaterThan(10_000);
});
