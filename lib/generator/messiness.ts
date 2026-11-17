import type { SyntheticProvider } from "./types";

export function providerNameVariant(provider: SyntheticProvider, variant: number): string {
  const name = provider.display_name;
  if (!name.startsWith("Dr. ")) return name;
  const rest = name.slice(4);
  const parts = rest.split(" ");
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ");
  switch (variant % 4) {
    case 0:
      return name;
    case 1:
      return `${last}, ${first} MD`;
    case 2:
      return `Dr. ${first.charAt(0)}. ${last}`;
    default:
      return `Dr ${first.charAt(0)} ${last}`;
  }
}

export function dateText(iso: string, variant: number): string {
  const [year, month, day] = iso.split("-");
  switch (variant % 3) {
    case 0:
      return `${month}/${day}/${year}`;
    case 1:
      return iso;
    default:
      return `${Number(month)}/${Number(day)}/${year}`;
  }
}

const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/\bpatient\b/gi, "pt"],
  [/\bhistory\b/gi, "hx"],
  [/\bwith\b/gi, "w/"],
  [/\bfollow-up\b/gi, "f/u"],
  [/\bblood pressure\b/gi, "BP"],
];

/** Abbreviate surrounding prose only; never call this on a source span. */
export function abbreviate(text: string, variant: number): string {
  if (variant % 3 !== 0) return text;
  return ABBREVIATIONS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

export function copiedForwardSentence(variant: number): string {
  const lines = [
    "Medication list reviewed and reconciled with the patient.",
    "Patient reports doing well overall with no new concerns.",
    "Care plan discussed; patient agrees with the current approach.",
  ];
  return lines[variant % lines.length] as string;
}
