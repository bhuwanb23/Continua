# Provenance policy

An event without a source document is not a canonical event.

The validation pipeline checks document existence, patient ownership, and
source-span support. Exact normalized containment receives score `1`; fuzzy
support is allowed only at or above `0.85`. Verification metadata must agree
with the measured result.

Rejected candidates remain available only as structured validation records.
They never enter the accepted timeline store or downstream detector input.
