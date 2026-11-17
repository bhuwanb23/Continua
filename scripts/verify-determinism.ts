import { DEFAULT_SEED, SeededRandomSource } from "@/lib/random/random-source";
import { clinicalEventId, documentId, patientId } from "@/lib/ids";

const failures: string[] = [];

function sequence(seed: number, length: number): number[] {
  const rng = new SeededRandomSource(seed);
  return Array.from({ length }, () => rng.next());
}

const first = sequence(DEFAULT_SEED, 8);
const second = sequence(DEFAULT_SEED, 8);
if (JSON.stringify(first) !== JSON.stringify(second)) {
  failures.push("seeded RNG produced different sequences for the same seed");
}

const different = sequence(DEFAULT_SEED + 1, 8);
if (JSON.stringify(first) === JSON.stringify(different)) {
  failures.push("different seeds produced identical sequences");
}

const patientA = patientId("P-001-maria");
const patientB = patientId("P-001-maria");
if (patientA !== patientB) failures.push("patient id is not deterministic");

const docA = documentId("R4");
const docB = documentId("R4");
if (docA !== docB) failures.push("document id is not deterministic");

const eventInput = {
  patientId: patientA,
  sourceDocId: docA,
  eventType: "referral",
  date: "2026-03-25",
};
if (clinicalEventId(eventInput) !== clinicalEventId(eventInput)) {
  failures.push("event id is not deterministic");
}

const artifact = JSON.stringify({ patientA, docA, events: [clinicalEventId(eventInput)] });
if (artifact !== JSON.stringify({ patientA, docA, events: [clinicalEventId(eventInput)] })) {
  failures.push("serialized artifact is not byte-identical");
}

if (failures.length > 0) {
  console.error("Determinism verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Determinism verified: same seed and same inputs produce identical output.");
