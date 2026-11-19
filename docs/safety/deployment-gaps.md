# Deployment and Production Gaps

**Safety version:** `continua-safety-v1`
**Status:** prototype only — not approved for real patient data or clinical use.

This document prevents a demo-grade build from being mistaken for a production system. Each gap is a reason the current release cannot handle real PHI or clinical workflows.

## Data and compliance

| Gap | Consequence | Required before production |
| --- | --- | --- |
| Real PHI is prohibited | Cannot process actual patient records | Privacy program, BAAs, minimum-necessary design, retention policy |
| No HIPAA compliance program | No claim of HIPAA compliance is made | Security risk analysis, policies, workforce training, audit controls |
| No de-identification pipeline | Only synthetic data is safe here | Validated de-identification or expert determination |
| No data subject request handling | No access, correction, or deletion workflow | Privacy operations and records of processing |

## Security and operations

| Gap | Consequence | Required before production |
| --- | --- | --- |
| No authentication or tenant isolation | Any reachable client sees the same demo data | Identity, authorization, tenant scoping |
| In-memory rate limiting only | Limits do not survive restarts or multiple instances | Shared rate-limit store and edge controls |
| No production monitoring or alerting | Safety failures may go unnoticed | Metrics, traces, SLOs, on-call, anomaly alerts |
| No backup or disaster recovery | Cache loss requires rebuild | Backups, restore drills, RTO/RPO |
| No third-party security review | Unknown supply-chain and application risk (`RS-06`) | Independent penetration test and dependency review |
| No incident rehearsal | Playbooks are untested (`RS-05`) | Tabletop and live exercise |

## Clinical and human factors

| Gap | Consequence | Required before production |
| --- | --- | --- |
| No clinical validation | Accuracy and safety in real care are unknown | Prospective validation and clinician review |
| No real-environment usability study (`RS-03`) | Workflow fit is unproven | Human-factors study with coordinators |
| Static accessibility audit only (`RS-04`) | Assistive-technology behavior is unverified | Screen-reader, keyboard, and contrast testing |
| Synthetic data lacks diversity (`RS-01`, `RS-02`) | Fairness and generalization are unknown | Representative evaluation data and subgroup analysis |
| No clinical governance | No owner for clinical policy changes | Clinical safety officer and change control |

## Product surface

| Gap | Consequence | Required before production |
| --- | --- | --- |
| Public upload disabled | No ad-hoc document ingestion | Authenticated, validated intake with malware scanning |
| No public live-LLM route | Model behavior is exercised only offline | Reviewed live extraction with cost and abuse controls |
| Workflow actions are records only | No downstream EHR or scheduling effect | Approved integrations with idempotency and audit |
| Frozen demo cache | No fresh data | Cache rebuild pipeline with signed artifacts |

## Release position

This build may be demonstrated with synthetic data only. It must not be described as HIPAA compliant, "HIPAA-safe", clinically validated, or production-ready. Any move toward real data requires a new risk assessment and a new safety version.
