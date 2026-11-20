# Performance Budget

Frozen engineering targets for the cached official demo. These are not marketing
claims.

| Interaction | Target |
| --- | ---: |
| Cache initialization | < 500 ms local |
| Panel API | < 50 ms |
| Queue API | < 50 ms |
| Patient API | < 75 ms |
| Timeline API | < 100 ms |
| Gap API | < 75 ms |
| Evidence API | < 100 ms |
| Evaluation API | < 50 ms |
| Warm client navigation | < 300 ms perceived |
| Evidence drawer after preload | < 150 ms perceived |
| LCP | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| Demo hard maximum | 90 s |

No optimization may change benchmark-qualified output, evidence verification, or
priority ordering.
