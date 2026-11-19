# 90-second script

Target 80–85 seconds. No typing, no form filling. Lines match `SCENES` in
`lib/demo/flagship.ts`.

1. (0–10s) Scene 1 — "Care coordinators don't lack patient data. They lack time to
   find what matters across fragmented records." *(Then: Continua turns the full
   panel into the coordination issues worth reviewing first.)*
2. (10–23s) Scene 2 — "Sarah has 80 synthetic patients. Continua reconstructs their
   care journeys, verifies continuity gaps, and gives her a ranked review queue."
   *(Then: these five aren't predicted to be clinically high risk — they're the five
   highest-priority verified coordination issues under our workflow model.)*
3. (23–42s) Scene 3 — "Let's look at Maria. Her information is spread across primary
   care, surgery, imaging, labs and medication records. Continua reconstructs those
   records into one source-linked journey." *(Maria is real rank 27 in this panel; she
   is here because her story is representative, not because she is #1.)*
4. (42–61s) Scene 4 — "This referral asked for medical-oncology follow-up within 45
   days. That window passed, and Continua found no qualifying completed oncology
   consultation in the available records." *(Then: instead of burying that signal in
   another summary, Continua turns it into a coordinator action — verify referral
   status and coordinate follow-up.)*
5. (61–76s) Scene 5 — "Continua doesn't ask Sarah to trust a black box: here is the
   exact source, the source-defined 45-day window, and the search over Maria's
   available records showing zero matching completed consults. If required evidence
   can't be verified, Continua suppresses the gap rather than showing it."
6. (76–90s) Scene 6 — "Under the hood, the AI only extracts structured facts.
   Deterministic rules detect gaps, a separate evidence layer verifies every displayed
   claim, and our intervention-priority engine ranks only verified issues. We evaluate
   the full system on a frozen synthetic benchmark, including held-out patients and
   adversarial negative cases. Continua helps coordinators spend their time on
   patients, not on finding the signal hidden in the chart."

## Never say

- "Maria didn't see oncology."
- "Continua saved Maria" / "caught cancer progression".
- Any latency, ROI, or accuracy number that is not on screen and classified.
