# What NOT to Build — Continua (Scope Guardrails)

These are the contract. Any new feature must displace a planned one (see mvp-features.md priority order). Violating these is how hackathon projects die.

## Hard exclusions (never build)

1. **Patient portal** — wrong user; adds auth/PHI surface.
2. **EHR replacement / EHR write-back** — impossible in a hackathon; out of scope.
3. **Interoperability network / health exchange** — that's Epic/CommonWell; not us.
4. **Doctor chatbot / symptom checker** — AI is not a chatbot here (refine-stage §8).
5. **Appointment scheduler** — out of scope; recommend action only.
6. **Multi-hospital / multi-tenant SaaS** — single panel, single coordinator.
7. **Real PHI / real patient data** — synthetic only; HIPAA-safe. Banner always visible.
8. **Real-time EHR integration** — manual/synthetic ingestion only.
9. **Billing / claims / coding** — not our problem.
10. **Population-health dashboards** — future user; out of MVP.
11. **Mobile app** — desktop-first; mobile out of scope.
12. **Multi-language / i18n** — English only.
13. **Fake Epic / EHR integration** — never imply or mock a live connection. MVP runs on synthetic cross-provider records; the production path (FHIR R4 / HL7 feeds) is described as roadmap only.
14. **Autonomous clinical decisions** — no diagnosis, treatment, or unsupervised orders. Actions are verify/contact/review/coordinate; the coordinator decides.

## Soft exclusions (build only if ahead of schedule)

- Second demo vertical.
- Custom data upload (Should Have, not Must).
- Eval UI (CLI eval acceptable if time short).
- About/Method page.

## Scope discipline rules

- **One primary action per screen.** No dashboard-of-dashboards.
- **3 gap types only.** Do not add a 4th gap type even if tempting (e.g., "treatment interruption"). Mention as future in pitch, don't build.
- **Oncology is the demo vertical, not a product fork.** Don't special-case oncology in code beyond seed data and weights; keep detectors general.
- **Name is working.** Don't spend build time on branding beyond a logo + title.
- **No new dependencies** without checking they're already used (Next.js/Tailwind/Supabase/OpenAI only).

## The "is this in scope?" test

A feature is in scope only if it directly helps one of:
(a) the 90-second demo path (input → timeline → gaps → top-5 queue → metric), or
(b) a Must-Have in mvp-features.md.

Otherwise: Should/Nice or out. Log the idea in a "parking lot" note; don't build.