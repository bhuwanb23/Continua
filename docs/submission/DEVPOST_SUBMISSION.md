# Devpost submission: copy and paste

Everything you need for the Code For DFW submission form, ready to paste.

---

## Final checklist (deadline Nov 30, 2026 · 6:00 PM EST = Dec 1, 4:30 AM IST)

- [ ] **Deploy:** click *Deploy with Vercel* in the README (or `vercel --prod`). Confirm `https://<your-app>.vercel.app/api/v1/readiness` returns 200.
- [ ] **Record the video** using [`VIDEO_SCRIPT.md`](VIDEO_SCRIPT.md) and upload to YouTube as **Unlisted**.
- [ ] **Fill in the placeholders** (sponsor, tier, URLs) with the command below, then commit and push.
- [ ] **Executive summary PDF:** upload `Continua_Executive_Summary.pdf` (1–3 pages, already formatted), or export your edited `.docx` to PDF.
- [ ] **AI disclosure:** add your exact tool names to [`AI_DISCLOSURE.md`](../../AI_DISCLOSURE.md).
- [ ] Paste the fields below into Devpost, attach screenshots from `docs/assets/screenshots/`, and **submit before the deadline**.

```bash
# Run from the repo root. Replace the values on the right-hand side.
LIVE="https://your-app.vercel.app"; VIDEO="https://youtu.be/XXXXXXXX"; SPONSOR="Sponsor Name"; TIER="Hard"
grep -rl --exclude-dir=node_modules -e LIVE_DEMO_URL -e VIDEO_URL -e "\[SPONSOR NAME\]" -e "\[Easy / Medium / Hard\]" README.md docs/submission artifacts/submission \
  | xargs sed -i "s|LIVE_DEMO_URL|$LIVE|g; s|VIDEO_URL|$VIDEO|g; s|\[SPONSOR NAME\]|$SPONSOR|g; s|\[Easy / Medium / Hard\]|$TIER|g"
```

---

## Project name
Continua

## Elevator pitch (≤ 200 chars)
Turns fragmented patient records into one source-linked journey, finds the care gaps between them, proves each one, and gives coordinators a ranked "review first" queue.

## About the project

### Inspiration
Care coordinators at local practices don't lack data. They drown in it. A patient with a new diagnosis is seen by primary care, a surgeon, imaging, labs and a specialist, each in a different system. Every record is complete on its own, so when a referral is never scheduled, *nothing looks wrong*. The failure only exists **between** records, and finding it means reading every chart by hand. We wanted to give that time back.

### What it does
- **Rebuilds the journey:** merges multi-source records into one de-duplicated timeline per patient, with every event linked to its source.
- **Detects continuity gaps:** missed follow-ups after referrals, missing medication-monitoring labs, and duplicate tests, using deterministic, auditable rules.
- **Proves every flag:** each gap opens an evidence drawer with the exact source quote, the source-defined time window, and a search of the records showing zero matches. If evidence can't be verified, the gap is suppressed.
- **Ranks what to do first:** a transparent intervention-priority score over verified gaps only, plus plain-language next steps and acknowledged / contacted / reviewed tracking.

### How we built it
Next.js 15 (App Router) + React 19 + strict TypeScript, Zod-validated contracts, and a six-stage pipeline: extraction → normalization and reconciliation → deterministic detectors → evidence verifier → priority engine → a hashed, self-validating demo cache served through a read-only REST API. A language model can optionally extract events from notes (OpenRouter / Ollama / Gemini), but **AI never decides whether a gap exists**. Rules do. 805 Vitest tests, Playwright, and a single `npm run validate` gate in GitHub Actions.

### Challenges we ran into
- **Proving a negative.** "No oncology visit happened" is a claim about missing data. We built explicit absence checks so the system only says it after searching the available records.
- **Keeping AI honest.** We separated extraction from decision-making so a prompt change can't silently change what counts as a gap.
- **Avoiding false alarms.** We wrote adversarial "hard negative" patients (completed elsewhere, telehealth visits, medication stopped early) to make sure Continua knows when to say no.

### Accomplishments we're proud of
- 1.00 macro F1 on a held-out synthetic benchmark (41 gaps), vs 0.44 for keyword rules.
- 29 / 29 hard-negative cases passed; 100% of displayed gaps grounded in a real source; 0 unsupported claims.
- Zero demographic-invariance violations: changing a patient's demographics never changes their rank.
- Runs free, with no database and no API keys, and deploys to Vercel in one click.

### What we learned
Trust beats cleverness. Coordinators don't need another AI summary. They need a short list they can act on, with the receipts attached. Separating *extract → detect → verify → rank* made the system auditable, testable and safer.

### What's next for Continua
CSV/PDF referral import so a practice can try it on its own exports, FHIR integration, saved coordinator actions and team hand-offs, a live-AI extraction benchmark, more gap types, and a supervised pilot with a DFW practice.

## Built with
`next.js` `react` `typescript` `zod` `node.js` `vitest` `playwright` `vercel` `github-actions` `llm` `openrouter` `ollama` `gemini`

## Links
- **GitHub:** https://github.com/bhuwanb23/Continua
- **Live demo:** LIVE_DEMO_URL
- **Video:** VIDEO_URL
- **Run instructions:** README → Quick start (`npm ci && npm run dev`)

## Gallery images (in order)
1. `docs/assets/banner.svg` (export as PNG, or use `today.png` as the cover)
2. `docs/assets/screenshots/today.png`
3. `docs/assets/screenshots/patient-journey.png`
4. `docs/assets/screenshots/evidence-drawer.png`
5. `docs/assets/screenshots/evaluation.png`
6. `docs/assets/architecture.svg`
