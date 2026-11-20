# Reliability Constitution

Version: `continua-reliability-v1` (frozen 2026-11-19)

This file is the quality contract for Phase 16. It applies to the frozen
prototype and its rehearsal environment. It is not a production SLA, uptime
guarantee, or HIPAA claim.

## Non-negotiables

1. **Never silently wrong.** A failure may recover, degrade visibly, or fail
   closed. It may not produce confident clinical-like output from bad inputs.
2. **Safety outranks availability.** Evidence verification may suppress a gap;
   it may not display an ungrounded or wrong-patient gap to keep the demo full.
3. **Incomplete means incomplete.** An analysis that did not process every
   available record must not create absence-derived gaps and must not be labeled
   `COMPLETE`.
4. **Corruption is fatal, not advisory.** A cache that fails manifest, hash,
   reference, benchmark, or leakage validation is never served partially.
5. **Determinism is part of correctness.** Identical frozen inputs must produce
   semantically identical queues, scores, gaps, and evidence decisions.
6. **The judge path has no live dependencies.** The P0 read path must work with
   the LLM, Supabase, and external network disabled.
7. **Fallbacks are rehearsed, never improvised.** A failed demo moves to the
   local cached app, the frozen evaluation artifact, or the recorded
   walkthrough. Nobody debugs live.
8. **No public fault switches.** Fault injection exists only through explicit
   test dependency injection and refuses to activate outside test/rehearsal.

## Change control

Changing a frozen reliability constant, severity definition, retry rule,
completeness rule, or fallback path requires a new reliability version and a
full rerun of the Phase 16 gates. Editing a frozen Phase 9/10 artifact is never a
reliability fix.

## Release rule

Release is blocked by any `UNSAFE_FAILURE`, any unresolved R0 or R1, any
wrong-patient output, any ungrounded gap displayed, any partial analysis shown
complete, any corrupt cache served, or any nondeterministic repeat run.

R2 and R3 may ship only when the workaround and acceptance are written in the
report. "The demo probably won't hit it" is not acceptance.
