import { createHash } from "node:crypto";
import { clinicalEventId, deterministicId } from "@/lib/ids";
import { normalizeTestName, testAlias } from "@/lib/normalization/aliases";
import type { EventType, ProviderType, SeriesStatus } from "@/lib/domain";
import {
  DATASET_VERSION,
  DUPLICATE_WINDOW_DAYS,
  GOLD_PATIENT_INDICES,
  EVALUATION_AS_OF_DATE,
  GENERATOR_VERSION,
  METFORMIN_WINDOW_DAYS,
  ONCOLOGY_REFERRAL_WINDOW_DAYS,
  WARFARIN_WINDOW_DAYS,
  DEFAULT_REFERRAL_WINDOW_DAYS,
} from "./config";
import { addDays } from "./dates";
import { padText, targetWords } from "./padding";
import {
  renderConsult,
  renderImaging,
  renderLab,
  renderMedication,
  renderNote,
  renderPhone,
  renderReferral,
} from "./render";
import type {
  DatasetRecord,
  GapTruth,
  GapType,
  ScenarioId,
  Specialty,
  SyntheticPatient,
  SyntheticProvider,
  TruthEvent,
} from "./types";
import type { PatientPlan, PlannedGap } from "./plan";
import { providerBySpecialty } from "./providers";

export interface BuildOutput {
  records: DatasetRecord[];
  events: TruthEvent[];
  gaps: GapTruth[];
}

interface EventSpec {
  eventType: EventType;
  description: string;
  specialty: string | null;
  windowDays: number | null;
  typed: Record<string, unknown>;
  span: string;
  seriesStatus: SeriesStatus;
  confidence: number;
  datePrecision: "day" | "month";
}

interface DocSpec {
  docType: DatasetRecord["doc_type"];
  provider: SyntheticProvider;
  providerType: ProviderType;
  date: string;
  text: string;
  templateId: string;
  datePrecision: "day" | "month";
  seriesStatus?: SeriesStatus;
  events: EventSpec[];
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function providerTypeFor(specialty: Specialty): ProviderType {
  switch (specialty) {
    case "primary_care":
      return "pcp";
    case "laboratory":
      return "lab";
    case "imaging":
      return "imaging";
    case "pharmacy":
      return "pharmacy";
    default:
      return "specialist";
  }
}

export function specialtyLabel(specialty: Specialty): string {
  switch (specialty) {
    case "oncology":
      return "Medical Oncology";
    case "cardiology":
      return "Cardiology";
    case "endocrinology":
      return "Endocrinology";
    case "surgery":
      return "Surgical Oncology";
    case "primary_care":
      return "Primary Care";
    case "laboratory":
      return "Laboratory";
    case "imaging":
      return "Radiology";
    case "pharmacy":
      return "Pharmacy";
  }
}

export class PatientBuilder {
  readonly records: DatasetRecord[] = [];
  readonly events: TruthEvent[] = [];
  readonly gaps: GapTruth[] = [];

  private readonly patient: SyntheticPatient;
  private readonly index: number;
  private readonly plan: PatientPlan;
  private readonly providers: SyntheticProvider[];
  private docSeq = 0;

  constructor(
    patient: SyntheticPatient,
    index: number,
    plan: PatientPlan,
    providers: SyntheticProvider[],
  ) {
    this.patient = patient;
    this.index = index;
    this.plan = plan;
    this.providers = providers;
  }

  build(): BuildOutput {
    if (this.index === 0) {
      this.buildMaria();
      return this.output();
    }

    this.addBaseline();
    this.addNoise();

    for (const planned of this.plan.gapScenarios) {
      this.buildGap(planned);
    }

    if (this.plan.negativeScenario) {
      this.buildNegative(this.plan.negativeScenario);
    }

    if ((GOLD_PATIENT_INDICES as readonly number[]).includes(this.index)) {
      this.addGoldNoise();
    }

    return this.output();
  }

  private output(): BuildOutput {
    return { records: this.records, events: this.events, gaps: this.gaps };
  }

  private get patientId(): string {
    return this.patient.patient_id;
  }

  private pcp(): SyntheticProvider {
    return providerBySpecialty(this.providers, "primary_care", this.index);
  }

  private providerFor(specialty: Specialty): SyntheticProvider {
    return providerBySpecialty(this.providers, specialty, this.index);
  }

  private confidence(): number {
    return 0.93 + (this.index % 5) * 0.01;
  }

  private emitDoc(spec: DocSpec): { record: DatasetRecord; events: TruthEvent[] } {
    const seq = this.docSeq;
    this.docSeq += 1;
    const docKey = `DOC-P${String(this.index + 1).padStart(3, "0")}-${String(seq).padStart(2, "0")}`;
    const docId = deterministicId("document", docKey);
    const text = padText(spec.text, targetWords(this.index, seq), this.index * 31 + seq * 7);
    const contentHash = sha256(text);

    const record: DatasetRecord = {
      source_doc_id: docId,
      fixture_key: docKey,
      patient_id: this.patientId,
      doc_type: spec.docType,
      provider: spec.provider.display_name,
      provider_type: spec.providerType,
      date: spec.date,
      text,
      dataset_version: DATASET_VERSION,
      generator_version: GENERATOR_VERSION,
      synthetic: true,
      template_id: spec.templateId,
      content_hash: contentHash,
      date_precision: spec.datePrecision,
    };
    if (spec.seriesStatus) record.series_status = spec.seriesStatus;

    const built: TruthEvent[] = spec.events.map((event) => ({
      event_id: clinicalEventId({
        patientId: this.patientId,
        sourceDocId: docId,
        eventType: event.eventType,
        date: spec.date,
      }),
      patient_id: this.patientId,
      date: spec.date,
      event_type: event.eventType,
      description: event.description,
      provider_id: spec.provider.provider_id,
      provider: spec.provider.display_name,
      provider_type: spec.providerType,
      specialty: event.specialty,
      window_days: event.windowDays,
      typed: event.typed,
      source_doc_id: docId,
      source_span: event.span,
      confidence: event.confidence,
      series_status: event.seriesStatus,
      scenario_id: "T01",
      date_precision: event.datePrecision,
    }));

    this.records.push(record);
    this.events.push(...built);
    return { record, events: built };
  }

