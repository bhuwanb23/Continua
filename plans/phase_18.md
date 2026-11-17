# Phase 18 — Product Polish & Visual Identity

> Depends on: Phase 17 (hardened demo) · Unblocks: Phase 19
> Gate: **UI/UX review passes**

## Objective

Now spend real effort on how it looks — because at this point the substance is already proven. Polish makes a credible system legible; it cannot make an incredible one credible.

## Sub-phases

### 18.1 Visual identity

- Wordmark + favicon (one afternoon, not two days).
- Palette: clinical neutral base, one accent, restrained severity ramp.
- Typography: one sans family, 4–5 sizes, tabular numerals for scores.
- Consistent iconography (one set, stroke width matched).

### 18.2 Component polish

| Element | Standard |
|---|---|
| Queue card | clear rank, scannable "why", band + score aligned |
| Timeline | legible at a glance, provider distinction, visible absence |
| Gap card | hierarchy: type → why → evidence → action |
| Evidence drawer | quoted span reads like a citation, not a paragraph |
| Priority breakdown | readable formula, not a debug dump |
| States | skeleton/empty/error feel designed, not default |

### 18.3 Motion budget

- One purposeful transition per beat (queue → patient → evidence).
- No decorative animation; nothing that delays the reveal.
- Respect `prefers-reduced-motion`.

### 18.4 Accessibility pass

- Contrast ≥ 4.5:1 for body text.
- Focus visible everywhere; tab order matches visual order.
- Headings semantic; drawer traps and restores focus.
- Icon-only buttons have labels.

### 18.5 Responsive check

- 1440 / 1280 / 1024 widths render without overlap.
- Below 1024: graceful "desktop recommended" notice, layout still usable.

### 18.6 Design review

- Review against three questions: *Would a hospital buy this? Does it look like a tool or a demo? Is anything decorative competing with the evidence?*
- Fix findings; record what was deliberately left.

## Deliverables

| Artifact | Purpose |
|---|---|
| `docs/DESIGN.md` | tokens, rationale, motion budget |
| polished components | queue, timeline, gap card, drawer, breakdown |
| favicon + wordmark | identity |
| review notes | findings + resolutions |

## Gate — exit criteria

- [ ] Design review passes on all three questions.
- [ ] Contrast and focus checks pass.
- [ ] No layout break at 1024px.
- [ ] Motion reduced-mode verified.
- [ ] No placeholder or default-styled component remains on the demo path.
- [ ] Polish did not change any data, score, or claim.

## Risks & anti-patterns

| Risk | Mitigation |
|---|---|
| Redesigning the information architecture late | Polish is visual only; layout changes need Phase 12 review |
| Adding a chart because it looks impressive | Charter: no new data surfaces in this phase |
| Spending the budget on a logo | Timebox identity to one afternoon |

## Handoff to Phase 19

Phase 19 documents what exists, including the design decisions made here.
