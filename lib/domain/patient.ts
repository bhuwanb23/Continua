export interface Patient {
  patient_id: string;
  /** Human-readable alias, e.g. "P-001-maria". Never the machine identity. */
  fixture_key: string;
  name: string;
  age: number;
  sex: "F" | "M" | "X";
  primary_diagnosis: string;
  last_contact_date: string;
}
