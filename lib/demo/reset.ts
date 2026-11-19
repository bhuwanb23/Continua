const STEP_KEY = "continua-demo-scene";

/** Demo state is presentation-only, so reset touches nothing upstream. */
export function resetDemoState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STEP_KEY);
  } catch {
    // sessionStorage can be unavailable; demo still works.
  }
}

export function persistScene(scene: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STEP_KEY, String(scene));
  } catch {
    // ignore
  }
}

export function readPersistedScene(): number {
  if (typeof window === "undefined") return 1;
  try {
    const parsed = Number(window.sessionStorage.getItem(STEP_KEY) ?? "1");
    return Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : 1;
  } catch {
    return 1;
  }
}
