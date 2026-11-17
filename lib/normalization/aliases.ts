export const TEST_ALIASES = {
  cbc: ["CBC", "Complete Blood Count", "CBC with differential", "CBC w/ diff"],
  a1c: ["A1c", "HbA1c", "Hemoglobin A1c"],
  bmp: ["BMP", "Basic Metabolic Panel"],
  inr: ["INR", "Prothrombin Time/INR"],
  tsh: ["TSH", "Thyroid Stimulating Hormone"],
  lipid: ["Lipid Panel", "Fasting Lipid Panel"],
} as const;

export type NormalizedTest = keyof typeof TEST_ALIASES;

export const DRUG_ALIASES = {
  metformin: ["metformin", "Metformin", "metformin HCl", "Glucophage"],
  warfarin: ["warfarin", "Warfarin", "Coumadin"],
  tamoxifen: ["tamoxifen", "Tamoxifen", "Nolvadex"],
  lisinopril: ["lisinopril", "Lisinopril", "Zestril"],
  atorvastatin: ["atorvastatin", "Atorvastatin", "Lipitor"],
} as const;

export type NormalizedDrug = keyof typeof DRUG_ALIASES;

export const SPECIALTY_ALIASES = {
  oncology: ["Oncology", "Medical Oncology", "Med Onc", "Heme-Onc"],
  cardiology: ["Cardiology", "Cardiac Clinic", "Cardiovascular"],
  endocrinology: ["Endocrinology", "Endocrine Clinic"],
  primary_care: ["Primary Care", "PCP", "Family Medicine"],
  surgery: ["Surgery", "Surgical Oncology", "General Surgery"],
  imaging: ["Imaging", "Radiology"],
  laboratory: ["Laboratory", "Lab"],
  pharmacy: ["Pharmacy"],
} as const;

export type NormalizedSpecialty = keyof typeof SPECIALTY_ALIASES;

const testLookup = new Map<string, NormalizedTest>();
for (const [canonical, aliases] of Object.entries(TEST_ALIASES)) {
  for (const alias of aliases) {
    testLookup.set(alias.toLowerCase(), canonical as NormalizedTest);
  }
}

const drugLookup = new Map<string, NormalizedDrug>();
for (const [canonical, aliases] of Object.entries(DRUG_ALIASES)) {
  for (const alias of aliases) {
    drugLookup.set(alias.toLowerCase(), canonical as NormalizedDrug);
  }
}

const specialtyLookup = new Map<string, NormalizedSpecialty>();
for (const [canonical, aliases] of Object.entries(SPECIALTY_ALIASES)) {
  for (const alias of aliases) {
    specialtyLookup.set(alias.toLowerCase(), canonical as NormalizedSpecialty);
  }
}

export function normalizeTestName(raw: string): NormalizedTest | null {
  return testLookup.get(raw.trim().toLowerCase()) ?? null;
}

export function normalizeDrug(raw: string): NormalizedDrug | null {
  return drugLookup.get(raw.trim().toLowerCase()) ?? null;
}

export function normalizeSpecialty(raw: string): NormalizedSpecialty | null {
  return specialtyLookup.get(raw.trim().toLowerCase()) ?? null;
}

export function testAlias(canonical: NormalizedTest, variant: number): string {
  const aliases = TEST_ALIASES[canonical];
  return aliases[variant % aliases.length] ?? aliases[0];
}

export function drugAlias(canonical: NormalizedDrug, variant: number): string {
  const aliases = DRUG_ALIASES[canonical];
  return aliases[variant % aliases.length] ?? aliases[0];
}

export function specialtyAlias(canonical: NormalizedSpecialty, variant: number): string {
  const aliases = SPECIALTY_ALIASES[canonical];
  return aliases[variant % aliases.length] ?? aliases[0];
}
