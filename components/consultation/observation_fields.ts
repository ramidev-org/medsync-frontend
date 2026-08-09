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

export type TreatmentOption = {
  key: string;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  description: string;
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
    { key: "current_symptoms", label: "Symptomes actuels :", multiline: true },
    { key: "history_of_present_illness", label: "Histoire de la maladie actuelle :", multiline: true },
    { key: "systems_review", label: "Revue des systemes :", multiline: true },
    { key: "general_exam", label: "Examen general :", multiline: true },
    { key: "working_diagnosis", label: "Hypothese diagnostique :", multiline: true },
    { key: "plan", label: "Plan :", multiline: true },
    { key: "follow_up", label: "Suivi recommande :" },
  ],
  cardiology: [
    { key: "chestPain", label: "Douleur thoracique :" },
    { key: "dyspnea", label: "Dyspnee :" },
    { key: "palpitations", label: "Palpitations :" },
    { key: "syncope", label: "Syncope / malaise :" },
    { key: "riskFactors", label: "Facteurs de risque CV :", multiline: true },
    { key: "bloodPressure", label: "TA :" },
    { key: "heartRate", label: "Frequence cardiaque :" },
    { key: "ecgSummary", label: "Resume ECG :", multiline: true },
    { key: "echoSummary", label: "Resume echographie cardiaque :", multiline: true },
    { key: "assessmentPlan", label: "Evaluation et plan :", multiline: true },
  ],
  dermatology: [
    { key: "chiefComplaint", label: "Plainte principale :" },
    { key: "lesionSite", label: "Site lesionnel :" },
    { key: "morphology", label: "Morphologie :" },
    { key: "sizeMm", label: "Taille (mm) :" },
    { key: "color", label: "Couleur :" },
    { key: "evolution", label: "Evolution :" },
    { key: "dermoscopy", label: "Dermoscopie :", multiline: true },
    { key: "biopsyDecision", label: "Decision biopsie :" },
    { key: "differential", label: "Diagnostic differentiel :", multiline: true },
    { key: "plan", label: "Plan therapeutique :", multiline: true },
  ],
  gynecology: [
    { key: "reason", label: "Motif de consultation :" },
    { key: "lmpDate", label: "DDR :" },
    { key: "cycleDays", label: "Cycle (jours) :" },
    { key: "pregnancyStatus", label: "Statut grossesse :" },
    { key: "gestationalAgeWeeks", label: "Age gestationnel (SA) :" },
    { key: "gravidityParity", label: "Gravidite / Parite :" },
    { key: "redFlags", label: "Signes d'alerte :" },
    { key: "pelvicExam", label: "Examen pelvien / obstetrical :", multiline: true },
    { key: "ultrasoundSummary", label: "Resume echographie :", multiline: true },
    { key: "planFollowUp", label: "Plan et suivi :", multiline: true },
  ],
  orthopedics: [
    { key: "mechanism", label: "Mecanisme :" },
    { key: "painSite", label: "Site de la douleur :" },
    { key: "painScale", label: "EVA douleur :" },
    { key: "rangeOfMotion", label: "Amplitude articulaire (ROM) :" },
    { key: "neurovascular", label: "Statut neurovasculaire :" },
    { key: "imagingSummary", label: "Resume imagerie :", multiline: true },
    { key: "diagnosis", label: "Diagnostic orthopedique :", multiline: true },
    { key: "treatmentPlan", label: "Plan de traitement :", multiline: true },
    { key: "rehabPlan", label: "Plan de reeducation / suivi :", multiline: true },
  ],
  dentistry: [
    { key: "chief_dental_complaint", label: "Plainte dentaire principale :", multiline: true },
    { key: "dental_pain_scale", label: "Echelle de douleur :" },
    { key: "treated_area", label: "Dent / zone concernee :" },
    { key: "oral_exam", label: "Examen bucco-dentaire :", multiline: true },
    { key: "tooth_records_summary", label: "Resume dents / lesions :", multiline: true },
    { key: "materials_used", label: "Materiaux utilises :" },
    { key: "next_dental_step", label: "Prochaine etape :" },
    { key: "clinical_notes", label: "Notes cliniques :", multiline: true },
  ],
  pediatrics: [
    { key: "chief_pediatric_complaint", label: "Motif de consultation :" },
    { key: "birth_history", label: "Antecedents de naissance :", multiline: true },
    { key: "feeding", label: "Alimentation :" },
    { key: "vaccination_status", label: "Statut vaccinal :", multiline: true },
    { key: "development_notes", label: "Developpement :", multiline: true },
    { key: "pediatric_exam", label: "Examen pediatrique :", multiline: true },
    { key: "family_guidance", label: "Conseils parents / suivi :", multiline: true },
  ],
  endocrinology_diabetes: [
    { key: "diabetes_type", label: "Type de diabete :" },
    { key: "fasting_glucose", label: "Glycemie a jeun :" },
    { key: "hba1c", label: "HbA1c :" },
    { key: "hypoglycemia_risk", label: "Risque d'hypoglycemie :" },
    { key: "foot_check", label: "Controle pied diabetique :" },
    { key: "endocrine_plan", label: "Plan endocrino :", multiline: true },
  ],
  ent: [
    { key: "ear_symptoms", label: "Symptomes oreille :", multiline: true },
    { key: "nose_symptoms", label: "Symptomes nez :", multiline: true },
    { key: "throat_symptoms", label: "Symptomes gorge :", multiline: true },
    { key: "ent_exam", label: "Examen ORL :", multiline: true },
    { key: "ent_plan", label: "Plan ORL :", multiline: true },
  ],
  ophthalmology: [
    { key: "visual_acuity_right", label: "Acuite OD :" },
    { key: "visual_acuity_left", label: "Acuite OG :" },
    { key: "intraocular_pressure", label: "Pression intraoculaire :" },
    { key: "slit_lamp_exam", label: "Lampe a fente :", multiline: true },
    { key: "fundus_exam", label: "Fond d'oeil :", multiline: true },
    { key: "ophtha_plan", label: "Plan ophtalmo :", multiline: true },
  ],
  pulmonology: [
    { key: "cough", label: "Toux :" },
    { key: "dyspnea_grade", label: "Dyspnee :" },
    { key: "oxygen_saturation", label: "Saturation O2 :" },
    { key: "respiratory_rate", label: "Frequence respiratoire :" },
    { key: "lung_auscultation", label: "Auscultation :", multiline: true },
    { key: "pulmo_plan", label: "Plan pneumo :", multiline: true },
  ],
  gastroenterology: [
    { key: "abdominal_pain_site", label: "Site douleur abdominale :" },
    { key: "bowel_habits", label: "Transit :", multiline: true },
    { key: "digestive_red_flags", label: "Signes d'alerte digestifs :" },
    { key: "abdominal_exam", label: "Examen abdominal :", multiline: true },
    { key: "gastro_plan", label: "Plan gastro :", multiline: true },
  ],
  analyses_medicales: [
    { key: "order_priority", label: "Priorite demande :" },
    { key: "clinical_context", label: "Contexte clinique :", multiline: true },
    { key: "requested_tests", label: "Tests demandes :", multiline: true },
    { key: "sample_type", label: "Type de prelevement :" },
    { key: "lab_comments", label: "Commentaires labo :", multiline: true },
  ],
};

