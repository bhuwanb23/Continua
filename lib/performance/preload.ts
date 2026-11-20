import { measure } from "@/lib/performance/timings";
import { preloadDemo } from "@/lib/demo/preload";

export interface PreloadResult {
  duration_ms: number;
  ok: boolean;
  budget_ms: number;
}

export async function preloadDemoTimed(): Promise<PreloadResult> {
  const budget_ms = 300;
  const { timing } = await measure("demo-preload", preloadDemo, budget_ms);
  return { duration_ms: timing.duration_ms, ok: timing.ok, budget_ms };
}
