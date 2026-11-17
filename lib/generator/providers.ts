import { deterministicId } from "@/lib/ids";
import type { Specialty, SyntheticProvider } from "./types";

interface ProviderSeed {
  fixture_key: string;
  display_name: string;
  specialty: Specialty;
  organization: string;
}

const SEEDS: ProviderSeed[] = [
  { fixture_key: "PROV-PCP-01", display_name: "Dr. Lena Ortiz", specialty: "primary_care", organization: "Northlake Primary Care" },
  { fixture_key: "PROV-PCP-02", display_name: "Dr. Marcus Bell", specialty: "primary_care", organization: "Greenfield Family Medicine" },
  { fixture_key: "PROV-PCP-03", display_name: "Dr. Priya Raman", specialty: "primary_care", organization: "Riverbend Primary Care" },
  { fixture_key: "PROV-PCP-04", display_name: "Dr. Daniel Cho", specialty: "primary_care", organization: "Hillcrest Medical Group" },
  { fixture_key: "PROV-PCP-05", display_name: "Dr. Sofia Alvarez", specialty: "primary_care", organization: "Southfork Family Health" },
  { fixture_key: "PROV-PCP-06", display_name: "Dr. Ethan Brooks", specialty: "primary_care", organization: "Lakeside Primary Care" },
  { fixture_key: "PROV-ONC-01", display_name: "Dr. Anita Patel", specialty: "oncology", organization: "Northlake Oncology Center" },
  { fixture_key: "PROV-ONC-02", display_name: "Dr. Julian Reed", specialty: "oncology", organization: "Cedar Ridge Cancer Center" },
  { fixture_key: "PROV-ONC-03", display_name: "Dr. Naomi Okafor", specialty: "oncology", organization: "Summit Oncology Associates" },
  { fixture_key: "PROV-ONC-04", display_name: "Dr. Victor Salas", specialty: "oncology", organization: "Prairie View Hematology-Oncology" },
  { fixture_key: "PROV-CARD-01", display_name: "Dr. Grace Lin", specialty: "cardiology", organization: "Heartland Cardiology" },
  { fixture_key: "PROV-CARD-02", display_name: "Dr. Omar Haddad", specialty: "cardiology", organization: "Brookside Cardiac Clinic" },
  { fixture_key: "PROV-CARD-03", display_name: "Dr. Rachel Kim", specialty: "cardiology", organization: "Northgate Cardiovascular" },
  { fixture_key: "PROV-ENDO-01", display_name: "Dr. Helen Park", specialty: "endocrinology", organization: "Meadowbrook Endocrinology" },
  { fixture_key: "PROV-ENDO-02", display_name: "Dr. Samuel Boateng", specialty: "endocrinology", organization: "Vista Endocrine Care" },
  { fixture_key: "PROV-SURG-01", display_name: "Dr. Teresa Vaughn", specialty: "surgery", organization: "Northlake Surgical Associates" },
  { fixture_key: "PROV-SURG-02", display_name: "Dr. Ben Whitaker", specialty: "surgery", organization: "Cedar Ridge Surgery Center" },
  { fixture_key: "PROV-SURG-03", display_name: "Dr. Alina Novak", specialty: "surgery", organization: "Summit Surgical Group" },
  { fixture_key: "PROV-LAB-01", display_name: "Metro Lab Services", specialty: "laboratory", organization: "Metro Lab Services" },
  { fixture_key: "PROV-LAB-02", display_name: "Pinnacle Labs", specialty: "laboratory", organization: "Pinnacle Labs" },
  { fixture_key: "PROV-LAB-03", display_name: "Valley Clinical Labs", specialty: "laboratory", organization: "Valley Clinical Labs" },
  { fixture_key: "PROV-IMG-01", display_name: "Cedar Ridge Imaging", specialty: "imaging", organization: "Cedar Ridge Imaging" },
  { fixture_key: "PROV-IMG-02", display_name: "Northgate Imaging Center", specialty: "imaging", organization: "Northgate Imaging Center" },
  { fixture_key: "PROV-IMG-03", display_name: "Lakeside Radiology", specialty: "imaging", organization: "Lakeside Radiology" },
  { fixture_key: "PROV-PHARM-01", display_name: "Greenfield Pharmacy", specialty: "pharmacy", organization: "Greenfield Pharmacy" },
  { fixture_key: "PROV-PHARM-02", display_name: "Metro Rx", specialty: "pharmacy", organization: "Metro Rx" },
];

export function buildProviders(): SyntheticProvider[] {
  return SEEDS.map((seed) => ({
    provider_id: deterministicId("provider", seed.fixture_key),
    fixture_key: seed.fixture_key,
    display_name: seed.display_name,
    specialty: seed.specialty,
    organization: seed.organization,
    synthetic: true,
  }));
}

export function providerBySpecialty(
  providers: SyntheticProvider[],
  specialty: Specialty,
  index: number,
): SyntheticProvider {
  const pool = providers.filter((provider) => provider.specialty === specialty);
  if (pool.length === 0) {
    throw new Error(`No provider for specialty ${specialty}`);
  }
  return pool[index % pool.length] as SyntheticProvider;
}

export function providerByKey(
  providers: SyntheticProvider[],
  fixtureKey: string,
): SyntheticProvider {
  const provider = providers.find((candidate) => candidate.fixture_key === fixtureKey);
  if (!provider) throw new Error(`Unknown provider ${fixtureKey}`);
  return provider;
}
