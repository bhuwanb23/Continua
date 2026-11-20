export const FALLBACK_PATHS = [
  {
    id: "local_cached_app",
    label: "Local cached app",
    trigger: "Hosted app or network unavailable",
    action: "Start the frozen cache build locally and present from 127.0.0.1.",
  },
  {
    id: "recorded_video",
    label: "Recorded flagship video",
    trigger: "Hosted and local apps both fail, or browser crashes",
    action: "Present the recorded walkthrough; never debug live.",
  },
  {
    id: "canonical_evaluation_screenshot",
    label: "Canonical evaluation artifact",
    trigger: "Evaluation page unavailable",
    action: "Show the frozen benchmark artifact/screenshot, labeled as frozen evidence.",
  },
] as const;

export type FallbackId = (typeof FALLBACK_PATHS)[number]["id"];

export const RECOVERY_DRILLS = [
  { id: "A", scenario: "Hosted app fails before demo", target_seconds: 15 },
  { id: "B", scenario: "Hosted app fails mid-demo", target_seconds: 15 },
  { id: "C", scenario: "Maria route fails", target_seconds: 10 },
  { id: "D", scenario: "Evaluation page fails", target_seconds: 10 },
  { id: "E", scenario: "Screen-share browser crashes", target_seconds: 10 },
] as const;

export type RecoveryDrillId = (typeof RECOVERY_DRILLS)[number]["id"];

export interface RecoveryDrillResult {
  id: RecoveryDrillId;
  scenario: string;
  fallback: FallbackId;
  target_seconds: number;
  measured_seconds: number;
  passed: boolean;
  notes: string;
}

export function measureRecoverySeconds(startedAtMs: number, recoveredAtMs: number): number {
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(recoveredAtMs)) {
    throw new Error("Recovery timestamps must be finite numbers");
  }
  if (recoveredAtMs < startedAtMs) throw new Error("Recovery cannot precede failure");
  return Math.round(((recoveredAtMs - startedAtMs) / 1000) * 100) / 100;
}

/**
 * Operational rehearsal data only. This is not an RTO or uptime claim: the
 * prototype has no production operational history.
 */
export function drillResult(options: {
  id: RecoveryDrillId;
  fallback: FallbackId;
  measuredSeconds: number;
  notes: string;
}): RecoveryDrillResult {
  const definition = RECOVERY_DRILLS.find((drill) => drill.id === options.id);
  if (!definition) throw new Error(`Unknown recovery drill ${options.id}`);
  return {
    id: options.id,
    scenario: definition.scenario,
    fallback: options.fallback,
    target_seconds: definition.target_seconds,
    measured_seconds: options.measuredSeconds,
    passed: options.measuredSeconds <= definition.target_seconds,
    notes: options.notes,
  };
}