const SPECIALTY_TREATMENT_FIELDS: Record<SpecialtyKey, ParameterField[]> = {
  general_medicine: [
    { key: "treatment_goal", label: "Objectif therapeutique :" },
    { key: "prescribed_medication", label: "Traitement prescrit :", multiline: true },
    { key: "dosage_plan", label: "Posologie / ajustement :" },
    { key: "procedure_done", label: "Acte realise :" },
    { key: "patient_instructions", label: "Consignes patient :", multiline: true },
    { key: "follow_up_window", label: "Delai de suivi :" },
  ],
  cardiology: [
    { key: "treatment_goal", label: "Objectif clinique :" },
    { key: "medication_adjustment", label: "Ajustement therapeutique :", multiline: true },
    { key: "rhythm_control_plan", label: "Controle rythme / TA :" },
    { key: "anticoagulation_status", label: "Anticoagulation / antiagregants :" },
    { key: "procedure_done", label: "Acte ou exploration prevue :" },
    { key: "follow_up_window", label: "Controle cardio :" },
  ],
  dermatology: [
    { key: "treatment_focus", label: "Cible du traitement :" },
    { key: "topical_or_systemic", label: "Topique / systemique :" },
    { key: "biopsy_or_test", label: "Biopsie / examen complementaire :" },
    { key: "skin_care_instructions", label: "Conseils de soins cutanes :", multiline: true },
    { key: "review_interval", label: "Reevaluation :" },
  ],
  gynecology: [
    { key: "care_path", label: "Orientation de prise en charge :" },
    { key: "pregnancy_support", label: "Traitement / supplementation :" },
    { key: "procedure_done", label: "Acte realise :" },
    { key: "safety_advice", label: "Consignes de securite :", multiline: true },
    { key: "follow_up_window", label: "Suivi gyneco / obstetrique :" },
  ],
  orthopedics: [
    { key: "immobilization", label: "Immobilisation / support :" },
    { key: "analgesia_plan", label: "Antalgie / anti-inflammatoires :" },
    { key: "rehab_program", label: "Kine / reeducation :", multiline: true },
    { key: "weight_bearing_status", label: "Appui autorise :" },
    { key: "review_interval", label: "Controle orthopedique :" },
  ],
  dentistry: [
    { key: "treatment_focus", label: "Type de soin dentaire :" },
    { key: "treated_area", label: "Zone traitee :" },
    { key: "procedure_done", label: "Acte realise :" },
    { key: "material_used", label: "Materiau / dispositif :" },
    { key: "next_visit_goal", label: "Objectif prochaine seance :" },
    { key: "oral_hygiene_advice", label: "Conseils d'hygiene :", multiline: true },
  ],
  pediatrics: [
    { key: "treatment_goal", label: "Objectif de prise en charge :" },
    { key: "weight_based_plan", label: "Traitement dose selon poids :" },
    { key: "parent_guidance", label: "Conseils aux parents :", multiline: true },
    { key: "follow_up_window", label: "Suivi pediatrique :" },
  ],
  endocrinology_diabetes: [
    { key: "glycemic_target", label: "Objectif glycemique :" },
    { key: "therapy_adjustment", label: "Ajustement insulinotherapie / ADO :" },
    { key: "nutrition_advice", label: "Conseils nutritionnels :", multiline: true },
    { key: "follow_up_window", label: "Controle biologique :" },
  ],
  ent: [
    { key: "target_region", label: "Region cible :" },
    { key: "medical_or_local_care", label: "Traitement medical / local :" },
    { key: "hearing_or_imaging_request", label: "Bilan / imagerie :" },
    { key: "follow_up_window", label: "Suivi ORL :" },
  ],
  ophthalmology: [
    { key: "treatment_goal", label: "Objectif ophtalmologique :" },
    { key: "drops_or_correction", label: "Collyres / correction :" },
    { key: "procedure_done", label: "Acte / examen prevu :" },
    { key: "follow_up_window", label: "Controle ophtalmo :" },
  ],
  pulmonology: [
    { key: "bronchodilator_plan", label: "Bronchodilatateurs / traitement :" },
    { key: "oxygen_support", label: "Oxygenotherapie :" },
    { key: "respiratory_education", label: "Education respiratoire :", multiline: true },
    { key: "follow_up_window", label: "Suivi pneumo :" },
  ],
  gastroenterology: [
    { key: "treatment_goal", label: "Objectif digestif :" },
    { key: "dietary_adjustment", label: "Mesures dietetiques :" },
    { key: "procedure_done", label: "Exploration / acte prevu :" },
    { key: "follow_up_window", label: "Controle gastro :" },
  ],
  analyses_medicales: [
    { key: "order_priority", label: "Priorite d'execution :" },
    { key: "sample_type", label: "Prelevement attendu :" },
    { key: "turnaround_expectation", label: "Delai de rendu souhaite :" },
    { key: "lab_comments", label: "Consignes labo :", multiline: true },
  ],
};

