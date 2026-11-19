# Fallback plan

1. Hosted app.
2. Local cached app (`npm run dev` against the frozen cache).
3. Recorded demo video (same six scenes).
4. Static screenshots in `artifacts/demo/screenshots`.

If hosted demo fails, say "I'll switch to our deterministic local snapshot" and
continue. Do not spend time refreshing deploys during judging.

Reset before every rehearsal: `/demo?reset=1`, then validate cache, health, and
readiness.
