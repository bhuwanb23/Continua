# Demo Storyboard — Continua (90 seconds)

Every scene exists to set up the wow line. Format: time · visual · voiceover (VO) · on-screen text.

## Scene 1 — Meet Sarah (0:00–0:12)

- **Visual:** Photo/illustration of Sarah at a desk, EHR with 80 patient names. Clock shows 8:00 AM.
- **VO:** "Sarah is a care coordinator. She has 80 patients. Every morning she has to figure out who needs her today."
- **On-screen:** "80 patients · 3 hours of chart review · every day"

## Scene 2 — The miss (0:12–0:28)

- **Visual:** Zoom into one patient — Maria Chen, 54, breast cancer, post-surgical. Screen shows Sarah opening chart → referral PDF → imaging → labs → meds (rapid montage). Clock ticks to 8:12.
- **VO:** "Yesterday, Sarah spent 12 minutes reviewing Maria's chart. Surgery in March. Imaging in April. A referral to oncology. Labs. Medications. She read all of it. And she moved on."
- **On-screen:** "12 minutes · 6 documents · 4 providers"
- **Beat:** Pause. "She missed something."

## Scene 3 — The system (0:28–0:42)

- **Visual:** Switch to Continua. "Load demo data" → dashboard. Timeline for Maria animates in: surgery → radiology → labs → meds (color-coded by provider).
- **VO:** "Continua ingests those same fragmented records and rebuilds Maria's story as one timeline — across every provider."
- **On-screen:** "Unified timeline · 8 seconds"

## Scene 4 — The catch (the wow) (0:42–0:60)

- **Visual:** Gap card slides in: "MISSED ONCOLOGY FOLLOW-UP — High severity." Evidence snippet highlighted from the referral doc: "Referral to oncology placed 2026-04-18." + "No oncology consult note found." Recommended action: "Contact patient; schedule oncology visit." Then the wow line appears as text.
- **VO:** "Sarah spent 12 minutes on this chart yesterday. She missed this. The system found it in 8 seconds."
- **On-screen (large):** *"Sarah spent 12 minutes on this chart yesterday. She missed this. The system found it in 8 seconds."*
- **Beat:** Let it land. 2 sec silence.

## Scene 5 — The queue (0:60–0:78)

- **Visual:** Dashboard top-5 queue animates in: 5 patient cards, each with a one-line "why" and severity badge. Gap-type counts. Impact summary numbers tick up.
- **VO:** "And it doesn't stop at one patient. Across Sarah's 80-patient panel, Continua surfaces the five who need her today — with why, and what to do next. One missed oncology follow-up recovered. One duplicate CBC avoided. One monitoring gap caught."
- **On-screen:** "80 patients → 5 need you today" · "1 referral recovered · 1 duplicate test avoided · 1 monitoring gap caught"

## Scene 6 — Close (0:78–0:90)

- **Visual:** Eval numbers flash (precision X, recall Y, 100% grounded). Then title card: "Continua — Find the patients most likely to fall through the cracks before they do." Tagline.
- **VO:** "Every gap cites its source record. Our detectors hit X precision and Y recall, fully grounded. Continua: from 80 patients to the 5 who need you today."
- **On-screen:** "continua" logo + "Synthetic demo data — no real patient information" + contact.

## Production notes

- Pre-cache all LLM outputs for the demo panel → demo runs deterministically even with no internet.
- The wow line must be spoken AND on-screen. Do not rush it.
- Keep on-screen text minimal; let VO carry narrative.
- Test the full run 3× before recording; target 85–90 sec.
- Backup: a recorded screen-capture video of the demo in case live demo fails.

## Demo data requirements (must be true for the demo to work)

- Maria Chen (54F, breast cancer post-surgical) has: surgery note (Mar), imaging report (Apr 18), referral to oncology (Apr 18), labs (Apr 20), med list (tamoxifen start Apr 22) — and **no oncology consult note** → missed follow-up gap.
- At least one duplicate CBC within 10 days across two providers.
- At least one med (e.g., metformin or tamoxifen-related) with missing monitoring lab (A1c/BMP).
- Top-5 queue includes Maria as #1.