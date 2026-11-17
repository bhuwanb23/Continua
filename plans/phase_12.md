# Phase 12 — Coordinator UX

> Depends on: Phase 11 (API) · Unblocks: Phase 13
> Gate: **critical workflow completes in ≤3 interactions**

## Objective

Design around Sarah's morning, not around the architecture. She does not want a dashboard; she wants to know who to call first and why.

## Sub-phases

### 12.1 Design language

- Professional healthcare product, not hackathon neon. Neutral palette, one accent, generous whitespace, strong type hierarchy.
- Severity communicated by a restrained color ramp + weight, not by emoji or glow.
- Component primitives: `Card`, `Badge` (priority band), `EvidenceChip`, `TimelineEvent`, `SectionHeader`, `EmptyState`, `Skeleton`.
- Type scale and spacing tokens defined once in `tailwind.config` + CSS variables.

### 12.2 Home — "80 patients. 5 need you today."

- Hero line with the panel count and the count requiring action.
- Ranked top-5 cards: rank, name, age/sex, priority band + score, one-line "why", primary action link.
- Gap-type counts as three quiet stat blocks (not a chart wall).
- Modeled/measured impact strip, correctly labeled.
- "Load demo data" when empty.
- **Rule:** no more than one chart on this screen, and only if it earns its place. No dashboards-of-dashboards.

### 12.3 Patient — Journey / Gaps / Evidence

Three areas, in this order:

1. **Journey** — vertical timeline, phase-grouped (Surgery, Radiology, Oncology, Labs, Medications, Follow-up), each event with provider + date + source chip.
2. **Gaps** — cards with type, severity, why, evidence chips, recommended action, priority contribution.
3. **Evidence** — drawer/modal: quoted span, provider, date, verification score, rationale, detector version.

Plus a persistent header: name, age/sex, diagnosis, last contact, priority band, breakdown affordance.

### 12.4 Interaction budget

- Home → patient: 1 click.
- Patient → evidence: 1 click.
- Evidence → back: 1 click (or Esc).
- Priority breakdown reachable in ≤1 click (tooltip or popover).
- Target: identify the top patient, understand why, and see the source in **≤3 interactions**.

### 12.5 States

- Loading: stage-named status ("Reconstructing timeline…", "Detecting gaps…").
- Empty: panel loaded but zero gaps → a confident "no gaps detected on this panel" state, not an error.
- Error: friendly message + retry, never a stack trace.
- Partial: patient loads but evidence failed → show the gap with a degraded-evidence marker, not a blank card.

### 12.6 Accessibility and responsiveness

- Keyboard navigable; visible focus states; semantic headings; adequate contrast.
- Alt text on any icon-only control (or an `aria-label`).
- Desktop-first; usable at 1024px; explicit "desktop recommended" note for narrow viewports.

### 12.7 Copy discipline

- Every action begins with verify / contact / review / coordinate / confirm / reconcile.
- Persistent banner: "Synthetic demo data — no real patient information."
- Never "risk score", never "the system recommends treatment".

## Deliverables

| Artifact | Purpose |
|---|---|
| `components/ui/*` | primitives |
| `app/page.tsx` | home / queue |
| `app/patients/[id]/page.tsx` | patient detail |
| `components/evidence-drawer.tsx` | evidence layer |
| `components/priority-badge.tsx` | band + score + breakdown |
| `docs/UX.md` | interaction budget + states |

## Gate — exit criteria

- [ ] Top patient → why → evidence in ≤3 interactions (measured by clicking through).
- [ ] All four states (loading, empty, error, partial) implemented and reachable in dev toggles.
- [ ] Priority badge labeled "Intervention priority"; breakdown visible in ≤1 click.
- [ ] Banner present on every screen.
- [ ] No lorem ipsum, no placeholder data, no dead links.
- [ ] Contrast checked; keyboard path works without a mouse.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Building an analytics dashboard because it looks impressive | Home has one job: the queue |
| Density that requires explanation | Whitespace + hierarchy; if it needs a legend, redesign |
| AI-aesthetic (purple gradients, glassmorphism) | Design tokens restricted; review against "would a hospital buy this?" |

## Handoff to Phase 13

Phase 13 tunes this UX into a specific 90-second path with Maria as the protagonist.
