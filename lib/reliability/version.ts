/**
 * Frozen Phase-16 reliability contract. Changing any exported value requires a
 * new reliability version and a rerun of every gate in the reliability report.
 */
export const RELIABILITY_VERSION = "continua-reliability-v1" as const;
export const RELIABILITY_FROZEN_AT = "2026-11-19" as const;

/** Internal target from the Phase-16 plan; not a production SLA claim. */
export const CRITICAL_PATH_TARGET_RUNS = 50 as const;
export const DETERMINISM_TARGET_RUNS = 100 as const;

export const RELIABILITY_DISCLAIMER =
  "Prototype rehearsal reliability only. No production uptime, availability, or HIPAA claim." as const;
