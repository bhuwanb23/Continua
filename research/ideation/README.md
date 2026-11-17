# Ideation Stage — Validation Outputs

> Stage status: Research ✅ · Define ✅ · Refine ✅ · **Ideation ✅ (this folder)** · Architecture/Build ⏳ (awaiting user decision)

This folder contains the **Ideation Validation** outputs — five stress-tests of the locked problem space, produced to decide whether the idea deserves to be built before any engineering effort.

## Files

| File | Task | Contents |
|---|---|---|
| `red-team.md` | 1 | Red-team by 5 personas (Healthcare CIO, Care Coordinator, Epic PM, Healthcare Startup Founder, Hackathon Judge): love/reject/strengthen/wrong-assumptions + synthesis. |
| `alternative-visions.md` | 2 | 20 alternative healthcare AI product visions in the same problem space, each evaluated for whether it could beat the Workbench. |
| `judge-simulation.md` | 3 | Sanjay / Shreyansh / Jad score 5 concepts on 5 criteria; final ranking. |
| `demo-memorability.md` | 4 | Why Uber/Stripe/Notion/Duolingo/Linear are memorable; how to replicate; 20 taglines + 20 one-sentence pitches + the "wow" line. |
| `naming-sprint.md` | 5 | 50 project names in 5 buckets + top recommendations. |

## Synthesis — Key Tensions

1. **The idea survives, but barely, and only with three fixes.** (red-team) The three kill shots: (a) "it's a feature, not a company," (b) "I have to upload 80 records," (c) "where's the wow?" Each is addressable but none is optional.

2. **The strongest contenders are narrower and deeper.** (alternative-visions) Referral Radar, Discharge Bridge, Oncology Navigator, ED External Record Finder, PCP Pre-Visit Synthesizer all beat the Workbench by being a *sharp tool* in one high-leakage moment rather than a *platform*. A platform is a worse hackathon pitch than a sharp tool.

3. **The judges disagree on the winner — which is itself the insight.** (judge-simulation) Shreyansh favors Oncology (AI depth), Jad favors Referral Intelligence (ROI), Sanjay splits between Continuity Workbench and Referral Intelligence. No single concept dominates all three judges. That is the case for hybridizing.

4. **The demo lacks a "moment."** (demo-memorability) The current framing describes a mechanism, not a moment. The fix: *"Sarah spent 12 minutes on this chart yesterday. She missed this. The system found it in 8 seconds."* That line is the Uber moment; everything else in the demo exists to set it up.

5. **The name should evoke the moment, not the mechanism.** (naming-sprint) "Continuity Workbench" describes how it works. Names like **Catch, Continua, Triage, CloseLoop, Lumen** evoke what it *does*. Test any name in the sentence: *"____ found what Sarah missed in 8 seconds."*

## Decision Gate (user's call)

- **Option A — Lock AI Continuity Workbench** and move to Architecture. Viable only if we add (a) the wow moment, (b) a technical-depth signal (eval/grounding), and (c) a quantified leakage metric.
- **Option B — Pivot** to a stronger healthcare concept (e.g., Referral Radar, Oncology Navigator, Discharge Bridge) before spending engineering effort. Best if optimizing for a single judge's strength.
- **Option C — Hybridize** two ideas into a stronger version. Recommended by the synthesis: Continuity Workbench's prioritized queue + Referral Intelligence's quantified leakage metric + Oncology's emotional depth + the "wow" moment + a brandable name (Catch / Continua / Triage / CloseLoop / Lumen).

**The next authorized step (once you choose A/B/C):** Architecture & build planning — scaffold the project skeleton and build the 90-second demo path first. No code has been written.