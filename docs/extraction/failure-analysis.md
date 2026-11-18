# Extraction failure analysis — wp7-fixture-dev

Run: 2026-11-18T14:44:41.157Z · partition dev · extractor fixture (fixture) · commit 6797a3bb0e756b061a4515d3ff56b5bfd3c96477

> Fixture-derived run: offline plumbing proof, never model performance.

## Summary

- Gold events (run scope): 69
- Predicted events: 145
- Matched: 69
- Precision / Recall / F1: 0.47586206896551725 / 1 / 0.6448598130841121
- False negatives (EX-01): 0
- Unmatched predictions: 76
- Rejected candidates: 0
- Failed documents (EX-15): 0

## False negatives — gold events missed (EX-01)

None.

## Unmatched predictions (spurious or outside gold coverage)

### cafa1ee1-5845-5f80-b10f-703a5b3e3ce8

- Patient c5936c42-175d-5a1e-b400-c1ac5c0cf229 · consult · 2026-01-26 · doc 59985dcb-db0b-59ff-86f9-106f7915e2ba (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Northlake Primary Care Patient: Gloria Adeyemi Established patient follow-up. Patient reports doing well overall; no new concerns today. pt reports doing well overall. Medication list reviewed. Follow up w/ PCP as pl…
- Root cause: unclassified — manual review required.

### 7a06fc6a-b209-5ca4-8858-f12976dbcf22

- Patient c5936c42-175d-5a1e-b400-c1ac5c0cf229 · followup · 2026-02-15 · doc a4c378a6-8f2d-57bf-89e5-168d5179625b (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …r: Dr. Lena Ortiz Organization: Northlake Primary Care Patient: Gloria Adeyemi Phone follow-up: patient reports doing well; no new symptoms. Patient reached by phone. No acute concerns reported. The patient acknowledged …
- Root cause: unclassified — manual review required.

### 6a98a38d-3419-577e-aa35-91d29945ab4e

- Patient c5936c42-175d-5a1e-b400-c1ac5c0cf229 · lab_result · 2026-03-02 · doc 49e861f8-2cd8-5f7b-a684-14164b82d576 (lab_report)
- Entity: tsh · span: `TSH: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …r: Metro Lab Services Organization: Metro Lab Services Patient: Gloria Adeyemi TSH: 2.1 mIU/L. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### 351198da-df30-5fef-8c8e-2db732f155ff

- Patient c5936c42-175d-5a1e-b400-c1ac5c0cf229 · referral · 2026-03-15 · doc d25fe9b8-5a97-5740-8de7-9e7907675db5 (referral)
- Entity: oncology · span: `Referral to Medical Oncology for adjuvant therapy evaluation. Please schedule within 45 days.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Care Patient: Gloria Adeyemi Reason for referral: adjuvant therapy evaluation Referral to Medical Oncology for adjuvant therapy evaluation. Please schedule within 45 days. Coordinator to contact the patient and confirm scheduling. Records were reques…
- Root cause: unclassified — manual review required.

### 450615d8-7139-5056-86ca-2dacc58e6d7d

- Patient c5936c42-175d-5a1e-b400-c1ac5c0cf229 · consult · 2026-03-25 · doc cca35e75-4661-5eef-8764-fb2d9743523b (consult_note)
- Entity: primary_care · span: `Primary Care consultation completed. Routine primary care follow-up; no specialty evaluation performed.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ary Care Patient: Gloria Adeyemi Consultation performed and findings reviewed. Primary Care consultation completed. Routine primary care follow-up; no specialty evaluation performed. No further specialty follow-up required at this time. The patient confirmed und…
- Root cause: unclassified — manual review required.

### e1ac56c4-3320-5e10-8908-ddc606cf004a

- Patient c5936c42-175d-5a1e-b400-c1ac5c0cf229 · lab_result · 2026-03-31 · doc 1ee3008c-198a-526a-8043-5fca5a502d14 (lab_report)
- Entity: cbc · span: `CBC with differential: WBC 5.8, Hgb 12.4, Platelets 248.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …r: Metro Lab Services Organization: Metro Lab Services Patient: Gloria Adeyemi CBC with differential: WBC 5.8, Hgb 12.4, Platelets 248. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### fcca46c5-faea-5b92-afad-348039f712bf

- Patient c5936c42-175d-5a1e-b400-c1ac5c0cf229 · lab_result · 2026-04-08 · doc f550c941-733e-5cdc-9561-d0ab425d5699 (lab_report)
- Entity: cbc · span: `CBC with differential: WBC 5.9, Hgb 12.5, Platelets 251.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …n: Northlake Primary Care Patient: Gloria Adeyemi Laboratory results reviewed. CBC with differential: WBC 5.9, Hgb 12.5, Platelets 251. Specimen collected and processed same day. The patient reports adequate social …
- Root cause: unclassified — manual review required.

### d45a62ac-0f7e-5f0d-821f-8c3c2c4bb2ad

- Patient 460da30e-adb2-512e-a35c-337d6c46f52d · consult · 2026-01-29 · doc d2aa0787-3c69-52e6-aa69-251e1d514b46 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …enfield Family Medicine Patient: Hector Adeyemi Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### 5396a14a-0700-5461-a0bf-70ef7014cbed

- Patient 460da30e-adb2-512e-a35c-337d6c46f52d · followup · 2026-02-18 · doc 6e9df396-3e3d-5e8a-a232-f966e81497fe (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ll, Marcus MD Organization: Greenfield Family Medicine Patient: Hector Adeyemi Phone follow-up: patient reports doing well; no new symptoms. Message left with patient; call returned same day. Documentation was completed …
- Root cause: unclassified — manual review required.

### 6549c8fa-7ae1-5fe1-bcdd-c6148ea7e07b

- Patient 460da30e-adb2-512e-a35c-337d6c46f52d · lab_result · 2026-03-05 · doc ab9c712c-cbcf-5159-9c64-fa04ec73f2ab (lab_report)
- Entity: tsh · span: `Thyroid Stimulating Hormone: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ganization: Pinnacle Labs Patient: Hector Adeyemi Laboratory results reviewed. Thyroid Stimulating Hormone: 2.1 mIU/L. Specimen collected and processed same day. The patient was escorted to the fron…
- Root cause: unclassified — manual review required.

### 25bfc61b-0adc-5eed-be50-055833943982

- Patient 460da30e-adb2-512e-a35c-337d6c46f52d · referral · 2026-03-22 · doc f1fec56b-71e4-5065-8bb9-02f7f400bd42 (referral)
- Entity: oncology · span: `Referral to Medical Oncology for adjuvant therapy evaluation. Please schedule within 45 days.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Patient: Hector Adeyemi Hector Adeyemi is being referred to Medical Oncology. Referral to Medical Oncology for adjuvant therapy evaluation. Please schedule within 45 days. Please route records and contact the patient. The patient arrived on time for t…
- Root cause: unclassified — manual review required.

### df8b5b4b-a48d-5392-be29-2ceb7055c8b8

- Patient 460da30e-adb2-512e-a35c-337d6c46f52d · consult · 2026-04-01 · doc 72665b7a-c899-5782-af29-4aa92451de3d (consult_note)
- Entity: primary_care · span: `Primary Care consultation completed. Routine primary care follow-up; no specialty evaluation performed.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …: Dr. M. Bell Organization: Greenfield Family Medicine Patient: Hector Adeyemi Primary Care consultation completed. Routine primary care follow-up; no specialty evaluation performed. Patient tolerated the visit well. Records sent to the referring provider. Follo…
- Root cause: unclassified — manual review required.

### a09d8c17-b4f4-5273-a953-8d37d718ac21

- Patient 460da30e-adb2-512e-a35c-337d6c46f52d · lab_result · 2026-04-05 · doc ff4aa89a-df04-507c-8620-9e0bc7e9ef69 (lab_report)
- Entity: cbc · span: `CBC w/ diff: WBC 5.8, Hgb 12.4, Platelets 248.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ganization: Pinnacle Labs Patient: Hector Adeyemi Laboratory results reviewed. CBC w/ diff: WBC 5.8, Hgb 12.4, Platelets 248. Specimen collected and processed same day. Patient education materials were pro…
- Root cause: unclassified — manual review required.

### d355b292-b9e4-5a1a-88ab-2a6d9697766a

- Patient 460da30e-adb2-512e-a35c-337d6c46f52d · lab_result · 2026-04-14 · doc 6ecb6033-be7c-5fa7-a000-033dc7e5aa2b (lab_report)
- Entity: cbc · span: `CBC w/ diff: WBC 5.9, Hgb 12.5, Platelets 251.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ent: Hector Adeyemi Test: CBC w/ diff Result: WBC 5.9, Hgb 12.5, Platelets 251 CBC w/ diff: WBC 5.9, Hgb 12.5, Platelets 251. Results released to the ordering provider. A copy of the visit summary was offe…
- Root cause: unclassified — manual review required.

### 4d2f4e8b-f076-52c3-8484-e14cac4c5e15

- Patient 236101ef-9377-5114-bb4f-8c9ce85ff1f7 · consult · 2026-02-01 · doc ea97276f-abad-581d-ad62-1fad4e1e66e6 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …: Riverbend Primary Care Patient: Imani Adeyemi Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### d919855c-fe17-545d-ac79-51cacfb7064a

- Patient 236101ef-9377-5114-bb4f-8c9ce85ff1f7 · referral · 2026-02-02 · doc 5e57edfd-6580-5497-84a2-7d90d9c55064 (referral)
- Entity: oncology · span: `Referral to Medical Oncology for adjuvant therapy evaluation. Please schedule within 45 days.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Care Patient: Imani Adeyemi Patient was seen today and a referral was placed. Referral to Medical Oncology for adjuvant therapy evaluation. Please schedule within 45 days. Records to be forwarded with the request. No urgent concerns were identified du…
- Root cause: unclassified — manual review required.

### 94f6df77-1185-5ae7-9c38-40732294cf53

- Patient 236101ef-9377-5114-bb4f-8c9ce85ff1f7 · consult · 2026-02-12 · doc c93e6528-ead3-55c1-9aa4-f688e968e538 (consult_note)
- Entity: primary_care · span: `Primary Care consultation completed. Routine primary care follow-up; no specialty evaluation performed.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …r: Dr. Priya Raman Organization: Riverbend Primary Care Patient: Imani Adeyemi Primary Care consultation completed. Routine primary care follow-up; no specialty evaluation performed. Assessment and plan discussed with the patient. Medication list reviewed and r…
- Root cause: unclassified — manual review required.

### c98f0f3c-53b5-5f25-bc29-e4f035c2416d

- Patient 236101ef-9377-5114-bb4f-8c9ce85ff1f7 · followup · 2026-02-21 · doc 0c178694-166c-5c35-82b8-676adde8957d (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …r: Dr. Priya Raman Organization: Riverbend Primary Care Patient: Imani Adeyemi Phone follow-up: patient reports doing well; no new symptoms. Patient reached by phone. No acute concerns reported. Appointment reminders wer…
- Root cause: unclassified — manual review required.

### dd9a6632-c881-5fda-943c-11d15218d5c5

- Patient 236101ef-9377-5114-bb4f-8c9ce85ff1f7 · lab_result · 2026-03-08 · doc 40bad6bc-4c9e-52a8-bfd9-d4c01a608b43 (lab_report)
- Entity: tsh · span: `TSH: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ation: Valley Clinical Labs Patient: Imani Adeyemi Test: TSH Result: 2.1 mIU/L TSH: 2.1 mIU/L. Results released to the ordering provider. The caregiver was included in the di…
- Root cause: unclassified — manual review required.

### 720c6d33-2e2f-5a57-9459-29ee43dc063c

- Patient 236101ef-9377-5114-bb4f-8c9ce85ff1f7 · lab_result · 2026-04-10 · doc d71fc44a-995b-596b-8d6e-aee074df21d4 (lab_report)
- Entity: cbc · span: `CBC: WBC 5.8, Hgb 12.4, Platelets 248.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Labs Patient: Imani Adeyemi Test: CBC Result: WBC 5.8, Hgb 12.4, Platelets 248 CBC: WBC 5.8, Hgb 12.4, Platelets 248. Results released to the ordering provider. Vital signs stable per nursing docum…
- Root cause: unclassified — manual review required.

### a57aaa35-843d-5ce1-8061-a53174197f87

- Patient 236101ef-9377-5114-bb4f-8c9ce85ff1f7 · lab_result · 2026-04-16 · doc 1f36ae1a-3db0-5cbd-9a89-a355a8e23158 (lab_report)
- Entity: cbc · span: `CBC: WBC 5.9, Hgb 12.5, Platelets 251.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …r: Dr. Priya Raman Organization: Riverbend Primary Care Patient: Imani Adeyemi CBC: WBC 5.9, Hgb 12.5, Platelets 251. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### e592b1bb-7213-547a-ab30-d1ceade8297a

- Patient d4107356-186d-5298-8b9f-13c898903649 · medication_start · 2026-01-06 · doc c9e1dfab-2d58-54b7-95ee-a03005015bfb (medication_list)
- Entity: metformin · span: `Started metformin 1000 mg twice daily for type 2 diabetes.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …: Dr. Priya Raman Organization: Riverbend Primary Care Patient: Olivia Adeyemi Started metformin 1000 mg twice daily for type 2 diabetes. Pharmacy: Riverbend Primary Care. Patient counseled on side effects and adheren…
- Root cause: unclassified — manual review required.

### 5fb053f8-cc43-5042-987f-28ab573832e6

- Patient d4107356-186d-5298-8b9f-13c898903649 · consult · 2026-01-10 · doc 9b1cd1c8-331d-5e64-8a98-e36338b0ac18 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Riverbend Primary Care Patient: Olivia Adeyemi Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### 8892d2e0-6c14-5b52-8585-88e28cbf3ac5

- Patient d4107356-186d-5298-8b9f-13c898903649 · followup · 2026-01-30 · doc 086692e2-d070-5ab5-9ab3-b6b1cefe5213 (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …: Dr. Priya Raman Organization: Riverbend Primary Care Patient: Olivia Adeyemi Phone follow-up: patient reports doing well; no new symptoms. Patient reached by phone. No acute concerns reported. No new concerns were rais…
- Root cause: unclassified — manual review required.

### 2d597810-056a-598b-9e0f-f5bfb5e100cf

- Patient d4107356-186d-5298-8b9f-13c898903649 · lab_result · 2026-02-05 · doc e85bf134-7771-5baf-9235-2796efc6bda8 (lab_report)
- Entity: lipid · span: `Lipid Panel: LDL 118, HDL 46, Triglycerides 142.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …alley Clinical Labs Organization: Valley Clinical Labs Patient: Olivia Adeyemi Lipid Panel: LDL 118, HDL 46, Triglycerides 142. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### c1f199f0-1862-5d05-9ea7-f5c67147896c

- Patient d4107356-186d-5298-8b9f-13c898903649 · lab_result · 2026-02-14 · doc 599afa76-1ba4-5686-84f8-bb5e74090bdf (lab_report)
- Entity: tsh · span: `TSH: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …tion: Valley Clinical Labs Patient: Olivia Adeyemi Test: TSH Result: 2.1 mIU/L TSH: 2.1 mIU/L. Results released to the ordering provider. Patient prefers to be contacted in t…
- Root cause: unclassified — manual review required.

### 2af240e3-201f-5d4c-a671-1dd55229bc5b

- Patient d4107356-186d-5298-8b9f-13c898903649 · lab_result · 2026-03-21 · doc 5e3f31f2-c6c4-57b7-8a19-45930d271035 (lab_report)
- Entity: cbc · span: `CBC with differential: WBC 5.8, Hgb 12.4, Platelets 248.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …a Adeyemi Test: CBC with differential Result: WBC 5.8, Hgb 12.4, Platelets 248 CBC with differential: WBC 5.8, Hgb 12.4, Platelets 248. Results released to the ordering provider. Appointment reminders were enabled. …
- Root cause: unclassified — manual review required.

### 08ef875d-6eb4-5f5c-9a1d-04f219161caa

- Patient d4107356-186d-5298-8b9f-13c898903649 · lab_result · 2026-03-29 · doc 0c19b77e-f5e8-5cd6-863a-f4f0a990f6a4 (lab_report)
- Entity: cbc · span: `CBC with differential: WBC 5.9, Hgb 12.5, Platelets 251.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …: Dr. Priya Raman Organization: Riverbend Primary Care Patient: Olivia Adeyemi CBC with differential: WBC 5.9, Hgb 12.5, Platelets 251. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### 5fd7f02d-1378-5442-a1a5-d3e739a46143

- Patient c8c188c5-0013-582d-9e63-4c2a1856fd04 · medication_start · 2026-01-10 · doc 0fa35d4d-b944-597a-8a6f-b8171510fc00 (medication_list)
- Entity: warfarin · span: `Started warfarin 5 mg daily for atrial fibrillation.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …edical Group Patient: Pavel Adeyemi Medication list reviewed with the patient. Started warfarin 5 mg daily for atrial fibrillation. No new allergies reported. The patient declined additional handouts. No barrier…
- Root cause: unclassified — manual review required.

### ab29c2c9-7e18-575c-bb93-60138b1c2e18

- Patient c8c188c5-0013-582d-9e63-4c2a1856fd04 · consult · 2026-01-13 · doc ee75ee83-8410-59ab-9cb6-7583a508e9f2 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Hillcrest Medical Group Patient: Pavel Adeyemi Established patient follow-up. Patient reports doing well overall; no new concerns today. pt reports doing well overall. Medication list reviewed. Follow up w/ PCP as pl…
- Root cause: unclassified — manual review required.

### 3ceb2384-086e-50db-a916-24c2490f062f

- Patient c8c188c5-0013-582d-9e63-4c2a1856fd04 · followup · 2026-02-02 · doc 0e60d2ed-88c6-5dc2-b041-b7bce1755986 (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …r: Cho, Daniel MD Organization: Hillcrest Medical Group Patient: Pavel Adeyemi Phone follow-up: patient reports doing well; no new symptoms. Message left with patient; call returned same day. Contact information was conf…
- Root cause: unclassified — manual review required.

### 7a69534a-fe70-5793-a267-2e73035e48d0

- Patient c8c188c5-0013-582d-9e63-4c2a1856fd04 · lab_result · 2026-02-09 · doc 29d67ba1-9cc6-5427-97cf-18cfb8d33b14 (lab_report)
- Entity: lipid · span: `Fasting Lipid Panel: LDL 118, HDL 46, Triglycerides 142.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …zation: Metro Lab Services Patient: Pavel Adeyemi Laboratory results reviewed. Fasting Lipid Panel: LDL 118, HDL 46, Triglycerides 142. Specimen collected and processed same day. A reminder letter was queued for mai…
- Root cause: unclassified — manual review required.

### 5c202f91-8549-5432-9add-d02057b359f9

- Patient c8c188c5-0013-582d-9e63-4c2a1856fd04 · lab_result · 2026-02-17 · doc 49ad3407-0086-54df-b9ba-5e3ae7d2a843 (lab_report)
- Entity: tsh · span: `Thyroid Stimulating Hormone: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …er: Metro Lab Services Organization: Metro Lab Services Patient: Pavel Adeyemi Thyroid Stimulating Hormone: 2.1 mIU/L. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### 8fac95dd-4d1a-5d5d-a22b-ff10212b2999

- Patient c8c188c5-0013-582d-9e63-4c2a1856fd04 · imaging · 2026-03-26 · doc fc9f1dee-4a3b-5663-92fe-7c8e3e2c12f8 (imaging_report)
- Entity: mri:knee · span: `MRI of the knee: no acute abnormality.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …n: Cedar Ridge Imaging Patient: Pavel Adeyemi Modality: MRI Body region: knee MRI of the knee: no acute abnormality. Comparison made to prior available imaging. Transportation and scheduling need…
- Root cause: unclassified — manual review required.

### 561d5405-0ac9-5e28-92f5-1c78e8b68a8c

- Patient c8c188c5-0013-582d-9e63-4c2a1856fd04 · imaging · 2026-03-31 · doc e39cf92f-8afd-55cf-b335-2848ad23a648 (imaging_report)
- Entity: mri:knee · span: `MRI of the knee: no acute abnormality.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ing Center Patient: Pavel Adeyemi Imaging performed and reviewed by radiology. MRI of the knee: no acute abnormality. No acute findings beyond those described. Coordination with the care team was d…
- Root cause: unclassified — manual review required.

### c70f1a47-b6fa-5488-9abe-42bdde254e3e

- Patient a2fdfce5-4f6c-5f22-8ea3-2d9a4510ad0c · medication_start · 2026-01-14 · doc 7e2e6fd9-b6b9-5feb-89b5-bea3df940e7d (medication_list)
- Entity: metformin · span: `Started metformin 1000 mg twice daily for type 2 diabetes.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Dr. Sofia Alvarez Organization: Southfork Family Health Patient: Quinn Adeyemi Started metformin 1000 mg twice daily for type 2 diabetes. Pharmacy: Southfork Family Health. Patient counseled on side effects and adhere…
- Root cause: unclassified — manual review required.

### 96f897cc-64da-5b84-a502-ccf4f497ee44

- Patient a2fdfce5-4f6c-5f22-8ea3-2d9a4510ad0c · consult · 2026-01-16 · doc f5f2caa4-1ad8-53b9-9374-dde4ea519c3d (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Southfork Family Health Patient: Quinn Adeyemi Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### acad5348-64bb-584c-ba4c-4232e2ede8a1

- Patient a2fdfce5-4f6c-5f22-8ea3-2d9a4510ad0c · followup · 2026-02-05 · doc f4d664b6-521c-54a9-ba18-c201f19562fa (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Dr. Sofia Alvarez Organization: Southfork Family Health Patient: Quinn Adeyemi Phone follow-up: patient reports doing well; no new symptoms. Patient reached by phone. No acute concerns reported. The patient asked questio…
- Root cause: unclassified — manual review required.

### 87a42e0f-a1e8-5e44-af10-5b8e16291b47

- Patient a2fdfce5-4f6c-5f22-8ea3-2d9a4510ad0c · lab_result · 2026-02-13 · doc 48ab0286-c961-59c8-85d4-19b696bb5e29 (lab_report)
- Entity: lipid · span: `Lipid Panel: LDL 118, HDL 46, Triglycerides 142.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …nt: Quinn Adeyemi Test: Lipid Panel Result: LDL 118, HDL 46, Triglycerides 142 Lipid Panel: LDL 118, HDL 46, Triglycerides 142. Results released to the ordering provider. Waiting-room instructions were revie…
- Root cause: unclassified — manual review required.

### bd138b53-76f0-5455-83f1-754afad014ac

- Patient a2fdfce5-4f6c-5f22-8ea3-2d9a4510ad0c · lab_result · 2026-02-20 · doc 7b384921-67f4-583f-9ab8-a116f3aadb42 (lab_report)
- Entity: tsh · span: `TSH: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …rganization: Pinnacle Labs Patient: Quinn Adeyemi Laboratory results reviewed. TSH: 2.1 mIU/L. Specimen collected and processed same day. The visit concluded without incident…
- Root cause: unclassified — manual review required.

### e63d09e8-9a0b-5d70-a11a-fe884f34a5c2

- Patient a2fdfce5-4f6c-5f22-8ea3-2d9a4510ad0c · lab_result · 2026-03-31 · doc 40b4007e-b24c-5eeb-9a54-beadd1ab6ed8 (lab_report)
- Entity: cbc · span: `CBC: WBC 5.8, Hgb 12.4, Platelets 248.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …rganization: Pinnacle Labs Patient: Quinn Adeyemi Laboratory results reviewed. CBC: WBC 5.8, Hgb 12.4, Platelets 248. Specimen collected and processed same day. The chart was reviewed before the vi…
- Root cause: unclassified — manual review required.

### edb99ba8-f72f-5752-8afa-365833fe3778

- Patient a2fdfce5-4f6c-5f22-8ea3-2d9a4510ad0c · lab_result · 2026-04-06 · doc 4166d857-6bec-5210-9316-ebd0f5bd8541 (lab_report)
- Entity: cbc · span: `CBC: WBC 5.9, Hgb 12.5, Platelets 251.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …alth Patient: Quinn Adeyemi Test: CBC Result: WBC 5.9, Hgb 12.5, Platelets 251 CBC: WBC 5.9, Hgb 12.5, Platelets 251. Results released to the ordering provider. Patient denies any new symptoms toda…
- Root cause: unclassified — manual review required.

### 1f819a29-252e-5ae1-b5eb-d92d9219db71

- Patient 2f6079a3-3c2c-5305-b9b9-668687df24d5 · consult · 2026-02-06 · doc abf29aa3-d9fd-5d1b-8698-906833d75f0f (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …: Hillcrest Medical Group Patient: Devon Dawson Established patient follow-up. Patient reports doing well overall; no new concerns today. pt reports doing well overall. Medication list reviewed. Follow up w/ PCP as pl…
- Root cause: unclassified — manual review required.

### c446aceb-14d5-5cad-96fe-53b892f07d81

- Patient 2f6079a3-3c2c-5305-b9b9-668687df24d5 · medication_start · 2026-02-13 · doc 2b230efe-9658-509e-89f7-89f6b14da32f (medication_list)
- Entity: metformin · span: `Started metformin 1000 mg twice daily for type 2 diabetes.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Medical Group Patient: Devon Dawson Medication list reviewed with the patient. Started metformin 1000 mg twice daily for type 2 diabetes. No new allergies reported. The patient confirmed understanding of the plan. App…
- Root cause: unclassified — manual review required.

### 209085d1-bca7-5650-9068-4cf840f89132

- Patient 2f6079a3-3c2c-5305-b9b9-668687df24d5 · followup · 2026-02-26 · doc 797e9447-a343-5066-aeb9-bae47464febf (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …er: Cho, Daniel MD Organization: Hillcrest Medical Group Patient: Devon Dawson Phone follow-up: patient reports doing well; no new symptoms. Message left with patient; call returned same day. Patient reports doing well o…
- Root cause: unclassified — manual review required.

### 0fafc715-fb18-51b7-9b8c-2caf990f09e4

- Patient 2f6079a3-3c2c-5305-b9b9-668687df24d5 · lab_result · 2026-03-13 · doc e8173d96-c2eb-5039-9f36-e9d6fb43f61e (lab_report)
- Entity: tsh · span: `Thyroid Stimulating Hormone: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …der: Metro Lab Services Organization: Metro Lab Services Patient: Devon Dawson Thyroid Stimulating Hormone: 2.1 mIU/L. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### c13e55fb-ed29-5618-9384-daa7d45204b1

- Patient 2f6079a3-3c2c-5305-b9b9-668687df24d5 · lab_result · 2026-04-14 · doc 0cb2e3ad-874e-5002-877f-db838c92c96a (lab_report)
- Entity: a1c · span: `HbA1c: 7.1%.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ization: Metro Lab Services Patient: Devon Dawson Laboratory results reviewed. HbA1c: 7.1%. Specimen collected and processed same day. No barriers to attendance were ident…
- Root cause: unclassified — manual review required.

### c61a8594-b87e-5da9-a6fe-660ed7e8b31a

- Patient bb751d08-d605-553c-a265-b361cc98e5d4 · consult · 2026-02-09 · doc 3fe98368-f780-5153-b735-e719bddb7ba5 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …: Southfork Family Health Patient: Elena Dawson Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### 22b3d349-596c-54cc-9997-399ea233ee1a

- Patient bb751d08-d605-553c-a265-b361cc98e5d4 · medication_start · 2026-02-16 · doc b8070f66-4e05-5091-9387-f59938007ed7 (medication_list)
- Entity: metformin · span: `Started metformin 1000 mg twice daily for type 2 diabetes.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Dr. Sofia Alvarez Organization: Southfork Family Health Patient: Elena Dawson Started metformin 1000 mg twice daily for type 2 diabetes. Pharmacy: Southfork Family Health. Patient counseled on side effects and adhere…
- Root cause: unclassified — manual review required.

### 09ad83f8-414d-5c95-8b6d-806b61b1b394

- Patient bb751d08-d605-553c-a265-b361cc98e5d4 · followup · 2026-03-01 · doc f6c80f28-4224-5422-8baf-956011709d5d (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Dr. Sofia Alvarez Organization: Southfork Family Health Patient: Elena Dawson Phone follow-up: patient reports doing well; no new symptoms. Patient reached by phone. No acute concerns reported. The patient was escorted …
- Root cause: unclassified — manual review required.

### f57fdd01-8f63-576f-85f0-78d561e74669

- Patient bb751d08-d605-553c-a265-b361cc98e5d4 · lab_result · 2026-03-16 · doc 141a251f-dbcc-52e5-8207-973d49486939 (lab_report)
- Entity: tsh · span: `TSH: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Organization: Pinnacle Labs Patient: Elena Dawson Laboratory results reviewed. TSH: 2.1 mIU/L. Specimen collected and processed same day. The patient arrived on time for the …
- Root cause: unclassified — manual review required.

### 28a9d980-dca3-5787-af95-0f27302fb02f

- Patient bb751d08-d605-553c-a265-b361cc98e5d4 · lab_result · 2026-04-17 · doc 9999049d-6ffe-535b-a1c7-51ac6b3bba7f (lab_report)
- Entity: a1c · span: `HbA1c: 7.1%.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …abs Organization: Pinnacle Labs Patient: Elena Dawson Test: HbA1c Result: 7.1% HbA1c: 7.1%. Results released to the ordering provider. Patient education materials were pro…
- Root cause: unclassified — manual review required.

### 7a5c4065-d0aa-5ec0-b078-d8de05711422

- Patient b59fcd3f-4320-5670-889d-aef25f07a5a6 · consult · 2026-02-12 · doc fa8fd8c8-e818-559e-9aee-c837a31a7cf7 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …on: Lakeside Primary Care Patient: Farid Dawson Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### f33d2776-08e5-5b82-ae81-a72f952d1c5a

- Patient b59fcd3f-4320-5670-889d-aef25f07a5a6 · medication_start · 2026-02-19 · doc 165b5c0a-5d75-5c03-bd79-25aded8f9361 (medication_list)
- Entity: metformin · span: `Started metformin 1000 mg twice daily for type 2 diabetes.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Primary Care Patient: Farid Dawson Medication list reviewed with the patient. Started metformin 1000 mg twice daily for type 2 diabetes. No new allergies reported. No further coordination is needed at this time. The …
- Root cause: unclassified — manual review required.

### 231697fb-0ff4-545f-adb3-5b5c8fc2a12c

- Patient b59fcd3f-4320-5670-889d-aef25f07a5a6 · followup · 2026-03-04 · doc 4ca2a2cc-b7d8-55d1-a266-b7990b741084 (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …er: Brooks, Ethan MD Organization: Lakeside Primary Care Patient: Farid Dawson Phone follow-up: patient reports doing well; no new symptoms. Message left with patient; call returned same day. The caregiver was included i…
- Root cause: unclassified — manual review required.

### 76f800c4-d672-5c1a-862e-25ed1e8ad267

- Patient b59fcd3f-4320-5670-889d-aef25f07a5a6 · lab_result · 2026-03-19 · doc 0e7999e7-dff0-5a06-9987-5af5a294a1bd (lab_report)
- Entity: tsh · span: `Thyroid Stimulating Hormone: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Labs Patient: Farid Dawson Test: Thyroid Stimulating Hormone Result: 2.1 mIU/L Thyroid Stimulating Hormone: 2.1 mIU/L. Results released to the ordering provider. No urgent concerns were identified d…
- Root cause: unclassified — manual review required.

### 777af41c-e5cb-5e18-8910-223071fa0122

- Patient b59fcd3f-4320-5670-889d-aef25f07a5a6 · lab_result · 2026-04-20 · doc 047cd2fd-150e-5395-9f24-41a71dbb4faf (lab_report)
- Entity: a1c · span: `HbA1c: 7.1%.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Valley Clinical Labs Organization: Valley Clinical Labs Patient: Farid Dawson HbA1c: 7.1%. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### d25f6da0-f2c4-558d-9483-15ebd6f0e565

- Patient 3150b13f-fb84-53bc-9116-69550d51f0e6 · consult · 2026-01-09 · doc 0a0d0211-20c6-5dd8-9775-89270dfd9e2c (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …eenfield Family Medicine Patient: Hector Dawson Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### 2dfff8dd-2dd0-5c4b-aaec-f5bf0f54e54f

- Patient 3150b13f-fb84-53bc-9116-69550d51f0e6 · medication_start · 2026-01-16 · doc 65b9cf87-2a82-5b8f-bf3d-8ca925cac2f7 (medication_list)
- Entity: metformin · span: `Started metformin 1000 mg twice daily for type 2 diabetes.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ily Medicine Patient: Hector Dawson Medication list reviewed with the patient. Started metformin 1000 mg twice daily for type 2 diabetes. No new allergies reported. Waiting-room instructions were reviewed. A copy of t…
- Root cause: unclassified — manual review required.

### af76a419-9255-5b79-8d76-842b9c6cd494

- Patient 3150b13f-fb84-53bc-9116-69550d51f0e6 · followup · 2026-01-29 · doc 1bf989d1-d761-5f60-9835-17986d6436b7 (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ell, Marcus MD Organization: Greenfield Family Medicine Patient: Hector Dawson Phone follow-up: patient reports doing well; no new symptoms. Message left with patient; call returned same day. Patient denies any new sympt…
- Root cause: unclassified — manual review required.

### c08c0e99-7e5c-5004-abce-3ae4eec4e9b1

- Patient 3150b13f-fb84-53bc-9116-69550d51f0e6 · lab_result · 2026-02-13 · doc 193a31eb-e9ea-5cd7-931e-c31a5a262f3e (lab_report)
- Entity: tsh · span: `Thyroid Stimulating Hormone: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …rganization: Pinnacle Labs Patient: Hector Dawson Laboratory results reviewed. Thyroid Stimulating Hormone: 2.1 mIU/L. Specimen collected and processed same day. Pharmacy benefit information was con…
- Root cause: unclassified — manual review required.

### 4c3e7e86-091c-5981-a09a-64c8bf96107d

- Patient 3150b13f-fb84-53bc-9116-69550d51f0e6 · lab_result · 2026-04-15 · doc b8e92ded-1b34-5bef-9d9c-fceb44eae2ca (lab_report)
- Entity: a1c · span: `A1c: 7.1%.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Labs Organization: Pinnacle Labs Patient: Hector Dawson Test: A1c Result: 7.1% A1c: 7.1%. Results released to the ordering provider. The patient confirmed the preferred …
- Root cause: unclassified — manual review required.

### 48808a0d-296a-533c-9814-ca3a8292e596

- Patient 85e80aec-2b20-515a-bb49-d2fb1d7afe97 · consult · 2026-01-12 · doc 011dcba9-bc7d-5409-830c-5e0ad1f7830c (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …n: Riverbend Primary Care Patient: Imani Dawson Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### c33346ee-d435-55fc-8fd9-1d98d4bc3814

- Patient 85e80aec-2b20-515a-bb49-d2fb1d7afe97 · medication_start · 2026-01-19 · doc 3dff57f3-3a2c-5c65-8b9b-67a2420292a8 (medication_list)
- Entity: metformin · span: `Started metformin 1000 mg twice daily for type 2 diabetes.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …er: Dr. Priya Raman Organization: Riverbend Primary Care Patient: Imani Dawson Started metformin 1000 mg twice daily for type 2 diabetes. Pharmacy: Riverbend Primary Care. Patient counseled on side effects and adheren…
- Root cause: unclassified — manual review required.

### 478163aa-a586-5a75-bb95-2a0a81c6b926

- Patient 85e80aec-2b20-515a-bb49-d2fb1d7afe97 · followup · 2026-02-01 · doc f5b885b4-a071-5689-8ca3-7706e62ca3e6 (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …er: Dr. Priya Raman Organization: Riverbend Primary Care Patient: Imani Dawson Phone follow-up: patient reports doing well; no new symptoms. Patient reached by phone. No acute concerns reported. The patient requested a p…
- Root cause: unclassified — manual review required.

### ed18c103-0073-5463-a370-8e04481a6bf4

- Patient 85e80aec-2b20-515a-bb49-d2fb1d7afe97 · lab_result · 2026-02-16 · doc 8c41d016-c332-5b2a-9440-44e739e4b2de (lab_report)
- Entity: tsh · span: `TSH: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …zation: Valley Clinical Labs Patient: Imani Dawson Test: TSH Result: 2.1 mIU/L TSH: 2.1 mIU/L. Results released to the ordering provider. Care plan reviewed and agreed upon w…
- Root cause: unclassified — manual review required.

### 4668ad41-a4bc-54eb-8434-46970b1c72f5

- Patient 85e80aec-2b20-515a-bb49-d2fb1d7afe97 · lab_result · 2026-04-18 · doc 14d084e5-e69b-58f3-8514-ced6ad27cf2b (lab_report)
- Entity: a1c · span: `A1c: 7.1%.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Valley Clinical Labs Organization: Valley Clinical Labs Patient: Imani Dawson A1c: 7.1%. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### 487a1676-2abc-544f-8d80-1f08d50f6cb5

- Patient 256fe41f-9cac-55f1-9b13-6cf08cf615df · consult · 2026-02-08 · doc bfb4ea84-e344-50de-9b36-637b4a40e453 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …ion: Lakeside Primary Care Patient: Rosa Dawson Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### f3af6ac9-4d67-540a-a90d-ee657f8e93b4

- Patient 256fe41f-9cac-55f1-9b13-6cf08cf615df · followup · 2026-02-28 · doc bbf2e465-cfa3-5c2e-922d-7b45ecbec46b (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …der: Brooks, Ethan MD Organization: Lakeside Primary Care Patient: Rosa Dawson Phone follow-up: patient reports doing well; no new symptoms. Message left with patient; call returned same day. A follow-up reminder will be…
- Root cause: unclassified — manual review required.

### f97e9826-07d5-59c4-8862-50a4a374779f

- Patient 256fe41f-9cac-55f1-9b13-6cf08cf615df · lab_result · 2026-03-15 · doc 9f93cbc1-c318-52d1-8c7d-a9fe625a6b33 (lab_report)
- Entity: tsh · span: `Thyroid Stimulating Hormone: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Labs Patient: Rosa Dawson Test: Thyroid Stimulating Hormone Result: 2.1 mIU/L Thyroid Stimulating Hormone: 2.1 mIU/L. Results released to the ordering provider. No new concerns were raised during t…
- Root cause: unclassified — manual review required.

### df3318b8-29ce-5f16-be0c-18af52055d19

- Patient 49d37604-55e8-5533-bf9b-d386c62ac006 · consult · 2026-02-11 · doc 0184d448-98bb-5080-8397-54757ab17219 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …n: Northlake Primary Care Patient: Simon Dawson Established patient follow-up. Patient reports doing well overall; no new concerns today. pt reports doing well overall. Medication list reviewed. Follow up w/ PCP as pl…
- Root cause: unclassified — manual review required.

### 06c3b5ef-dd77-59a6-85c0-5b9eb0e1b80c

- Patient 49d37604-55e8-5533-bf9b-d386c62ac006 · followup · 2026-03-03 · doc 9ac28f09-4425-5e7b-acf2-1d19f46910d3 (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …der: Dr. Lena Ortiz Organization: Northlake Primary Care Patient: Simon Dawson Phone follow-up: patient reports doing well; no new symptoms. Patient reached by phone. No acute concerns reported. The patient confirmed the…
- Root cause: unclassified — manual review required.

### 433b582e-5243-5332-9625-a7a6c9b3efe2

- Patient 49d37604-55e8-5533-bf9b-d386c62ac006 · lab_result · 2026-03-18 · doc e28c7a4b-3e71-5901-ae2b-77597c017bef (lab_report)
- Entity: tsh · span: `TSH: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …der: Metro Lab Services Organization: Metro Lab Services Patient: Simon Dawson TSH: 2.1 mIU/L. Reference ranges provided by the performing laboratory. No critical values call…
- Root cause: unclassified — manual review required.

### 4e4a6574-a17a-548c-853f-d7155702d13e

- Patient bd01741e-c6dd-5e99-aecb-bf93e10ffea5 · consult · 2026-02-14 · doc 34422524-489b-53a5-b4f3-ef0972a44515 (consult_note)
- Entity: primary_care · span: `Patient reports doing well overall; no new concerns today.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: …Greenfield Family Medicine Patient: Tara Dawson Established patient follow-up. Patient reports doing well overall; no new concerns today. Patient reports doing well overall. Medication list reviewed. Follow up with PC…
- Root cause: unclassified — manual review required.

### fb8289f7-2f98-531b-90c4-e58712130500

- Patient bd01741e-c6dd-5e99-aecb-bf93e10ffea5 · followup · 2026-03-06 · doc d7537ead-bf97-5eb6-8947-eead386d3d11 (followup)
- Entity: — · span: `Phone follow-up: patient reports doing well; no new symptoms.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Bell, Marcus MD Organization: Greenfield Family Medicine Patient: Tara Dawson Phone follow-up: patient reports doing well; no new symptoms. Message left with patient; call returned same day. Insurance eligibility was ve…
- Root cause: unclassified — manual review required.

### ca141a6e-2d49-53d5-b714-9e0c6a4c9758

- Patient bd01741e-c6dd-5e99-aecb-bf93e10ffea5 · lab_result · 2026-03-21 · doc bc486093-428b-5dd3-9f94-03bc5a3d72f5 (lab_report)
- Entity: tsh · span: `Thyroid Stimulating Hormone: 2.1 mIU/L.`
- Classification: present in generator truth but outside the curated gold subset (label coverage, not hallucination).
- Document context: … Organization: Pinnacle Labs Patient: Tara Dawson Laboratory results reviewed. Thyroid Stimulating Hormone: 2.1 mIU/L. Specimen collected and processed same day. The patient asked questions and they…
- Root cause: unclassified — manual review required.

Coverage split: 76 outside gold subset · 0 not in truth.

## Rejected candidates

None.

## Failed documents (EX-15)

None.

## Root-cause matrix (§5.56)

Assign each failure above to exactly one root cause during review:

| Root cause | Count | Notes |
| --- | --- | --- |
| Prompt | unclassified | |
| Model capability | unclassified | |
| Schema | unclassified | |
| Normalization | unclassified | |
| Provenance verifier | unclassified | |
| Reconciliation | unclassified | |
| Synthetic document ambiguity | unclassified | |
| Benchmark labeling issue | unclassified | |

"Benchmark labeling issue" is permitted only if genuinely discovered; changing frozen truth requires benchmark governance, not quiet editing.

