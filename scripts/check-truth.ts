import { generateDataset, deriveGaps } from "@/lib/generator";

const dataset = generateDataset();
const eventsById = new Map(dataset.truthEvents.map((event) => [event.event_id, event]));

const planted = new Set(
  dataset.groundTruth.map((gap) => `${gap.patient_id}:${gap.gap_type}:${gap.trigger_event_id}`),
);
const derived = deriveGaps(dataset.truthEvents);
const derivedSet = new Set(
  derived.map((gap) => {
    const event = eventsById.get(gap.trigger_event_id);
    return `${event?.patient_id ?? "unknown"}:${gap.gap_type}:${gap.trigger_event_id}`;
  }),
);

const missing = [...planted].filter((key) => !derivedSet.has(key));
const extra = [...derivedSet].filter((key) => !planted.has(key));

if (missing.length > 0) {
  console.error("Planted gaps that are not derivable from truth events:");
  for (const key of missing) console.error(`  - ${key}`);
}
if (extra.length > 0) {
  console.error("Truth events produce gaps that were not planted:");
  for (const key of extra) console.error(`  - ${key}`);
}

if (missing.length > 0 || extra.length > 0) {
  process.exit(1);
}

console.log(
  `Truth check passed: ${planted.size} planted gaps are exactly derivable from ${dataset.truthEvents.length} truth events.`,
);
