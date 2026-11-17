const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(iso: string): number {
  return Date.parse(`${iso}T00:00:00.000Z`);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUtc(value));
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Signed day difference: b − a. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

export function isBefore(a: string, b: string): boolean {
  return toUtc(a) < toUtc(b);
}

export function isAfter(a: string, b: string): boolean {
  return toUtc(a) > toUtc(b);
}

export function minDate(values: string[]): string {
  return values.reduce((min, value) => (isBefore(value, min) ? value : min), values[0] ?? "9999-12-31");
}

export function maxDate(values: string[]): string {
  return values.reduce((max, value) => (isAfter(value, max) ? value : max), values[0] ?? "0000-01-01");
}

export function formatSlash(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}

export function formatMonthYear(iso: string): string {
  const date = new Date(toUtc(iso));
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
