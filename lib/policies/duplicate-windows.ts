export const DUPLICATE_WINDOW_POLICY_VERSION = "duplicate-windows-v1" as const;

export const DUPLICATE_WINDOWS_DAYS = {
  lab_result: 14,
  imaging: 30,
} as const;

export function duplicateWindowFor(eventType: keyof typeof DUPLICATE_WINDOWS_DAYS): number {
  return DUPLICATE_WINDOWS_DAYS[eventType];
}
