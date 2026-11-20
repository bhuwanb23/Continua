export const PERFORMANCE_BUDGETS = {
  cache_init_ms: 500,
  panel_api_ms: 50,
  queue_api_ms: 50,
  patient_api_ms: 75,
  timeline_api_ms: 100,
  gap_api_ms: 75,
  evidence_api_ms: 100,
  evaluation_api_ms: 50,
  warm_navigation_ms: 300,
  evidence_drawer_ms: 150,
  lcp_ms: 2500,
  cls: 0.1,
  inp_ms: 200,
  demo_seconds_hard_max: 90,
  demo_system_wait_seconds: 3,
} as const;

export type PerformanceBudgetKey = keyof typeof PERFORMANCE_BUDGETS;
