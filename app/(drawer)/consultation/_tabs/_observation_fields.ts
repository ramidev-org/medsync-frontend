import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type SpecialtyKey =
  | "general_medicine"
  | "gynecology"
  | "cardiology"
  | "dermatology"
  | "orthopedics"
  | "dentistry"
  | "pediatrics"
  | "endocrinology_diabetes"
  | "ent"
  | "ophthalmology"
  | "pulmonology"
  | "gastroenterology"
  | "analyses_medicales";

export type ParameterField = {
  key: string;
  label: string;
  multiline?: boolean;
};

export const SPECIALTY_TABS: Array<{
  key: SpecialtyKey;
  label: string;
}> = [
  { key: "general_medicine", label: "Medecine Generale" },
  { key: "gynecology", label: "Gynecologie" },
  { key: "cardiology", label: "Cardiologie" },
  { key: "dermatology", label: "Dermatologie" },
  { key: "orthopedics", label: "Orthopedie" },
  { key: "dentistry", label: "Dentisterie" },
  { key: "pediatrics", label: "Pediatrie" },
  { key: "endocrinology_diabetes", label: "Endocrino / Diabete" },
  { key: "ent", label: "ORL" },
  { key: "ophthalmology", label: "Ophtalmologie" },
  { key: "pulmonology", label: "Pneumologie" },
  { key: "gastroenterology", label: "Gastroenterologie" },
  { key: "analyses_medicales", label: "Analyses Medicales" },
];

const GENERIC_PARAMETER_FIELDS: ParameterField[] = [
  { key: "motif_consultation", label: "Motif de consultation :" },
  { key: "glycemie", label: "Glycemie :" },
  { key: "hba1c", label: "HbA1c :" },
  { key: "examen_clinique", label: "Examen clinique :", multiline: true },
  { key: "conclusion", label: "Conclusion :", multiline: true },
];

export const SPECIALTY_PARAMETER_FIELDS: Record<SpecialtyKey, ParameterField[]> = {
  general_medicine: [
    { key: "reason_for_visit", label: "Motif de consultation :" },
    { key: "chief_complaint", label: "Plainte principale :" },
    { key: "systems_review", label: "Revue des systemes :", multiline: true },
    { key: "general_exam", label: "Examen general :", multiline: true },
    { key: "plan", label: "Plan :", multiline: true },
  ],
  cardiology: [
    { key: "chestPain", label: "Douleur thoracique :" },
    { key: "dyspnea", label: "Dyspnee :" },
    { key: "bloodPressure", label: "TA :" },
    { key: "heartRate", label: "Frequence cardiaque :" },
    { key: "ecgSummary", label: "Resume ECG :", multiline: true },
    { key: "assessmentPlan", label: "Evaluation et plan :", multiline: true },
  ],
  dermatology: [
    { key: "chiefComplaint", label: "Plainte principale :" },
    { key: "lesionSite", label: "Site lesionnel :" },
    { key: "morphology", label: "Morphologie :" },
    { key: "dermoscopy", label: "Dermoscopie :", multiline: true },
    { key: "biopsyDecision", label: "Decision biopsie :" },
    { key: "plan", label: "Plan therapeutique :", multiline: true },
  ],
  gynecology: [
    { key: "reason", label: "Motif de consultation :" },
    { key: "lmpDate", label: "DDR :" },
    { key: "pregnancyStatus", label: "Statut grossesse :" },
    { key: "gestationalAgeWeeks", label: "Age gestationnel (SA) :" },
    { key: "redFlags", label: "Signes d'alerte :" },
    { key: "planFollowUp", label: "Plan et suivi :", multiline: true },
  ],
  orthopedics: [
    { key: "mechanism", label: "Mecanisme :" },
    { key: "painSite", label: "Site de la douleur :" },
    { key: "painScale", label: "EVA douleur :" },
    { key: "rangeOfMotion", label: "Amplitude articulaire (ROM) :" },
    { key: "imagingSummary", label: "Resume imagerie :", multiline: true },
    { key: "treatmentPlan", label: "Plan de traitement :", multiline: true },
  ],
  dentistry: [
    { key: "chief_dental_complaint", label: "Plainte dentaire principale :", multiline: true },
    { key: "tooth_records_summary", label: "Resume dents / lesions :", multiline: true },
    { key: "materials_used", label: "Materiaux utilises :" },
    { key: "next_dental_step", label: "Prochaine etape :" },
    { key: "clinical_notes", label: "Notes cliniques :", multiline: true },
  ],
  pediatrics: [
    { key: "birth_history", label: "Antecedents de naissance :", multiline: true },
    { key: "feeding", label: "Alimentation :" },
    { key: "vaccination_status", label: "Statut vaccinal :", multiline: true },
    { key: "development_notes", label: "Developpement :", multiline: true },
  ],
  endocrinology_diabetes: [
    { key: "diabetes_type", label: "Type de diabete :" },
    { key: "fasting_glucose", label: "Glycemie a jeun :" },
    { key: "hba1c", label: "HbA1c :" },
    { key: "endocrine_plan", label: "Plan endocrino :", multiline: true },
  ],
  ent: [
    { key: "ear_symptoms", label: "Symptomes oreille :", multiline: true },
    { key: "nose_symptoms", label: "Symptomes nez :", multiline: true },
    { key: "throat_symptoms", label: "Symptomes gorge :", multiline: true },
    { key: "ent_plan", label: "Plan ORL :", multiline: true },
  ],
  ophthalmology: [
    { key: "visual_acuity_right", label: "Acuite OD :" },
    { key: "visual_acuity_left", label: "Acuite OG :" },
    { key: "fundus_exam", label: "Fond d'oeil :", multiline: true },
    { key: "ophtha_plan", label: "Plan ophtalmo :", multiline: true },
  ],
  pulmonology: [
    { key: "cough", label: "Toux :" },
    { key: "dyspnea_grade", label: "Dyspnee :" },
    { key: "lung_auscultation", label: "Auscultation :", multiline: true },
    { key: "pulmo_plan", label: "Plan pneumo :", multiline: true },
  ],
  gastroenterology: [
    { key: "abdominal_pain_site", label: "Site douleur abdominale :" },
    { key: "bowel_habits", label: "Transit :", multiline: true },
    { key: "abdominal_exam", label: "Examen abdominal :", multiline: true },
    { key: "gastro_plan", label: "Plan gastro :", multiline: true },
  ],
  analyses_medicales: [
    { key: "order_priority", label: "Priorite demande :" },
    { key: "clinical_context", label: "Contexte clinique :", multiline: true },
    { key: "requested_tests", label: "Tests demandes :", multiline: true },
    { key: "lab_comments", label: "Commentaires labo :", multiline: true },
  ],
};

