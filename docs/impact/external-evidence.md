# External evidence

## Retained external claims: 0

The Phase-14 proof layer does not depend on third-party statistics. Earlier drafts of
the business case cited referral-leakage and coordinator-burden figures from secondary
summaries; none survived review as necessary for the story, so none are cited.

This is a deliberate choice:

- Every number in the proof layer is either a frozen Continua measurement or an
  explicit scenario assumption.
- `npm run verify:external` fails closed if an `EXTERNAL_RESEARCH` claim is added
  without complete source metadata.
- Phase 20 should re-verify any external figure against primary sources before it is
  added to submission copy.

## If an external claim is added later

It must be registered in `lib/claims/registry.ts` with:

```json
{
  "claim_id": "external-...",
  "classification": "EXTERNAL_RESEARCH",
  "external_source": {
    "publisher": "...",
    "title": "...",
    "url": "https://...",
    "publication_date": "YYYY-MM-DD",
    "retrieved_at": "YYYY-MM-DD",
    "excerpt_ref": "quoted passage / page"
  }
}
```

Source hierarchy: government or public agency → peer-reviewed paper → professional
association → primary company documentation → strong secondary industry source.
Marketing blogs are not acceptable support for a headline claim.

## Banned external framings

- "Continua recovers $X of referral revenue."
- "Continua prevents missed cancer follow-up."
- "Continua saves hospitals N hours."

At most we may say: unresolved referrals can carry operational and revenue
implications; Continua surfaces them for human verification.
