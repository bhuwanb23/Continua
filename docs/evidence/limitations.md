# Phase 7 Limitations

- Evidence is verified against the synthetic `continua-synth-v1` record set, not a live EHR.
- "Not found in the available records" means exactly that. It does not prove care did not occur elsewhere.
- Verification proves internal traceability and rule-following. It does not establish clinical correctness, medical necessity, or treatment appropriateness.
- The extracted benchmark uses the local extractor-v1 fixture store. It is not a live-model quality claim.
- Fuzzy support is intentionally lexical and conservative. It does not understand paraphrases or clinical synonyms outside the normalized field vocabulary.
- When a source span is fuzzy, an unambiguous offset may not exist; exact offsets are guaranteed only for exact normalized matches.
- The duplicate-test window uses the frozen Phase 6 `14`-day policy. A separate legacy policy file contains a `30`-day imaging entry; Phase 6 documents this discrepancy and Phase 7 verifies the frozen `14`-day contract.
- Source document integrity depends on `content_hash` being present in the frozen record set. The synthetic corpus includes it; an external record set without hashes falls back to current text/span checks.
- If an event store changes after candidate generation, the candidate is suppressed as stale rather than re-verified. Phase 6 must be rerun first.
- There is no user-facing evidence drawer or live `/api/evidence/{gapId}` route yet. Phase 7 freezes the API response model and contract fixtures; UI/API wiring belongs to a later phase.
- No live LLM or network call is made during detection or verification. Provider availability cannot degrade the trust gate.