const DEFAULT_TREATMENT_OPTIONS: TreatmentOption[] = [
  { key: "follow_up_treatment", label: "Suivi medical", icon: "clipboard-pulse-outline", description: "Surveillance, adaptation du traitement et recontrole." },
  { key: "medication_adjustment", label: "Ajustement", icon: "pill", description: "Modification therapeutique ou renouvellement." },
  { key: "procedure", label: "Procedure", icon: "needle", description: "Acte, geste technique ou exploration programmee." },
  { key: "patient_education", label: "Education", icon: "account-heart-outline", description: "Conseils patient et mesures d'hygiene de vie." },
];

const SPECIALTY_TREATMENT_OPTIONS: Partial<Record<SpecialtyKey, TreatmentOption[]>> = {
  cardiology: [
    { key: "hemodynamic_follow_up", label: "Suivi hemodynamique", icon: "heart-pulse", description: "TA, FC et tolerance clinique." },
    { key: "therapy_adjustment", label: "Traitement cardio", icon: "pill-multiple", description: "Ajustement du traitement cardiovasculaire." },
    { key: "cardiac_workup", label: "Bilan cardiaque", icon: "heart-cog", description: "ECG, echo ou exploration complementaire." },
    { key: "urgent_referral", label: "Orientation rapide", icon: "ambulance", description: "Escalade urgente ou avis specialise." },
  ],
  dermatology: [
    { key: "topical_care", label: "Soin topique", icon: "medical-bag", description: "Creme, antiseptique ou traitement local." },
    { key: "systemic_treatment", label: "Traitement systemique", icon: "pill", description: "Prescription orale ou injectable." },
    { key: "biopsy_follow_up", label: "Biopsie / bilan", icon: "microscope", description: "Prelevement ou examens complementaires." },
    { key: "skin_monitoring", label: "Surveillance", icon: "image-search-outline", description: "Photographie, evolution et controle." },
  ],
  gynecology: [
    { key: "routine_follow_up", label: "Suivi gyneco", icon: "calendar-heart", description: "Controle gynecologique ou obstetrique." },
    { key: "pregnancy_support", label: "Support grossesse", icon: "baby-face-outline", description: "Supplementation, conseils et surveillance." },
    { key: "procedure", label: "Acte gyneco", icon: "needle", description: "Soin, examen ou geste programme." },
    { key: "red_flag_referral", label: "Orientation urgente", icon: "alert-circle-outline", description: "Prise en charge rapide selon signes d'alerte." },
  ],
  orthopedics: [
    { key: "pain_control", label: "Controle douleur", icon: "arm-flex", description: "Antalgie et soulagement fonctionnel." },
    { key: "immobilization", label: "Immobilisation", icon: "bandage", description: "Attelle, orthese ou support." },
    { key: "rehab", label: "Reeducation", icon: "run-fast", description: "Kine et reprise fonctionnelle." },
    { key: "procedure", label: "Acte ortho", icon: "bone", description: "Infiltration, ponction ou geste cible." },
  ],
  dentistry: [
    { key: "preventive_care", label: "Soin preventif", icon: "toothbrush", description: "Detartrage, hygiene et prevention." },
    { key: "restorative_care", label: "Soin restaurateur", icon: "tooth-outline", description: "Obturation, reconstruction ou reparation." },
    { key: "pain_management", label: "Gestion douleur", icon: "emoticon-sad-outline", description: "Soulagement, temporisation ou urgence." },
    { key: "prosthetic_follow_up", label: "Prothese / controle", icon: "hammer-wrench", description: "Ajustement, prothese ou prochaine seance." },
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
  current_symptoms: "stethoscope",
  history_of_present_illness: "timeline-text-outline",
  working_diagnosis: "clipboard-search-outline",
  follow_up: "calendar-clock-outline",
  palpitations: "heart-flash",
  syncope: "bed-outline",
  riskFactors: "alert-rhombus-outline",
  echoSummary: "heart-cog",
  sizeMm: "ruler",
  color: "palette-outline",
  evolution: "chart-timeline-variant",
  differential: "vector-difference",
  cycleDays: "calendar-range",
  gravidityParity: "human-female-female",
  pelvicExam: "stethoscope",
  ultrasoundSummary: "image-outline",
  neurovascular: "sine-wave",
  diagnosis: "clipboard-check-outline",
  rehabPlan: "run-fast",
  dental_pain_scale: "emoticon-sad-outline",
  treated_area: "tooth-outline",
  oral_exam: "tooth-outline",
  chief_pediatric_complaint: "baby-face-outline",
  pediatric_exam: "baby-carriage",
  family_guidance: "account-group-outline",
  hypoglycemia_risk: "alert-outline",
  foot_check: "foot-print",
  ent_exam: "ear-hearing",
  intraocular_pressure: "eye-outline",
  slit_lamp_exam: "flashlight",
  oxygen_saturation: "molecule-co2",
  respiratory_rate: "lungs",
  digestive_red_flags: "stomach",
  sample_type: "test-tube",
  treatment_goal: "target",
  prescribed_medication: "pill",
  dosage_plan: "clock-edit-outline",
  procedure_done: "needle",
  patient_instructions: "account-voice",
  follow_up_window: "calendar-clock-outline",
  medication_adjustment: "pill-multiple",
  rhythm_control_plan: "heart-cog",
  anticoagulation_status: "water-outline",
  treatment_focus: "target",
  topical_or_systemic: "medical-bag",
  biopsy_or_test: "microscope",
  skin_care_instructions: "hand-heart-outline",
  review_interval: "calendar-range",
  care_path: "map-marker-path",
  pregnancy_support: "baby-face-outline",
  safety_advice: "shield-check-outline",
  immobilization: "bandage",
  analgesia_plan: "medical-bag",
  rehab_program: "run-fast",
  weight_bearing_status: "walk",
  material_used: "tools",
  next_visit_goal: "calendar-arrow-right",
  oral_hygiene_advice: "toothbrush",
  weight_based_plan: "scale-balance",
  parent_guidance: "account-child-circle",
  glycemic_target: "target",
  therapy_adjustment: "tune-variant",
  nutrition_advice: "food-apple-outline",
  target_region: "crosshairs-gps",
  medical_or_local_care: "medical-bag",
  hearing_or_imaging_request: "headphones",
  drops_or_correction: "glasses",
  bronchodilator_plan: "spray",
  oxygen_support: "air-filter",
  respiratory_education: "school-outline",
  dietary_adjustment: "food-variant",
  turnaround_expectation: "timer-sand",
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
  return dedupeFields(SPECIALTY_TREATMENT_FIELDS[workspace as SpecialtyKey] ?? SPECIALTY_TREATMENT_FIELDS.general_medicine);
}

export function getConsultationFields(workspace: SpecialtyKey): ParameterField[] {
  const specialtyFields = SPECIALTY_PARAMETER_FIELDS[workspace] ?? [];
  if (!specialtyFields.length) return dedupeFields(GENERIC_PARAMETER_FIELDS);

  const useDefaultCriteria = WORKSPACES_WITH_DEFAULT_CRITERIA.has(workspace);
  const merged = useDefaultCriteria ? [...specialtyFields, ...GENERIC_PARAMETER_FIELDS] : specialtyFields;
  return dedupeFields(merged);
}

export function getTreatmentOptions(workspace: string): TreatmentOption[] {
  return SPECIALTY_TREATMENT_OPTIONS[workspace as SpecialtyKey] ?? DEFAULT_TREATMENT_OPTIONS;
}