  private duplicateDoc(record: DatasetRecord): void {
    const seq = this.docSeq;
    this.docSeq += 1;
    const docKey = `DOC-P${String(this.index + 1).padStart(3, "0")}-${String(seq).padStart(2, "0")}`;
    this.records.push({
      ...record,
      source_doc_id: deterministicId("document", docKey),
      fixture_key: docKey,
      duplicate_of: record.source_doc_id,
      template_id: `${record.template_id}-copy`,
    });
  }

  private addGap(
    gapType: GapType,
    trigger: TruthEvent,
    sourceDocIds: string[],
    windowDays: number,
    scenarioId: ScenarioId,
  ): void {
    trigger.scenario_id = scenarioId;
    this.gaps.push({
      gap_truth_id: deterministicId("gap", `${this.patient.fixture_key}-${gapType}-${trigger.event_id}`),
      patient_id: this.patientId,
      gap_type: gapType,
      trigger_event_id: trigger.event_id,
      source_doc_ids: sourceDocIds,
      expected_window_days: windowDays,
      evaluation_as_of_date: EVALUATION_AS_OF_DATE,
      scenario_id: scenarioId,
    });
  }

  // ------------------------------------------------------------------ baseline

  private addBaseline(): void {
    const date = addDays("2026-01-08", (this.index * 3) % 40);
    const provider = this.pcp();
    const note = renderNote({
      patient: this.patient,
      provider,
      date,
      variant: this.index % 3,
      topic: "Established patient follow-up.",
      body: "Patient reports doing well overall; no new concerns today.",
    });
    this.emitDoc({
      docType: "consult_note",
      provider,
      providerType: "pcp",
      date,
      text: note.text,
      templateId: note.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "consult",
          description: "Primary care follow-up",
          specialty: "primary_care",
          windowDays: null,
          typed: { specialty: "primary_care", completed: true },
          span: note.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  private addNoise(): void {
    const base = addDays("2026-01-08", (this.index * 3) % 40);
    const phoneDate = addDays(base, 20);
    const phone = renderPhone({
      patient: this.patient,
      provider: this.pcp(),
      date: phoneDate,
      variant: this.index % 2,
      summary: "patient reports doing well; no new symptoms.",
    });
    this.emitDoc({
      docType: "followup",
      provider: this.pcp(),
      providerType: "pcp",
      date: phoneDate,
      text: phone.text,
      templateId: phone.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "followup",
          description: "Routine phone follow-up",
          specialty: "primary_care",
          windowDays: null,
          typed: { topic: "routine", status: "completed" },
          span: phone.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    const labDate = addDays(base, 35);
    const labProvider = this.providerFor("laboratory");
    const tshAlias = testAlias("tsh", this.index);
    const lab = renderLab({
      patient: this.patient,
      provider: labProvider,
      date: labDate,
      variant: this.index % 3,
      alias: tshAlias,
      values: "2.1 mIU/L",
    });
    this.emitDoc({
      docType: "lab_report",
      provider: labProvider,
      providerType: "lab",
      date: labDate,
      text: lab.text,
      templateId: lab.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Thyroid stimulating hormone",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: tshAlias, test_name_normalized: "tsh", series_status: "unknown" },
          span: lab.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  private addGoldNoise(): void {
    const base = addDays("2026-01-08", (this.index * 3) % 40);
    const phoneDate = addDays(base, 45);
    const phone = renderPhone({
      patient: this.patient,
      provider: this.pcp(),
      date: phoneDate,
      variant: (this.index + 1) % 2,
      summary: "patient confirmed transportation for upcoming visit.",
    });
    this.emitDoc({
      docType: "followup",
      provider: this.pcp(),
      providerType: "pcp",
      date: phoneDate,
      text: phone.text,
      templateId: phone.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "followup",
          description: "Scheduling phone call",
          specialty: "primary_care",
          windowDays: null,
          typed: { topic: "scheduling", status: "completed" },
          span: phone.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    const consultDate = addDays(base, 55);
    const note = renderNote({
      patient: this.patient,
      provider: this.pcp(),
      date: consultDate,
      variant: (this.index + 2) % 3,
      topic: "Medication review.",
      body: "Medication list reviewed; no changes made today.",
    });
    this.emitDoc({
      docType: "consult_note",
      provider: this.pcp(),
      providerType: "pcp",
      date: consultDate,
      text: note.text,
      templateId: note.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "consult",
          description: "Medication review",
          specialty: "primary_care",
          windowDays: null,
          typed: { specialty: "primary_care", completed: true },
          span: note.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    const phone2Date = addDays(base, 65);
    const phone2 = renderPhone({
      patient: this.patient,
      provider: this.pcp(),
      date: phone2Date,
      variant: (this.index + 1) % 2,
      summary: "patient confirmed medication pick-up at pharmacy.",
    });
    this.emitDoc({
      docType: "followup",
      provider: this.pcp(),
      providerType: "pcp",
      date: phone2Date,
      text: phone2.text,
      templateId: phone2.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "followup",
          description: "Pharmacy confirmation call",
          specialty: "primary_care",
          windowDays: null,
          typed: { topic: "pharmacy", status: "completed" },
          span: phone2.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    const noteDate = addDays(base, 75);
    const note2 = renderNote({
      patient: this.patient,
      provider: this.pcp(),
      date: noteDate,
      variant: (this.index + 3) % 3,
      topic: "Care coordination update.",
      body: "Care plan reviewed with the patient; no changes to medications.",
    });
    this.emitDoc({
      docType: "consult_note",
      provider: this.pcp(),
      providerType: "pcp",
      date: noteDate,
      text: note2.text,
      templateId: note2.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "consult",
          description: "Care coordination update",
          specialty: "primary_care",
          windowDays: null,
          typed: { specialty: "primary_care", completed: true },
          span: note2.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  // ---------------------------------------------------------------------- gaps

  private targetSpecialty(): Specialty {
    switch (this.patient.care_pathway) {
      case "oncology":
        return "oncology";
      case "surgery":
        return "oncology";
      case "cardiology":
        return "cardiology";
      case "endocrinology":
        return "endocrinology";
      default:
        return this.index % 2 === 0 ? "cardiology" : "endocrinology";
    }
  }

  private buildGap(planned: PlannedGap): void {
    if (planned.gapType === "missed_followup") {
      this.buildMissedFollowup(planned.scenarioId);
    } else if (planned.gapType === "duplicate_test") {
      this.buildDuplicateTest();
    } else {
      this.buildMedMonitoring();
    }
  }

  private buildMissedFollowup(scenarioId: ScenarioId): void {
    const target = scenarioId === "HN-02" ? "cardiology" : this.targetSpecialty();
    const windowDays = target === "oncology" ? ONCOLOGY_REFERRAL_WINDOW_DAYS : DEFAULT_REFERRAL_WINDOW_DAYS;
    const date = addDays("2026-02-01", (this.index * 7) % 55);
    const referralProvider = this.pcp();
    const referral = renderReferral({
      patient: this.patient,
      provider: referralProvider,
      date,
      variant: this.index % 3,
      specialtyLabel: specialtyLabel(target),
      reason: reasonForSpecialty(target),
      windowDays,
    });
    const referralDoc = this.emitDoc({
      docType: "referral",
      provider: referralProvider,
      providerType: "pcp",
      date,
      text: referral.text,
      templateId: referral.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "referral",
          description: `Referral to ${specialtyLabel(target)}`,
          specialty: target,
          windowDays,
          typed: {
            specialty: target,
            reason: reasonForSpecialty(target),
            expected_window_days: windowDays,
            status: "placed",
          },
          span: referral.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    if (scenarioId === "HN-11") {
      const consultDate = addDays(date, windowDays + 10);
      const consultProvider = this.providerFor(target);
      const consult = renderConsult({
        patient: this.patient,
        provider: consultProvider,
        date: consultDate,
        variant: this.index % 3,
        specialtyLabel: specialtyLabel(target),
        summary: `Evaluation completed after the requested window.`,
        telehealth: false,
      });
      this.emitDoc({
        docType: "consult_note",
        provider: consultProvider,
        providerType: "specialist",
        date: consultDate,
        text: consult.text,
        templateId: consult.templateId,
        datePrecision: "day",
        events: [
          {
            eventType: "consult",
            description: `${specialtyLabel(target)} consultation (after window)`,
            specialty: target,
            windowDays: null,
            typed: { specialty: target, completed: true },
            span: consult.span,
            seriesStatus: "unknown",
            confidence: this.confidence(),
            datePrecision: "day",
          },
        ],
      });
    } else {
      const pcpDate = addDays(date, scenarioId === "HN-02" ? 7 : 10);
      const distractor = renderConsult({
        patient: this.patient,
        provider: this.pcp(),
        date: pcpDate,
        variant: (this.index + 1) % 3,
        specialtyLabel: "Primary Care",
        summary: "Routine primary care follow-up; no specialty evaluation performed.",
        telehealth: false,
      });
      this.emitDoc({
        docType: "consult_note",
        provider: this.pcp(),
        providerType: "pcp",
        date: pcpDate,
        text: distractor.text,
        templateId: distractor.templateId,
        datePrecision: "day",
        events: [
          {
            eventType: "consult",
            description: "Primary care follow-up",
            specialty: "primary_care",
            windowDays: null,
            typed: { specialty: "primary_care", completed: true },
            span: distractor.span,
            seriesStatus: "unknown",
            confidence: this.confidence(),
            datePrecision: "day",
          },
        ],
      });
    }

    const referralEvent = referralDoc.events[0] as TruthEvent;
    this.addGap("missed_followup", referralEvent, [referralDoc.record.source_doc_id], windowDays, scenarioId);
  }

  private buildDuplicateTest(): void {
    const date = addDays("2026-03-01", (this.index * 5) % 50);
    const gapDays = 6 + (this.index % 4);

    if (this.index % 5 === 0) {
      const region = this.index % 2 === 0 ? "brain" : "knee";
      const firstProvider = this.providerFor("imaging");
      const secondProvider = providerBySpecialty(this.providers, "imaging", this.index + 1);
      const first = renderImaging({
        patient: this.patient,
        provider: firstProvider,
        date,
        variant: this.index % 3,
        modality: "MRI",
        region,
        impression: "no acute abnormality",
        contrast: false,
      });
      const secondDoc = renderImaging({
        patient: this.patient,
        provider: secondProvider,
        date: addDays(date, 5),
        variant: (this.index + 1) % 3,
        modality: "MRI",
        region,
        impression: "no acute abnormality",
        contrast: false,
      });
      const docA = this.emitDoc({
        docType: "imaging_report",
        provider: firstProvider,
        providerType: "imaging",
        date,
        text: first.text,
        templateId: first.templateId,
        datePrecision: "day",
        events: [
          {
            eventType: "imaging",
            description: `MRI ${region}`,
            specialty: null,
            windowDays: null,
            typed: { modality: "MRI", body_region: region, series_status: "unknown" },
            span: first.span,
            seriesStatus: "unknown",
            confidence: this.confidence(),
            datePrecision: "day",
          },
        ],
      });
      const docB = this.emitDoc({
        docType: "imaging_report",
        provider: secondProvider,
        providerType: "imaging",
        date: addDays(date, 5),
        text: secondDoc.text,
        templateId: secondDoc.templateId,
        datePrecision: "day",
        events: [
          {
            eventType: "imaging",
            description: `MRI ${region}`,
            specialty: null,
            windowDays: null,
            typed: { modality: "MRI", body_region: region, series_status: "unknown" },
            span: secondDoc.span,
            seriesStatus: "unknown",
            confidence: this.confidence(),
            datePrecision: "day",
          },
        ],
      });
      this.addGap(
        "duplicate_test",
        docA.events[0] as TruthEvent,
        [docA.record.source_doc_id, docB.record.source_doc_id],
        DUPLICATE_WINDOW_DAYS,
        "T04",
      );
      return;
    }

    const alias = testAlias("cbc", this.index);
    const labProvider = this.providerFor("laboratory");
    const first = renderLab({
      patient: this.patient,
      provider: labProvider,
      date,
      variant: this.index % 3,
      alias,
      values: "WBC 5.8, Hgb 12.4, Platelets 248",
    });
    const secondDate = addDays(date, gapDays);
    const second = renderLab({
      patient: this.patient,
      provider: this.pcp(),
      date: secondDate,
      variant: (this.index + 1) % 3,
      alias,
      values: "WBC 5.9, Hgb 12.5, Platelets 251",
    });
    const docA = this.emitDoc({
      docType: "lab_report",
      provider: labProvider,
      providerType: "lab",
      date,
      text: first.text,
      templateId: first.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Complete blood count",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: alias, test_name_normalized: "cbc", series_status: "unknown" },
          span: first.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
    const docB = this.emitDoc({
      docType: "lab_report",
      provider: this.pcp(),
      providerType: "pcp",
      date: secondDate,
      text: second.text,
      templateId: second.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Repeat complete blood count",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: alias, test_name_normalized: "cbc", series_status: "unknown" },
          span: second.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
    this.addGap(
      "duplicate_test",
      docA.events[0] as TruthEvent,
      [docA.record.source_doc_id, docB.record.source_doc_id],
      DUPLICATE_WINDOW_DAYS,
      "T04",
    );
  }

  private buildMedMonitoring(): void {
    const useWarfarin = this.index % 3 === 0;
    const drug = useWarfarin ? "warfarin" : "metformin";
    const windowDays = useWarfarin ? WARFARIN_WINDOW_DAYS : METFORMIN_WINDOW_DAYS;
    const date = addDays("2026-01-05", (this.index * 4) % 55);
    const dose = useWarfarin ? "5 mg" : "1000 mg";
    const frequency = useWarfarin ? "daily" : "twice daily";
    const reason = useWarfarin ? "atrial fibrillation" : "type 2 diabetes";
    const medication = renderMedication({
      patient: this.patient,
      provider: this.pcp(),
      date,
      variant: this.index % 2,
      drug,
      dose,
      frequency,
      reason,
      verb: "Started",
    });
    const doc = this.emitDoc({
      docType: "medication_list",
      provider: this.pcp(),
      providerType: "pcp",
      date,
      text: medication.text,
      templateId: medication.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "medication_start",
          description: `${drug} started`,
          specialty: null,
          windowDays: null,
          typed: { drug_raw: drug, drug_normalized: drug, dose, reason },
          span: medication.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    const unrelatedDate = addDays(date, 30);
    const unrelatedProvider = this.providerFor("laboratory");
    const unrelated = renderLab({
      patient: this.patient,
      provider: unrelatedProvider,
      date: unrelatedDate,
      variant: (this.index + 1) % 3,
      alias: testAlias("lipid", this.index),
      values: "LDL 118, HDL 46, Triglycerides 142",
    });
    this.emitDoc({
      docType: "lab_report",
      provider: unrelatedProvider,
      providerType: "lab",
      date: unrelatedDate,
      text: unrelated.text,
      templateId: unrelated.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Lipid panel",
          specialty: null,
          windowDays: null,
          typed: {
            test_name_raw: testAlias("lipid", this.index),
            test_name_normalized: "lipid",
            series_status: "unknown",
          },
          span: unrelated.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    this.addGap("med_monitoring", doc.events[0] as TruthEvent, [doc.record.source_doc_id], windowDays, "T06");
  }

  // ----------------------------------------------------------------- negatives

  private buildNegative(scenario: ScenarioId): void {
    switch (scenario) {
      case "HN-01":
        this.negativeCompletedReferral(false);
        break;
      case "HN-03":
        this.negativeNotYetDue();
        break;
      case "HN-04":
        this.negativeCompletedReferral(true);
        break;
      case "HN-05":
        this.negativeExplicitSeries();
        break;
      case "HN-06":
        this.negativeOutsideWindow();
        break;
      case "HN-07":
        this.negativeDifferentRegion();
        break;
      case "HN-08":
        this.negativeMedicationStopped();
        break;
      case "HN-09":
        this.negativeMonitoringAlias();
        break;
      case "HN-10":
        this.negativeMonitoringInsideWindow();
        break;
      case "HN-12":
        this.negativeCopiedDocument();
        break;
      case "HN-13":
        this.negativeIncompleteDate();
        break;
      case "HN-14":
        this.negativeMissingProvider();
        break;
      case "HN-15":
        this.negativeCompletedStatus();
        break;
      default:
        break;
    }
  }

  private negativeCompletedReferral(telehealth: boolean): void {
    const target: Specialty = telehealth ? "cardiology" : "endocrinology";
    const windowDays = DEFAULT_REFERRAL_WINDOW_DAYS;
    const date = addDays("2026-02-10", (this.index * 3) % 50);
    const referral = renderReferral({
      patient: this.patient,
      provider: this.pcp(),
      date,
      variant: this.index % 3,
      specialtyLabel: specialtyLabel(target),
      reason: reasonForSpecialty(target),
      windowDays,
    });
    this.emitDoc({
      docType: "referral",
      provider: this.pcp(),
      providerType: "pcp",
      date,
      text: referral.text,
      templateId: referral.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "referral",
          description: `Referral to ${specialtyLabel(target)}`,
          specialty: target,
          windowDays,
          typed: { specialty: target, reason: reasonForSpecialty(target), expected_window_days: windowDays, status: "placed" },
          span: referral.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    const consultDate = addDays(date, 14);
    const consultProvider = this.providerFor(target);
    const consult = renderConsult({
      patient: this.patient,
      provider: consultProvider,
      date: consultDate,
      variant: this.index % 3,
      specialtyLabel: specialtyLabel(target),
      summary: telehealth ? "Visit conducted by telehealth; plan reviewed." : "Evaluation completed; plan reviewed.",
      telehealth,
    });
    this.emitDoc({
      docType: telehealth ? "followup" : "consult_note",
      provider: consultProvider,
      providerType: "specialist",
      date: consultDate,
      text: consult.text,
      templateId: consult.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "consult",
          description: `${specialtyLabel(target)} consultation`,
          specialty: target,
          windowDays: null,
          typed: { specialty: target, completed: true },
          span: consult.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  private negativeNotYetDue(): void {
    const target: Specialty = "oncology";
    const windowDays = ONCOLOGY_REFERRAL_WINDOW_DAYS;
    const date = "2026-05-10";
    const referral = renderReferral({
      patient: this.patient,
      provider: this.pcp(),
      date,
      variant: this.index % 3,
      specialtyLabel: specialtyLabel(target),
      reason: "adjuvant therapy evaluation",
      windowDays,
    });
    this.emitDoc({
      docType: "referral",
      provider: this.pcp(),
      providerType: "pcp",
      date,
      text: referral.text,
      templateId: referral.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "referral",
          description: `Referral to ${specialtyLabel(target)}`,
          specialty: target,
          windowDays,
          typed: { specialty: target, reason: "adjuvant therapy evaluation", expected_window_days: windowDays, status: "placed" },
          span: referral.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  private negativeExplicitSeries(): void {
    const date = addDays("2026-02-20", (this.index * 2) % 40);
    const alias = testAlias("cbc", this.index);
    const order = `Weekly CBC monitoring for 6 weeks.`;
    const orderText = `PROGRESS NOTE\nDate: ${date}\nProvider: ${this.pcp().display_name}\nPatient: ${this.patient.display_name}\n${order}\nPlan: serial blood counts per protocol.`;
    this.emitDoc({
      docType: "consult_note",
      provider: this.pcp(),
      providerType: "pcp",
      date,
      text: orderText,
      templateId: "series-order-0",
      datePrecision: "day",
      seriesStatus: "explicit_series",
      events: [
        {
          eventType: "consult",
          description: "Serial CBC monitoring plan",
          specialty: "primary_care",
          windowDays: null,
          typed: { specialty: "primary_care", completed: true },
          span: order,
          seriesStatus: "explicit_series",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    for (let step = 1; step <= 3; step += 1) {
      const labDate = addDays(date, step * 7);
      const labProvider = this.providerFor("laboratory");
      const lab = renderLab({
        patient: this.patient,
        provider: labProvider,
        date: labDate,
        variant: (this.index + step) % 3,
        alias,
        values: `WBC ${5.5 + step / 10}, Hgb 12.2, Platelets 245`,
      });
      this.emitDoc({
        docType: "lab_report",
        provider: labProvider,
        providerType: "lab",
        date: labDate,
        text: lab.text,
        templateId: lab.templateId,
        datePrecision: "day",
        seriesStatus: "explicit_series",
        events: [
          {
            eventType: "lab_result",
            description: "Complete blood count (serial)",
            specialty: null,
            windowDays: null,
            typed: { test_name_raw: alias, test_name_normalized: "cbc", series_status: "explicit_series" },
            span: lab.span,
            seriesStatus: "explicit_series",
            confidence: this.confidence(),
            datePrecision: "day",
          },
        ],
      });
    }
  }

  private negativeOutsideWindow(): void {
    const date = addDays("2026-02-15", (this.index * 2) % 40);
    const alias = testAlias("cbc", this.index);
    for (const [offset, value] of [
      [0, "WBC 5.7, Hgb 12.3, Platelets 249"],
      [21, "WBC 5.8, Hgb 12.4, Platelets 250"],
    ] as const) {
      const labDate = addDays(date, offset);
      const labProvider = this.providerFor("laboratory");
      const lab = renderLab({
        patient: this.patient,
        provider: labProvider,
        date: labDate,
        variant: (this.index + offset) % 3,
        alias,
        values: value,
      });
      this.emitDoc({
        docType: "lab_report",
        provider: labProvider,
        providerType: "lab",
        date: labDate,
        text: lab.text,
        templateId: lab.templateId,
        datePrecision: "day",
        events: [
          {
            eventType: "lab_result",
            description: "Complete blood count",
            specialty: null,
            windowDays: null,
            typed: { test_name_raw: alias, test_name_normalized: "cbc", series_status: "unknown" },
            span: lab.span,
            seriesStatus: "unknown",
            confidence: this.confidence(),
            datePrecision: "day",
          },
        ],
      });
    }
  }

  private negativeDifferentRegion(): void {
    const date = addDays("2026-02-18", (this.index * 2) % 40);
    for (const [offset, region] of [
      [0, "brain"],
      [5, "knee"],
    ] as const) {
      const provider = this.providerFor("imaging");
      const imaging = renderImaging({
        patient: this.patient,
        provider,
        date: addDays(date, offset),
        variant: (this.index + offset) % 3,
        modality: "MRI",
        region,
        impression: "no acute abnormality",
        contrast: false,
      });
      this.emitDoc({
        docType: "imaging_report",
        provider,
        providerType: "imaging",
        date: addDays(date, offset),
        text: imaging.text,
        templateId: imaging.templateId,
        datePrecision: "day",
        events: [
          {
            eventType: "imaging",
            description: `MRI ${region}`,
            specialty: null,
            windowDays: null,
            typed: { modality: "MRI", body_region: region, series_status: "unknown" },
            span: imaging.span,
            seriesStatus: "unknown",
            confidence: this.confidence(),
            datePrecision: "day",
          },
        ],
      });
    }
  }

  private negativeMedicationStopped(): void {
    const date = addDays("2026-01-20", (this.index * 3) % 40);
    const start = renderMedication({
      patient: this.patient,
      provider: this.pcp(),
      date,
      variant: this.index % 2,
      drug: "metformin",
      dose: "500 mg",
      frequency: "twice daily",
      reason: "type 2 diabetes",
      verb: "Started",
    });
    this.emitDoc({
      docType: "medication_list",
      provider: this.pcp(),
      providerType: "pcp",
      date,
      text: start.text,
      templateId: start.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "medication_start",
          description: "metformin started",
          specialty: null,
          windowDays: null,
          typed: { drug_raw: "metformin", drug_normalized: "metformin", dose: "500 mg", reason: "type 2 diabetes" },
          span: start.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    const stopDate = addDays(date, 30);
    const stop = renderMedication({
      patient: this.patient,
      provider: this.pcp(),
      date: stopDate,
      variant: (this.index + 1) % 2,
      drug: "metformin",
      dose: "500 mg",
      frequency: "twice daily",
      reason: "intolerance",
      verb: "Stopped",
    });
    this.emitDoc({
      docType: "medication_list",
      provider: this.pcp(),
      providerType: "pcp",
      date: stopDate,
      text: stop.text,
      templateId: stop.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "medication_stop",
          description: "metformin stopped",
          specialty: null,
          windowDays: null,
          typed: { drug_raw: "metformin", drug_normalized: "metformin", reason: "intolerance" },
          span: stop.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  private negativeMonitoringAlias(): void {
    this.monitoringSatisfied("HbA1c", 60);
  }

  private negativeMonitoringInsideWindow(): void {
    this.monitoringSatisfied("A1c", 89);
  }

  private monitoringSatisfied(alias: string, offset: number): void {
    const date = addDays("2026-01-15", (this.index * 3) % 40);
    const start = renderMedication({
      patient: this.patient,
      provider: this.pcp(),
      date,
      variant: this.index % 2,
      drug: "metformin",
      dose: "1000 mg",
      frequency: "twice daily",
      reason: "type 2 diabetes",
      verb: "Started",
    });
    this.emitDoc({
      docType: "medication_list",
      provider: this.pcp(),
      providerType: "pcp",
      date,
      text: start.text,
      templateId: start.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "medication_start",
          description: "metformin started",
          specialty: null,
          windowDays: null,
          typed: { drug_raw: "metformin", drug_normalized: "metformin", dose: "1000 mg", reason: "type 2 diabetes" },
          span: start.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });

    const labDate = addDays(date, offset);
    const labProvider = this.providerFor("laboratory");
    const lab = renderLab({
      patient: this.patient,
      provider: labProvider,
      date: labDate,
      variant: (this.index + 1) % 3,
      alias,
      values: "7.1%",
    });
    this.emitDoc({
      docType: "lab_report",
      provider: labProvider,
      providerType: "lab",
      date: labDate,
      text: lab.text,
      templateId: lab.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Hemoglobin A1c",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: alias, test_name_normalized: "a1c", series_status: "unknown" },
          span: lab.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  private negativeCopiedDocument(): void {
    const date = addDays("2026-02-22", (this.index * 2) % 40);
    const alias = testAlias("cbc", this.index);
    const labProvider = this.providerFor("laboratory");
    const lab = renderLab({
      patient: this.patient,
      provider: labProvider,
      date,
      variant: this.index % 3,
      alias,
      values: "WBC 5.6, Hgb 12.2, Platelets 246",
    });
    const doc = this.emitDoc({
      docType: "lab_report",
      provider: labProvider,
      providerType: "lab",
      date,
      text: lab.text,
      templateId: lab.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Complete blood count",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: alias, test_name_normalized: "cbc", series_status: "unknown" },
          span: lab.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
    this.duplicateDoc(doc.record);
  }

  private negativeIncompleteDate(): void {
    const date = "2026-05-01";
    const alias = testAlias("cbc", this.index);
    const labProvider = this.providerFor("laboratory");
    const span = `${alias}: WBC 5.4, Hgb 12.0, Platelets 238.`;
    const text = `LABORATORY REPORT\nDate: May 2026\nProvider: ${labProvider.display_name}\nPatient: ${this.patient.display_name}\n${span}\nPartial date recorded by outside laboratory.`;
    this.emitDoc({
      docType: "lab_report",
      provider: labProvider,
      providerType: "lab",
      date,
      text,
      templateId: "lab-partial-date",
      datePrecision: "month",
      events: [
        {
          eventType: "lab_result",
          description: "Complete blood count",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: alias, test_name_normalized: "cbc", series_status: "unknown" },
          span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "month",
        },
      ],
    });
  }

  private negativeMissingProvider(): void {
    const date = addDays("2026-02-25", (this.index * 2) % 40);
    const alias = testAlias("cbc", this.index);
    const external: SyntheticProvider = {
      provider_id: deterministicId("provider", "UNKNOWN-EXTERNAL"),
      fixture_key: "PROV-UNKNOWN",
      display_name: "Unknown (external records)",
      specialty: "laboratory",
      organization: "External records",
      synthetic: true,
    };
    const lab = renderLab({
      patient: this.patient,
      provider: external,
      date,
      variant: this.index % 3,
      alias,
      values: "WBC 5.3, Hgb 11.9, Platelets 240",
    });
    this.emitDoc({
      docType: "lab_report",
      provider: external,
      providerType: "other",
      date,
      text: lab.text,
      templateId: lab.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Complete blood count",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: alias, test_name_normalized: "cbc", series_status: "unknown" },
          span: lab.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  private negativeCompletedStatus(): void {
    const target: Specialty = "cardiology";
    const date = addDays("2026-02-12", (this.index * 3) % 40);
    const referral = renderReferral({
      patient: this.patient,
      provider: this.pcp(),
      date,
      variant: this.index % 3,
      specialtyLabel: specialtyLabel(target),
      reason: "arrhythmia evaluation",
      windowDays: DEFAULT_REFERRAL_WINDOW_DAYS,
    });
    this.emitDoc({
      docType: "referral",
      provider: this.pcp(),
      providerType: "pcp",
      date,
      text: referral.text,
      templateId: referral.templateId,
      datePrecision: "day",
      events: [
        {
          eventType: "referral",
          description: "Referral to Cardiology (completed)",
          specialty: target,
          windowDays: DEFAULT_REFERRAL_WINDOW_DAYS,
          typed: {
            specialty: target,
            reason: "arrhythmia evaluation",
            expected_window_days: DEFAULT_REFERRAL_WINDOW_DAYS,
            status: "completed",
          },
          span: referral.span,
          seriesStatus: "unknown",
          confidence: this.confidence(),
          datePrecision: "day",
        },
      ],
    });
  }

  // --------------------------------------------------------------------- Maria

  private buildMaria(): void {
    const pcp = this.pcp();
    const _onc = this.providerFor("oncology");
    const surg = this.providerFor("surgery");
    const lab = this.providerFor("laboratory");
    const imaging = this.providerFor("imaging");

    // R1 — metformin start (valid monitoring gap).
    const r1Text = `54F with type 2 diabetes, A1c 8.1%. Starting metformin 1000 mg twice daily. Plan: recheck A1c and BMP in 90 days to assess response and renal function.`;
    const r1Span = "Starting metformin 1000 mg twice daily.";
    const r1 = this.emitDoc({
      docType: "consult_note",
      provider: pcp,
      providerType: "pcp",
      date: "2026-02-10",
      text: r1Text,
      templateId: "maria-pcp-0",
      datePrecision: "day",
      events: [
        {
          eventType: "consult",
          description: "Primary care follow-up for diabetes",
          specialty: "primary_care",
          windowDays: null,
          typed: { specialty: "primary_care", completed: true },
          span: "54F with type 2 diabetes, A1c 8.1%.",
          seriesStatus: "unknown",
          confidence: 0.95,
          datePrecision: "day",
        },
        {
          eventType: "medication_start",
          description: "Metformin 1000 mg twice daily started",
          specialty: null,
          windowDays: null,
          typed: { drug_raw: "metformin", drug_normalized: "metformin", dose: "1000 mg twice daily", reason: "type 2 diabetes" },
          span: r1Span,
          seriesStatus: "unknown",
          confidence: 0.95,
          datePrecision: "day",
        },
      ],
    });
    const metforminEvent = r1.events[1] as TruthEvent;

    // R2 — diagnosis consult.
    this.emitDoc({
      docType: "consult_note",
      provider: pcp,
      providerType: "pcp",
      date: "2026-03-04",
      text: "New diagnosis of invasive ductal carcinoma, left breast, on screening mammogram. Discussed surgical options. Referred to surgical oncology. Patient anxious but engaged. Plan: lumpectomy with sentinel node biopsy.",
      templateId: "maria-pcp-1",
      datePrecision: "day",
      events: [
        {
          eventType: "consult",
          description: "New IDC diagnosis; surgical options discussed",
          specialty: "primary_care",
          windowDays: null,
          typed: { specialty: "primary_care", completed: true },
          span: "New diagnosis of invasive ductal carcinoma, left breast, on screening mammogram.",
          seriesStatus: "unknown",
          confidence: 0.96,
          datePrecision: "day",
        },
      ],
    });

    // R3 — surgery.
    this.emitDoc({
      docType: "discharge_summary",
      provider: surg,
      providerType: "specialist",
      date: "2026-03-18",
      text: "Underwent left lumpectomy with sentinel lymph node biopsy on 2026-03-18. Pathology: invasive ductal carcinoma, 1.8 cm, grade 2, ER+/PR+, HER2-negative, 0/2 nodes positive. Margins clear. Plan: adjuvant radiation and endocrine therapy.",
      templateId: "maria-surgery-0",
      datePrecision: "day",
      events: [
        {
          eventType: "surgery",
          description: "Left lumpectomy with sentinel lymph node biopsy",
          specialty: "surgery",
          windowDays: null,
          typed: { procedure: "lumpectomy", site: "left breast" },
          span: "Underwent left lumpectomy with sentinel lymph node biopsy on 2026-03-18.",
          seriesStatus: "unknown",
          confidence: 0.97,
          datePrecision: "day",
        },
      ],
    });

    // R4 — oncology referral (valid missed follow-up gap).
    const r4Span = "Referral to Medical Oncology for adjuvant therapy evaluation (endocrine therapy and radiation planning). Please schedule within 45 days.";
    const r4 = this.emitDoc({
      docType: "referral",
      provider: pcp,
      providerType: "pcp",
      date: "2026-03-25",
      text: `Post-operative visit. ${r4Span} Patient to be contacted by coordinator.`,
      templateId: "maria-referral-0",
      datePrecision: "day",
      events: [
        {
          eventType: "referral",
          description: "Referral to medical oncology for adjuvant therapy evaluation",
          specialty: "oncology",
          windowDays: 45,
          typed: { specialty: "oncology", reason: "adjuvant therapy evaluation", expected_window_days: 45, status: "placed" },
          span: r4Span,
          seriesStatus: "unknown",
          confidence: 0.96,
          datePrecision: "day",
        },
      ],
    });
    const referralEvent = r4.events[0] as TruthEvent;

    // R5 — imaging.
    this.emitDoc({
      docType: "imaging_report",
      provider: imaging,
      providerType: "imaging",
      date: "2026-04-18",
      text: "Bilateral diagnostic mammogram and breast ultrasound for post-surgical baseline. Post-surgical changes left breast. No suspicious mass or recurrence identified. Recommend clinical correlation and oncology follow-up per treating team.",
      templateId: "maria-imaging-0",
      datePrecision: "day",
      events: [
        {
          eventType: "imaging",
          description: "Bilateral diagnostic mammogram and breast ultrasound",
          specialty: null,
          windowDays: null,
          typed: { modality: "mammogram", body_region: "breast", series_status: "unknown" },
          span: "Bilateral diagnostic mammogram and breast ultrasound for post-surgical baseline.",
          seriesStatus: "unknown",
          confidence: 0.97,
          datePrecision: "day",
        },
      ],
    });

    // R6 — CBC (first of duplicate pair).
    const cbc1Span = "CBC with differential: WBC 5.8, Hgb 12.4, Plt 248. Within normal limits.";
    const r6 = this.emitDoc({
      docType: "lab_report",
      provider: lab,
      providerType: "lab",
      date: "2026-04-20",
      text: `${cbc1Span} Reference ranges per performing laboratory.`,
      templateId: "maria-lab-0",
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "CBC with differential",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: "CBC with differential", test_name_normalized: "cbc", series_status: "unknown" },
          span: cbc1Span,
          seriesStatus: "unknown",
          confidence: 0.94,
          datePrecision: "day",
        },
      ],
    });

    // R7 — tamoxifen context only (pending window).
    this.emitDoc({
      docType: "medication_list",
      provider: pcp,
      providerType: "pcp",
      date: "2026-04-22",
      text: "Started tamoxifen 20 mg daily for ER+ breast cancer. Discussed side effects including VTE risk. Annual gynecologic/oncology follow-up recommended.",
      templateId: "maria-med-0",
      datePrecision: "day",
      events: [
        {
          eventType: "medication_start",
          description: "Tamoxifen 20 mg daily started",
          specialty: null,
          windowDays: null,
          typed: { drug_raw: "tamoxifen", drug_normalized: "tamoxifen", dose: "20 mg daily", reason: "ER+ breast cancer" },
          span: "Started tamoxifen 20 mg daily for ER+ breast cancer.",
          seriesStatus: "unknown",
          confidence: 0.95,
          datePrecision: "day",
        },
      ],
    });

    // R8 — repeat CBC (second of duplicate pair).
    const cbc2Span = "Repeat CBC with differential ordered at follow-up visit: WBC 5.9, Hgb 12.5, Plt 251. Within normal limits. No clinical indication documented for repeat at this interval.";
    const r8 = this.emitDoc({
      docType: "lab_report",
      provider: pcp,
      providerType: "pcp",
      date: "2026-04-28",
      text: cbc2Span,
      templateId: "maria-lab-1",
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Repeat CBC with differential",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: "CBC with differential", test_name_normalized: "cbc", series_status: "unknown" },
          span: cbc2Span,
          seriesStatus: "unknown",
          confidence: 0.94,
          datePrecision: "day",
        },
      ],
    });

    // Distractor PCP visit after the referral — different specialty.
    this.emitDoc({
      docType: "consult_note",
      provider: pcp,
      providerType: "pcp",
      date: "2026-05-02",
      text: "Primary care follow-up. Patient reports fatigue. Reviewed medications. No oncology consultation documented in this record.",
      templateId: "maria-pcp-2",
      datePrecision: "day",
      events: [
        {
          eventType: "consult",
          description: "Primary care follow-up",
          specialty: "primary_care",
          windowDays: null,
          typed: { specialty: "primary_care", completed: true },
          span: "Primary care follow-up.",
          seriesStatus: "unknown",
          confidence: 0.95,
          datePrecision: "day",
        },
      ],
    });

    // Noise + gold extras.
    this.emitDoc({
      docType: "followup",
      provider: pcp,
      providerType: "pcp",
      date: "2026-05-06",
      text: "TELEPHONE ENCOUNTER\nDate: 05/06/2026\nProvider: Dr. Lena Ortiz\nPatient: Maria Chen\nPhone follow-up: patient reports doing well; no new symptoms.\nPatient reached by phone.",
      templateId: "maria-phone-0",
      datePrecision: "day",
      events: [
        {
          eventType: "followup",
          description: "Routine phone follow-up",
          specialty: "primary_care",
          windowDays: null,
          typed: { topic: "routine", status: "completed" },
          span: "Phone follow-up: patient reports doing well; no new symptoms.",
          seriesStatus: "unknown",
          confidence: 0.95,
          datePrecision: "day",
        },
      ],
    });
    this.emitDoc({
      docType: "lab_report",
      provider: lab,
      providerType: "lab",
      date: "2026-05-08",
      text: "LABORATORY REPORT\nDate: 05/08/2026\nProvider: Metro Lab Services\nPatient: Maria Chen\nTSH: 2.1 mIU/L.\nNo critical values.",
      templateId: "maria-lab-2",
      datePrecision: "day",
      events: [
        {
          eventType: "lab_result",
          description: "Thyroid stimulating hormone",
          specialty: null,
          windowDays: null,
          typed: { test_name_raw: "TSH", test_name_normalized: "tsh", series_status: "unknown" },
          span: "TSH: 2.1 mIU/L.",
          seriesStatus: "unknown",
          confidence: 0.94,
          datePrecision: "day",
        },
      ],
    });

    this.addGap("missed_followup", referralEvent, [r4.record.source_doc_id], 45, "T02");
    this.addGap(
      "duplicate_test",
      (r6.events[0] as TruthEvent),
      [r6.record.source_doc_id, r8.record.source_doc_id],
      DUPLICATE_WINDOW_DAYS,
      "T04",
    );
    this.addGap("med_monitoring", metforminEvent, [r1.record.source_doc_id], METFORMIN_WINDOW_DAYS, "T06");
  }
}

function reasonForSpecialty(specialty: Specialty): string {
  switch (specialty) {
    case "oncology":
      return "adjuvant therapy evaluation";
    case "cardiology":
      return "cardiac evaluation";
    case "endocrinology":
      return "endocrine evaluation";
    default:
      return "specialty evaluation";
  }
}

export function normalizeEventTest(event: TruthEvent): string | null {
  const raw = event.typed["test_name_raw"];
  if (typeof raw !== "string") return null;
  return normalizeTestName(raw);
}
