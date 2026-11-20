import { preloadDemoTimed } from "@/lib/performance/preload";

export interface WarmResult {
  ok: boolean;
  duration_ms: number;
  detail: string;
}

export async function warmDemo(): Promise<WarmResult> {
  const result = await preloadDemoTimed();
  return {
    ok: result.ok,
    duration_ms: result.duration_ms,
    detail: result.ok ? "demo warmed" : `preload exceeded ${result.budget_ms} ms`,
  };
}