export const FIELD_ICON_MAP: Record<string, ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  taille_cm: "human-male-height",
  height_cm: "human-male-height",
  poids_kg: "scale",
  weight_kg: "scale",
  tension: "heart-pulse",
  blood_pressure: "heart-pulse",
  bloodPressure: "heart-pulse",
  systolic_bp: "heart-pulse",
  diastolic_bp: "heart-pulse",
  temperature_c: "thermometer",
  temperature: "thermometer",
  motif_consultation: "text-box-outline",
  glycemie: "test-tube",
  hba1c: "chart-line",
  examen_clinique: "stethoscope",
  conclusion: "clipboard-check-outline",
  heartRate: "heart-outline",
  ecgSummary: "chart-line",
  plan: "clipboard-text-outline",
  reason_for_visit: "text-box-outline",
  chief_complaint: "stethoscope",
  chief_dental_complaint: "tooth-outline",
};

function normalizeFieldLabel(label: string) {
  return String(label ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function fieldMeaningToken(field: ParameterField) {
  const key = String(field.key ?? "").trim().toLowerCase();
  const label = normalizeFieldLabel(field.label);
  const raw = `${key} ${label}`;

  if (
    raw.includes("motif consultation") ||
    raw.includes("reason for visit") ||
    key === "motif_consultation" ||
    key === "reason_for_visit"
  ) {
    return "consultation_reason";
  }

  if (
    raw.includes("examen clinique") ||
    raw.includes("clinical exam") ||
    raw.includes("general exam") ||
    raw.includes("examen general") ||
    key === "examen_clinique" ||
    key === "general_exam"
  ) {
    return "clinical_exam";
  }

  return "";
}

function dedupeFields(fields: ParameterField[]) {
  const seenKeys = new Set<string>();
  const seenLabels = new Set<string>();
  const seenMeaning = new Set<string>();
  return fields.filter((field) => {
    const key = String(field.key ?? "").trim().toLowerCase();
    const label = normalizeFieldLabel(field.label);
    const meaning = fieldMeaningToken(field);

    if (!key && !label) return false;
    if (seenKeys.has(key) || seenLabels.has(label)) return false;
    if (meaning && seenMeaning.has(meaning)) return false;

    seenKeys.add(key);
    seenLabels.add(label);
    if (meaning) seenMeaning.add(meaning);
    return true;
  });
}

const WORKSPACES_WITH_DEFAULT_CRITERIA = new Set<SpecialtyKey>([
  "general_medicine",
  "dentistry",
  "gynecology",
  "cardiology",
  "dermatology",
  "orthopedics",
  "pediatrics",
  "endocrinology_diabetes",
  "ent",
  "ophthalmology",
  "pulmonology",
  "gastroenterology",
  "analyses_medicales",
]);

export function isSpecialtyKey(value: string): value is SpecialtyKey {
  return SPECIALTY_TABS.some((item) => item.key === value);
}

export function getTreatmentExtraFields(workspace: string): ParameterField[] {
  return dedupeFields(SPECIALTY_PARAMETER_FIELDS[workspace as SpecialtyKey] ?? []);
}

export function getConsultationFields(workspace: SpecialtyKey): ParameterField[] {
  const specialtyFields = SPECIALTY_PARAMETER_FIELDS[workspace] ?? [];
  if (!specialtyFields.length) return dedupeFields(GENERIC_PARAMETER_FIELDS);

  const useDefaultCriteria = WORKSPACES_WITH_DEFAULT_CRITERIA.has(workspace);
  const merged = useDefaultCriteria ? [...specialtyFields, ...GENERIC_PARAMETER_FIELDS] : specialtyFields;
  return dedupeFields(merged);
}
