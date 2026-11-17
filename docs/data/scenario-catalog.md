# Scenario catalog — continua-synth-v1

## Core grammar (T01–T06)

| ID | Pattern | Expected |
|---|---|---|
| T01 | Specialist referral + matching consult inside the window | No gap |
| T02 | Specialist referral + no matching consult | Missed follow-up |
| T03 | Three CBCs explicitly serial, 7 days apart | No gap |
| T04 | Same test twice inside the window, distinct documents/providers | Duplicate test |
| T05 | Medication started + monitoring result inside the window | No gap |
| T06 | Medication started + no monitoring result | Medication monitoring |

## Adversarial cases (HN-01–HN-15)

| ID | Pattern | Expected | Why it matters |
|---|---|---|---|
| HN-01 | Referral + consult inside the window | No gap | Window boundary |
| HN-02 | Referral + consult in a different specialty | Gap | Specialty matching |
| HN-03 | Referral whose window has not elapsed by the as-of date | No gap | Calendar arithmetic |
| HN-04 | Telehealth consult completes the referral | No gap | Terminology variation |
| HN-05 | Three CBCs with an explicit serial plan | No gap | Series status |
| HN-06 | Two CBCs 19 days apart | No gap | Window boundary |
| HN-07 | Same modality, different body regions | No gap | Region matching |
| HN-08 | Medication stopped before the window closes | No gap | Stop event |
| HN-09 | Monitoring via a test alias | No gap | Alias resolution |
| HN-10 | Monitoring result one day before the deadline | No gap | Boundary arithmetic |
| HN-11 | Monitoring result one day after the deadline | Gap | Boundary arithmetic |
| HN-12 | Same document copied twice, one event | No gap | Document vs event |
| HN-13 | Partial date (month only) | No gap | Date precision |
| HN-14 | Unknown provider type | No gap | Missing provider |
| HN-15 | Explicitly completed referral | No gap | Status field |

HN-02 and HN-11 are adversarial positives: they look like negatives but are labelled gaps.

## Coverage

Every negative patient is tagged with exactly one scenario ID. Positive patients are tagged with their gap's source scenario.
