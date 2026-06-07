import { BlueField, MetricCard } from "./_ui";
import { ThemedCard } from "@/components/default_card";
import { WorkspaceFlatTabs, WorkspaceInputField, WorkspaceReadOnlyField } from "@/components/workspaces/theme/WorkspaceTheme";
import { SpecialtyWorkspaceScaffold } from "@/components/workspaces/SpecialtyWorkspaceScaffold";
import { normalizeSpeciality } from "@/config/speciality";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CardiologyState, CardiologyTab } from "./observation_specialities/_cardiologie";
import { DentistryState, DentistryTab } from "./observation_specialities/_dentistry";
import { DermatologyState, DermatologyTab } from "./observation_specialities/_dermatologie";
import { GynecologyState, GynecologyTab } from "./observation_specialities/_gynecologie";
import { OrthopedicsState, OrthopedicsTab } from "./observation_specialities/_orthopedie";



/**
 * Observation tab updated to match the screenshots/video:
 * - Flat sub-tabs (left + right)
 * - "MODIFIER ÉTIQUETTE" opens "ÉTIQUETTE CONSULTATION" modal
 * - "MODIFIER ANTÉCÉDENTS" opens "MODIFIER LE PATIENT" modal
 * - "Étiquettes précédentes" displays a table + search + pagination
 * - "Paramètres précédents" shows selectable visit list and fills read-only parameters
 *
 * NOTE:
 * - Internal keys are in English
 * - Visible labels are in French
 * - Comments in English
 */

/* ==========================
   Sub-tab definitions
========================== */

type SpecialtyKey =
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

type LeftTabKey =
  | "label"
  | "history_comment"
  | "previous_labels"
  | SpecialtyKey;

type MainPageKey = "workspace" | "current_parameters" | "previous_parameters";

// Dynamic: specialty subtabs depend on the doctor's speciality.
const BASE_LEFT_TABS: Array<{ key: Exclude<LeftTabKey, SpecialtyKey>; label: string }> = [
  { key: "label", label: "Étiquette" },
  { key: "history_comment", label: "Antécédents et Commentaire" },
  { key: "previous_labels", label: "Étiquettes précédentes" },
];

const SPECIALTY_TABS: Array<{
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
const MAIN_PAGE_TABS: Array<{
  key: MainPageKey;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}> = [
  { key: "workspace", label: "Workspace Page", icon: "stethoscope" },
  { key: "current_parameters", label: "Current Parameters", icon: "clipboard-text-outline" },
  { key: "previous_parameters", label: "Parameters History", icon: "history" },
];

/* ==========================
   Prototypes (you can wire to API later)
========================== */

type PreviousLabelRow = {
  date: string;
  taille: string;
  poids: string;
  tension: string;
  temp: string;
  observation: string;
};

type PreviousParamsRow = {
  visitLabel: string;
  data: Record<string, string>;
};

type ParameterField = {
  key: string;
  label: string;
  multiline?: boolean;
};

const PROTO_PREVIOUS_LABELS: PreviousLabelRow[] = [
  { date: "31.05.2022", taille: "175", poids: "74", tension: "12/4", temp: "33", observation: "Observation text" },
  { date: "28.04.2022", taille: "175", poids: "86", tension: "11/5", temp: "36", observation: "Observation text" },
  { date: "10.04.2022", taille: "175", poids: "85", tension: "11/5", temp: "37", observation: "Observation text" },
  { date: "04.04.2022", taille: "175", poids: "84", tension: "10/4", temp: "36", observation: "Observation text" },
  { date: "21.03.2022", taille: "175", poids: "81", tension: "12/4", temp: "36", observation: "Observation text" },
  { date: "17.03.2022", taille: "175", poids: "80", tension: "12/4", temp: "36", observation: "observation text" },
];

const PROTO_PREVIOUS_PARAMS: PreviousParamsRow[] = [
  {
    visitLabel: "N de visite : 6 - 31.05.2022",
    data: {
      motif_consultation: "Motif de consultation text",
      glycemie: "0.6g/L",
      hba1c: "6%",
      examen_clinique: "Examen clinique text",
      conclusion: "Conclusion text",
    },
  },
  { visitLabel: "N de visite : 5 - 28.04.2022", data: {} },
  { visitLabel: "N de visite : 4 - 10.04.2022", data: {} },
  { visitLabel: "N de visite : 3 - 04.04.2022", data: {} },
  { visitLabel: "N de visite : 2 - 21.03.2022", data: {} },
  { visitLabel: "N de visite : 1 - 17.03.2022", data: {} },
];

const GENERIC_PARAMETER_FIELDS: ParameterField[] = [
  { key: "motif_consultation", label: "Motif de consultation :" },
  { key: "glycemie", label: "Glycemie :" },
  { key: "hba1c", label: "HbA1c :" },
  { key: "examen_clinique", label: "Examen clinique :", multiline: true },
  { key: "conclusion", label: "Conclusion :", multiline: true },
];

const SPECIALTY_PARAMETER_FIELDS: Record<SpecialtyKey, ParameterField[]> = {
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

const FIELD_ICON_MAP: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  taille_cm: "human-male-height",
  poids_kg: "scale",
  tension: "heart-pulse",
  temperature_c: "thermometer",
  motif_consultation: "text-box-outline",
  glycemie: "test-tube",
  hba1c: "chart-line",
  examen_clinique: "stethoscope",
  conclusion: "clipboard-check-outline",
  bloodPressure: "heart-pulse",
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

  // Semantic groups for fields that are effectively the same criterion.
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
  return fields.filter((f) => {
    const key = String(f.key ?? "").trim().toLowerCase();
    const label = normalizeFieldLabel(f.label);
    const meaning = fieldMeaningToken(f);
    if (!key && !label) return false;
    if (seenKeys.has(key) || seenLabels.has(label)) return false;
    if (meaning && seenMeaning.has(meaning)) return false;
    seenKeys.add(key);
    seenLabels.add(label);
    if (meaning) seenMeaning.add(meaning);
    return true;
  });
}

function getTreatmentExtraFields(workspace: string): ParameterField[] {
  return dedupeFields(SPECIALTY_PARAMETER_FIELDS[workspace as SpecialtyKey] ?? []);
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

function getConsultationFields(workspace: SpecialtyKey): ParameterField[] {
  const specialtyFields = SPECIALTY_PARAMETER_FIELDS[workspace] ?? [];
  if (!specialtyFields.length) return dedupeFields(GENERIC_PARAMETER_FIELDS);

  const useDefaultCriteria = WORKSPACES_WITH_DEFAULT_CRITERIA.has(workspace);
  // Put specialty fields first so when a default and specialty field share the same meaning,
  // the specialty wording is kept for that workspace.
  const merged = useDefaultCriteria ? [...specialtyFields, ...GENERIC_PARAMETER_FIELDS] : specialtyFields;
  return dedupeFields(merged);
}
/* ==========================
   Main component
========================== */

export default function ObservationMedicalTab({
  theme,
  doctorSpeciality,
  vitals,
  setVitals,
  parameters,
  setParameters,
  observations,
  setObservations,
  onSave,
  workspaceMode,
  initialLeftTab,
  workspaceKey,
}: any) {
  const styles = createStyles(theme);

  const isSpecialtyTab = (k: string): k is SpecialtyKey => SPECIALTY_TABS.some((x) => x.key === (k as SpecialtyKey));

  const doctorSpecialtyKey = React.useMemo<SpecialtyKey>(() => {
    const normalized = normalizeSpeciality(doctorSpeciality ?? null);
    return isSpecialtyTab(normalized) ? normalized : "general_medicine";
  }, [doctorSpeciality]);

  const enabledSpecialties = React.useMemo(() => SPECIALTY_TABS, []);
  const [workspacePickerOpen, setWorkspacePickerOpen] = React.useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<SpecialtyKey>(doctorSpecialtyKey);

  React.useEffect(() => {
    setSelectedWorkspace((workspaceKey as SpecialtyKey) || doctorSpecialtyKey);
  }, [doctorSpecialtyKey, workspaceKey]);

  const leftTabs = React.useMemo(() => {
    const specialtyOnly =
      !!workspaceMode
        ? [{ key: selectedWorkspace as LeftTabKey, label: enabledSpecialties.find((x) => x.key === selectedWorkspace)?.label ?? "Workspace" }]
        : null;

    return specialtyOnly ?? [
      ...BASE_LEFT_TABS,
      ...enabledSpecialties.map((x) => ({ key: x.key as LeftTabKey, label: x.label })),
    ];
  }, [enabledSpecialties, workspaceMode, selectedWorkspace]);

  const mainTabs = React.useMemo(() => {
    if (workspaceMode) {
      return MAIN_PAGE_TABS.filter((tab) => tab.key === "workspace");
    }
    return MAIN_PAGE_TABS;
  }, [workspaceMode]);

  const [leftTab, setLeftTab] = React.useState<LeftTabKey>(() => {
    if (typeof initialLeftTab === "string") return initialLeftTab as any;
    if (workspaceMode) return selectedWorkspace as any;
    return "label";
  });
  React.useEffect(() => {
    if (workspaceMode) setLeftTab(selectedWorkspace as LeftTabKey);
  }, [workspaceMode, selectedWorkspace]);
  const [mainPage, setMainPage] = React.useState<MainPageKey>("workspace");

  // Modals
  const [labelModalOpen, setLabelModalOpen] = React.useState(false);
  const [antecedentsModalOpen, setAntecedentsModalOpen] = React.useState(false);
  const [isEditingCurrentParams, setIsEditingCurrentParams] = React.useState(false);
  const [draftCurrentParams, setDraftCurrentParams] = React.useState<any | null>(null);
  const [previousParamsModalOpen, setPreviousParamsModalOpen] = React.useState(false);

  // Label modal fields (prototype)
  const [labelPrintDate, setLabelPrintDate] = React.useState("31/05/2022");
  const [labelType, setLabelType] = React.useState("Consultation");
  const [lastRulesDate, setLastRulesDate] = React.useState("");
  const [cycleMenstrual, setCycleMenstrual] = React.useState("");

  // Antecedents (prototype fields)
  const [antMed, setAntMed] = React.useState("");
  const [antChir, setAntChir] = React.useState("");
  const [antFam, setAntFam] = React.useState("");
  const [antOther, setAntOther] = React.useState("");
  const [commentaire, setCommentaire] = React.useState("");

  // Previous labels table state
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 6;

  const normalizeDate = (d: string) => d.trim();

  const findPrevIndexByDate = (date: string) => {
    const d = normalizeDate(date);
    // Visit labels contain the date like "N° de visite : 6 - 31.05.2022"
    const idx = PROTO_PREVIOUS_PARAMS.findIndex((p) => p.visitLabel.includes(d));
    return idx >= 0 ? idx : 0;
  };

  const filteredLabels = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PROTO_PREVIOUS_LABELS;
    return PROTO_PREVIOUS_LABELS.filter((r) =>
      [r.date, r.taille, r.poids, r.tension, r.temp, r.observation].some((x) =>
        String(x).toLowerCase().includes(q)
      )
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredLabels.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filteredLabels.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  // Previous parameters selection (right tab)
  const [selectedPrevIndex, setSelectedPrevIndex] = React.useState(0);
  const selectedPrev = PROTO_PREVIOUS_PARAMS[selectedPrevIndex];
  const activeSpecialtyKey = React.useMemo<SpecialtyKey | null>(() => {
    if (workspaceMode) return selectedWorkspace;
    if (isSpecialtyTab(leftTab)) return leftTab;
    return null;
  }, [workspaceMode, selectedWorkspace, leftTab]);
  const parameterFields = React.useMemo<ParameterField[]>(
    () => (activeSpecialtyKey ? SPECIALTY_PARAMETER_FIELDS[activeSpecialtyKey] ?? GENERIC_PARAMETER_FIELDS : GENERIC_PARAMETER_FIELDS),
    [activeSpecialtyKey]
  );

  const openLabelModal = () => setLabelModalOpen(true);

  const openAntecedentsModal = () => setAntecedentsModalOpen(true);


  type SpecialitiesState = {
    gynecology: GynecologyState;
    cardiology: CardiologyState;
    dermatology: DermatologyState;
    orthopedics: OrthopedicsState;
    dentistry: DentistryState;
  };

  const [specialities, setSpecialities] = React.useState<SpecialitiesState>({
    gynecology: {},
    cardiology: {},
    dermatology: {},
    orthopedics: {},
    dentistry: {},
  });

  const [workspaceTab, setWorkspaceTab] = React.useState<"treatment" | "consultation_history">("treatment");
  const [treatmentType, setTreatmentType] = React.useState("follow_up_treatment");
  const [treatmentNote, setTreatmentNote] = React.useState("");
  const [treatmentExtra, setTreatmentExtra] = React.useState<Record<string, string>>({});
  const [treatmentHistory, setTreatmentHistory] = React.useState<
    Array<{
      id: string;
      type: string;
      note: string;
      createdAt: string;
      workspace: string;
      extra?: Record<string, string>;
      specialtySnapshot?: any;
    }>
  >([]);
  const [treatmentCreateOpen, setTreatmentCreateOpen] = React.useState(false);
  const [treatmentViewId, setTreatmentViewId] = React.useState<string | null>(null);
  const [consultationCreateOpen, setConsultationCreateOpen] = React.useState(false);
  const [consultationDraft, setConsultationDraft] = React.useState<Record<string, string>>({});
  const [treatmentModalTab, setTreatmentModalTab] = React.useState<"core" | "specialty">("core");
  const [consultationModalTab, setConsultationModalTab] = React.useState<"fields" | "specialty">("fields");
  const [treatmentViewTab, setTreatmentViewTab] = React.useState<"core" | "specialty">("core");

  const workspaceMeta: Record<string, { title: string; subtitle: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }> = {
    general_medicine: { title: "General Medicine Workspace", subtitle: "General consultation workflow.", icon: "stethoscope" },
    cardiology: { title: "Cardiology Workspace", subtitle: "Cardiac symptoms and follow-up.", icon: "heart-pulse" },
    dermatology: { title: "Dermatology Workspace", subtitle: "Skin-focused observation workflow.", icon: "face-man-profile" },
    orthopedics: { title: "Orthopedics Workspace", subtitle: "Functional and pain assessment workflow.", icon: "bone" },
    dentistry: { title: "Dentistry Workspace", subtitle: "Dental treatment and follow-up workflow.", icon: "tooth-outline" },
    gynecology: { title: "Gynecology Workspace", subtitle: "Gynecology and obstetrics workflow.", icon: "human-female" },
    pediatrics: { title: "Pediatrics Workspace", subtitle: "Pediatric assessment workflow.", icon: "baby-face-outline" },
    endocrinology_diabetes: { title: "Endocrinology Workspace", subtitle: "Diabetes and endocrine follow-up.", icon: "chart-line" },
    ent: { title: "ENT Workspace", subtitle: "Ear, nose and throat workflow.", icon: "ear-hearing" },
    ophthalmology: { title: "Ophthalmology Workspace", subtitle: "Vision and eye exam workflow.", icon: "eye-outline" },
    pulmonology: { title: "Pulmonology Workspace", subtitle: "Respiratory follow-up workflow.", icon: "lungs" },
    gastroenterology: { title: "Gastroenterology Workspace", subtitle: "Digestive system follow-up workflow.", icon: "stomach" },
    analyses_medicales: { title: "Analyses Medicales Workspace", subtitle: "Lab request and result workflow.", icon: "flask-outline" },
  };

  const meta = workspaceMeta[selectedWorkspace] ?? workspaceMeta.general_medicine;
  const activeFields = React.useMemo(() => getConsultationFields(selectedWorkspace), [selectedWorkspace]);
  const treatmentOptionsBySpecialty: Record<string, Array<{ key: string; label: string }>> = {
    dentistry: [
      { key: "full_cleanup", label: "Full Cleanup" },
      { key: "braces", label: "Braces" },
      { key: "whitening", label: "Whitening" },
      { key: "retainer_check", label: "Retainer Check" },
      { key: "other_treatment", label: "Other Treatment" },
    ],
    default: [
      { key: "follow_up_treatment", label: "Follow-up treatment" },
      { key: "medication_adjustment", label: "Medication adjustment" },
      { key: "procedure", label: "Procedure" },
      { key: "other", label: "Other" },
    ],
  };
  const treatmentOptions = treatmentOptionsBySpecialty[selectedWorkspace] ?? treatmentOptionsBySpecialty.default;
  const treatmentTypeLabel = (key: string) => treatmentOptions.find((t) => t.key === key)?.label || key;
  const hasSpecialtyWidgetTab = ["gynecology", "cardiology", "dermatology", "orthopedics", "dentistry"].includes(selectedWorkspace);
  const renderSpecialtyDialogPanel = () => {
    if (selectedWorkspace === "gynecology") {
      return <GynecologyTab theme={theme} onModifyLabel={openLabelModal} value={specialities.gynecology} onChange={(next) => setSpecialities((prev) => ({ ...prev, gynecology: next }))} />;
    }
    if (selectedWorkspace === "cardiology") {
      return <CardiologyTab theme={theme} value={specialities.cardiology} onChange={(next) => setSpecialities((prev) => ({ ...prev, cardiology: next }))} />;
    }
    if (selectedWorkspace === "dermatology") {
      return <DermatologyTab theme={theme} value={specialities.dermatology} onChange={(next) => setSpecialities((prev) => ({ ...prev, dermatology: next }))} />;
    }
    if (selectedWorkspace === "orthopedics") {
      return <OrthopedicsTab theme={theme} value={specialities.orthopedics} onChange={(next) => setSpecialities((prev) => ({ ...prev, orthopedics: next }))} />;
    }
    if (selectedWorkspace === "dentistry") {
      return <DentistryTab theme={theme} value={specialities.dentistry} onChange={(next) => setSpecialities((prev) => ({ ...prev, dentistry: next }))} />;
    }
    return null;
  };
  React.useEffect(() => {
    if (!treatmentOptions.some((t) => t.key === treatmentType)) {
      setTreatmentType(treatmentOptions[0]?.key ?? "follow_up_treatment");
    }
  }, [treatmentOptions, treatmentType]);

  if (workspaceMode) {
    return (
      <View style={styles.singlePaneWrap}>
        <View>
            <WorkspaceFlatTabs
              theme={theme}
              tabs={[
                { key: "treatment", label: "Treatment", icon: "medical-bag" },
                { key: "consultation_history", label: "Consultation History", icon: "history" },
              ]}
              activeKey={workspaceTab}
              onChange={setWorkspaceTab}
            />

            {workspaceTab === "treatment" && (
              <View style={{ marginTop: 10, paddingBottom: 14 }}>
                <View style={{ marginBottom: 12, flexDirection: "row", justifyContent: "flex-end" }}>
                  <TouchableOpacity
                    onPress={() => {
                      setTreatmentModalTab("core");
                      setTreatmentCreateOpen(true);
                    }}
                    style={{ backgroundColor: theme.colors.info, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 }}
                  >
                    <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary, fontSize: 12 }}>+ New Treatment</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, overflow: "hidden" }}>
                  {(treatmentHistory.length ? treatmentHistory : [
                    { id: "seed-1", type: "follow_up_treatment", note: "Initial treatment session.", createdAt: "Session #1 - Recent", workspace: "general_medicine" },
                  ]).map((row, idx) => (
                    <View key={row.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, backgroundColor: idx === 0 ? theme.colors.primarySoft : theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                      <View style={{ width: 6, height: 22, borderRadius: 6, marginRight: 10, backgroundColor: idx === 0 ? theme.colors.info : theme.colors.border }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "900", color: theme.colors.text }}>{treatmentTypeLabel(row.type)}</Text>
                        <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>{row.createdAt}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setTreatmentViewTab("core");
                          setTreatmentViewId(row.id);
                        }}
                        style={{ marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 }}
                      >
                        <MaterialCommunityIcons name="eye-outline" size={16} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {workspaceTab === "consultation_history" && (
              <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const seeded: Record<string, string> = {};
                      for (const field of activeFields) {
                        seeded[field.key] = String(parameters?.[field.key] ?? "");
                      }
                      setConsultationDraft(seeded);
                      setConsultationModalTab("fields");
                      setConsultationCreateOpen(true);
                    }}
                    style={{ backgroundColor: theme.colors.info, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 }}
                  >
                    <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary, fontSize: 12 }}>+ New Consultation</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, overflow: "hidden" }}>
                {PROTO_PREVIOUS_PARAMS.map((p, idx) => {
                  const active = idx === selectedPrevIndex;
                  return (
                    <View key={p.visitLabel} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                      <TouchableOpacity onPress={() => setSelectedPrevIndex(idx)} style={{ flex: 1, flexDirection: "row", alignItems: "center" }} activeOpacity={0.8}>
                        <View style={{ width: 6, height: 22, borderRadius: 6, marginRight: 10, backgroundColor: active ? theme.colors.info : theme.colors.border }} />
                        <Text style={{ fontWeight: "900", opacity: active ? 1 : 0.75 }}>{p.visitLabel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setSelectedPrevIndex(idx); setPreviousParamsModalOpen(true); }} style={{ marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 }}>
                        <MaterialCommunityIcons name="eye-outline" size={16} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
                </View>
              </View>
            )}
          </View>

          <PreviousParametersModal
            theme={theme}
            visible={previousParamsModalOpen}
            onClose={() => setPreviousParamsModalOpen(false)}
            row={selectedPrev}
            fields={activeFields}
          />

          <Modal visible={treatmentCreateOpen} transparent animationType="fade" onRequestClose={() => setTreatmentCreateOpen(false)}>
            <View style={{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: "center", justifyContent: "center", padding: 18 }}>
              <View style={[styles.workspaceDialogCard, { maxWidth: 1100 }]}>
                <View style={[styles.workspaceDialogHeader, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ color: theme.colors.textOnPrimary, fontWeight: "900" }}>Add New Treatment</Text>
                </View>
                {(
                  [
                    { key: "core", label: "Treatment form", icon: "clipboard-text-outline" },
                    ...(hasSpecialtyWidgetTab
                      ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const)
                      : []),
                  ] as const
                ).length > 1 ? (
                  <View style={styles.workspaceDialogTabsWrap}>
                    <WorkspaceFlatTabs
                      theme={theme}
                      tabs={[
                        { key: "core", label: "Treatment form", icon: "clipboard-text-outline" },
                        ...(hasSpecialtyWidgetTab
                          ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const)
                          : []),
                      ]}
                      activeKey={treatmentModalTab}
                      onChange={(k: any) => setTreatmentModalTab(k)}
                    />
                  </View>
                ) : null}
                <ScrollView contentContainerStyle={styles.workspaceDialogBody}>
                  {treatmentModalTab === "core" && (
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                        {treatmentOptions.map((t) => {
                          const active = treatmentType === t.key;
                          return (
                            <TouchableOpacity
                              key={`modal-${t.key}`}
                              onPress={() => setTreatmentType(t.key)}
                              style={{
                                borderWidth: 1,
                                borderColor: active ? theme.colors.primary : theme.colors.border,
                                backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                                borderRadius: 999,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                              }}
                            >
                              <Text style={{ fontWeight: "900", color: active ? theme.colors.primary : theme.colors.textSecondary, fontSize: 12 }}>
                                {t.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <WorkspaceInputField theme={theme} label="Treatment note :" value={treatmentNote} onChange={setTreatmentNote} multiline icon="notebook-edit-outline" />
                      {getTreatmentExtraFields(selectedWorkspace).map((f) => (
                        <WorkspaceInputField
                          key={`treatment-extra-${selectedWorkspace}-${f.key}`}
                          theme={theme}
                          label={f.label}
                          value={treatmentExtra[f.key] ?? ""}
                          onChange={(v) => setTreatmentExtra((s) => ({ ...s, [f.key]: v }))}
                          multiline={!!f.multiline}
                          icon={FIELD_ICON_MAP[f.key] ?? "file-document-edit-outline"}
                        />
                      ))}
                    </View>
                  )}

                  {hasSpecialtyWidgetTab && treatmentModalTab === "specialty" && (
                    <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.background, padding: 8 }}>
                      {renderSpecialtyDialogPanel()}
                    </View>
                  )}
                </ScrollView>
                <View style={styles.workspaceDialogFooter}>
                  <TouchableOpacity onPress={() => setTreatmentCreateOpen(false)} style={{ backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setTreatmentHistory((rows) => [
                        {
                          id: `${Date.now()}`,
                          type: treatmentType,
                          note: treatmentNote.trim(),
                          createdAt: new Date().toLocaleString(),
                          workspace: selectedWorkspace,
                          extra: { ...treatmentExtra },
                          specialtySnapshot:
                            selectedWorkspace === "dentistry"
                              ? { ...specialities.dentistry }
                              : selectedWorkspace === "gynecology"
                              ? { ...specialities.gynecology }
                              : selectedWorkspace === "cardiology"
                              ? { ...specialities.cardiology }
                              : selectedWorkspace === "dermatology"
                              ? { ...specialities.dermatology }
                              : selectedWorkspace === "orthopedics"
                              ? { ...specialities.orthopedics }
                              : null,
                        },
                        ...rows,
                      ]);
                      setTreatmentNote("");
                      setTreatmentExtra({});
                      setTreatmentCreateOpen(false);
                    }}
                    style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
                  >
                    <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary }}>Add treatment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={consultationCreateOpen} transparent animationType="fade" onRequestClose={() => setConsultationCreateOpen(false)}>
            <View style={{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: "center", justifyContent: "center", padding: 18 }}>
              <View style={[styles.workspaceDialogCard, { maxWidth: 1100 }]}>
                <View style={[styles.workspaceDialogHeader, { backgroundColor: theme.colors.info }]}>
                  <Text style={{ color: theme.colors.textOnPrimary, fontWeight: "900" }}>Add New Consultation</Text>
                </View>
                {(
                  [
                    { key: "fields", label: "Consultation fields", icon: "clipboard-text-outline" },
                    ...(hasSpecialtyWidgetTab
                      ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const)
                      : []),
                  ] as const
                ).length > 1 ? (
                  <View style={styles.workspaceDialogTabsWrap}>
                    <WorkspaceFlatTabs
                      theme={theme}
                      tabs={[
                        { key: "fields", label: "Consultation fields", icon: "clipboard-text-outline" },
                        ...(hasSpecialtyWidgetTab
                          ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const)
                          : []),
                      ]}
                      activeKey={consultationModalTab}
                      onChange={(k: any) => setConsultationModalTab(k)}
                    />
                  </View>
                ) : null}
                <ScrollView contentContainerStyle={styles.workspaceDialogBody}>
                  {consultationModalTab === "fields" && (
                    <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                      {activeFields.map((f) => (
                        <View key={`new-consultation-${f.key}`} style={{ flex: 1, minWidth: 220 }}>
                          <WorkspaceInputField
                            theme={theme}
                            label={f.label}
                            value={consultationDraft?.[f.key] ?? ""}
                            onChange={(v) => setConsultationDraft((s) => ({ ...(s ?? {}), [f.key]: v }))}
                            multiline={f.multiline}
                            icon={FIELD_ICON_MAP[f.key] ?? "file-document-edit-outline"}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                  {hasSpecialtyWidgetTab && consultationModalTab === "specialty" && (
                    <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.background, padding: 8 }}>
                      {renderSpecialtyDialogPanel()}
                    </View>
                  )}
                </ScrollView>
                <View style={styles.workspaceDialogFooter}>
                  <TouchableOpacity onPress={() => setConsultationCreateOpen(false)} style={{ backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setParameters((prev: any) => ({ ...prev, ...consultationDraft }));
                      setConsultationCreateOpen(false);
                      onSave?.();
                    }}
                    style={{ backgroundColor: theme.colors.info, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
                  >
                    <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={!!treatmentViewId} transparent animationType="fade" onRequestClose={() => setTreatmentViewId(null)}>
            <View style={{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: "center", justifyContent: "center", padding: 18 }}>
              <View style={[styles.workspaceDialogCard, { maxWidth: 1100 }]}>
                <View style={[styles.workspaceDialogHeader, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ color: theme.colors.textOnPrimary, fontWeight: "900" }}>Treatment View</Text>
                </View>
                {(
                  [
                    { key: "core", label: "Treatment form", icon: "clipboard-text-outline" },
                    ...(hasSpecialtyWidgetTab ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const) : []),
                  ] as const
                ).length > 1 ? (
                  <View style={styles.workspaceDialogTabsWrap}>
                    <WorkspaceFlatTabs
                      theme={theme}
                      tabs={[
                        { key: "core", label: "Treatment form", icon: "clipboard-text-outline" },
                        ...(hasSpecialtyWidgetTab ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const) : []),
                      ]}
                      activeKey={treatmentViewTab}
                      onChange={(k: any) => setTreatmentViewTab(k)}
                    />
                  </View>
                ) : null}
                <ScrollView contentContainerStyle={styles.workspaceDialogBody}>
                  {(() => {
                    const row = (
                      treatmentHistory.length
                        ? treatmentHistory
                        : [{ id: "seed-1", type: "follow_up_treatment", note: "Initial treatment session.", createdAt: "Session #1 - Recent", workspace: "general_medicine" }]
                    ).find((x) => x.id === treatmentViewId) || null;
                    if (!row) return <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>Not found</Text>;
                    return (
                      <>
                        {treatmentViewTab === "core" ? (
                          <View style={{ gap: 8 }}>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                              {(treatmentOptionsBySpecialty[row.workspace] ?? treatmentOptionsBySpecialty.default).map((t) => {
                                const active = row.type === t.key;
                                return (
                                  <View
                                    key={`view-${t.key}`}
                                    style={{
                                      borderWidth: 1,
                                      borderColor: active ? theme.colors.primary : theme.colors.border,
                                      backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                                      borderRadius: 999,
                                      paddingHorizontal: 12,
                                      paddingVertical: 8,
                                    }}
                                  >
                                    <Text style={{ fontWeight: "900", color: active ? theme.colors.primary : theme.colors.textSecondary, fontSize: 12 }}>{t.label}</Text>
                                  </View>
                                );
                              })}
                            </View>
                            <WorkspaceReadOnlyField theme={theme} label="Treatment note :" value={row.note || "-"} multiline icon="notebook-outline" />
                            {getTreatmentExtraFields(row.workspace)
                              .filter((f) => row.extra?.[f.key])
                              .map((f) => (
                                <WorkspaceReadOnlyField
                                  key={`view-extra-${row.id}-${f.key}`}
                                  theme={theme}
                                  label={f.label}
                                  value={String(row.extra?.[f.key] ?? "-")}
                                  multiline={!!f.multiline}
                                  icon={FIELD_ICON_MAP[f.key] ?? "file-document-outline"}
                                />
                              ))}
                          </View>
                        ) : hasSpecialtyWidgetTab ? (
                          <View pointerEvents="none" style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.background, padding: 8 }}>
                            {row.workspace === "gynecology" ? (
                              <GynecologyTab theme={theme} onModifyLabel={() => {}} value={row.specialtySnapshot || {}} onChange={() => {}} />
                            ) : row.workspace === "cardiology" ? (
                              <CardiologyTab theme={theme} value={row.specialtySnapshot || {}} onChange={() => {}} />
                            ) : row.workspace === "dermatology" ? (
                              <DermatologyTab theme={theme} value={row.specialtySnapshot || {}} onChange={() => {}} />
                            ) : row.workspace === "orthopedics" ? (
                              <OrthopedicsTab theme={theme} value={row.specialtySnapshot || {}} onChange={() => {}} />
                            ) : row.workspace === "dentistry" ? (
                              <DentistryTab theme={theme} value={row.specialtySnapshot || {}} onChange={() => {}} />
                            ) : null}
                          </View>
                        ) : null}
                      </>
                    );
                  })()}
                </ScrollView>
                <View style={[styles.workspaceDialogFooter, { justifyContent: "flex-end" }]}>
                  <TouchableOpacity onPress={() => setTreatmentViewId(null)} style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
      </View>
    );
  }


  return (
    <View style={styles.singlePaneWrap}>
      <ThemedCard>
        <WorkspaceFlatTabs
          theme={theme}
          tabs={mainTabs}
          activeKey={mainPage}
          onChange={setMainPage}
        />

      {mainPage === "workspace" && (
      <>
        {workspaceMode && (
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => setWorkspacePickerOpen(true)}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 9,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MaterialCommunityIcons name="stethoscope" size={14} color={theme.colors.primary} />
              <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>
                {enabledSpecialties.find((x) => x.key === selectedWorkspace)?.label ?? "Workspace"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Workspace sub-tabs */}
        {(!workspaceMode || leftTabs.length > 1) && (
          <WorkspaceFlatTabs
            theme={theme}
            tabs={leftTabs}
            activeKey={leftTab}
            onChange={setLeftTab}
          />
        )}



    {/* Étiquette (1st tab) — now shows the metric cards UI */}
    {leftTab === "label" && (
      
      <View style={{ gap: 12 }}>
                {/* Header info row */}
        <View style={styles.metaRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.metaLine}>N° de consultation : 1436</Text>
            <Text style={styles.metaLine}>Date d&apos;Impression : 31.05.2022</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.metaLine}>N° de visite : 6</Text>
            <Text style={styles.metaLine}>Type : Consultation</Text>
          </View>

          {/* Button changes meaning depending on active left tab (like the video) */}
          
            <TouchableOpacity style={styles.yellowBtn} onPress={openLabelModal}>
              <Text style={styles.yellowBtnText}>MODIFIER ÉTIQUETTE</Text>
            </TouchableOpacity>
          
        </View>
        {/* Vitals quick cards */}
        <View style={styles.grid2}>
          <MetricCard theme={theme} icon="resize-outline" label="Taille (Cm)" value={vitals.taille_cm || "-"} />
          <MetricCard theme={theme} icon="scale-outline" label="Poids (Kg)" value={vitals.poids_kg || "-"} />
          <MetricCard theme={theme} icon="heart-outline" label="Tension" value={vitals.tension || "-"} />
          <MetricCard theme={theme} icon="thermometer-outline" label="Température (°C)" value={vitals.temperature_c || "-"} />
        </View>

        {/* Observation free text */}
        <BlueField
          theme={theme}
          label="Observation"
          value={observations}
          onChange={setObservations}
          multiline
          minHeight={110}
        />

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Étiquette</Text>
          <Text style={styles.noteText}>
            (Prototype) Add more label/summary fields from your backend here.
          </Text>
        </View>
      </View>
    )}


        {leftTab === "history_comment" && (
          <View style={{ gap: 12 }}>
                    {/* Header info row */}
        <View style={styles.metaRow}>
            <View style={{ flex: 1 }}/>

          
            <TouchableOpacity style={styles.yellowBtn} onPress={openAntecedentsModal}>
              <Text style={styles.yellowBtnText}>MODIFIER ANTÉCÉDENTS</Text>
            </TouchableOpacity>
          
        </View>

            {/* This matches the 4 boxes + Commentaire layout in the screenshot */}
            <View style={styles.antecedentsGrid}>
              <BorderBox theme={theme} title="Antécédents Médicaux" value={antMed || "-"} />
              <BorderBox theme={theme} title="Antécédents Chirurgicaux" value={antChir || "-"} />
              <BorderBox theme={theme} title="Antécédents Familiaux" value={antFam || "-"} />
              <BorderBox theme={theme} title="Antécédents - Autres" value={antOther || "-"} />
            </View>

            <BorderBox theme={theme} title="Commentaire" value={commentaire || "-"} large />
          </View>
        )}

        {leftTab === "previous_labels" && (
          <View style={{ gap: 10 }}>
            {/* Search row like screenshot */}
            <View style={styles.searchRow}>
              <Text style={styles.searchLabel}>Rechercher :</Text>
              <TextInput
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  setPage(1);
                }}
                placeholder=""
                style={[styles.searchInput, { backgroundColor: theme.colors.background }]}
              />
            </View>

            {/* Table header */}
            <View style={[styles.tableHeader, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.th, { flex: 1.2 }]}>DATE</Text>
              <Text style={[styles.th, { flex: 1 }]}>TAILLE</Text>
              <Text style={[styles.th, { flex: 1 }]}>POIDS</Text>
              <Text style={[styles.th, { flex: 1 }]}>TENSION</Text>
              <Text style={[styles.th, { flex: 0.9 }]}>TEMP</Text>
              <Text style={[styles.th, { flex: 2.2 }]}>OBSERVATION</Text>
            </View>

            {/* Rows */}
            <View style={styles.tableBody}>
              {pageRows.map((r, idx) => (
                <TouchableOpacity
                  key={`${r.date}-${idx}`}
                  activeOpacity={0.7}
                  onPress={() => {
                    const newIdx = findPrevIndexByDate(r.date);
                    setSelectedPrevIndex(newIdx);
                    setMainPage("previous_parameters");
                  }}
                  style={[
                    styles.tr,
                    { backgroundColor: idx % 2 === 0 ? theme.colors.surfaceVariant : "transparent" },
                  ]}
                >

                  <Text style={[styles.td, { flex: 1.2 }]}>{r.date}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{r.taille}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{r.poids}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{r.tension}</Text>
                  <Text style={[styles.td, { flex: 0.9 }]}>{r.temp}</Text>
                  <Text style={[styles.td, { flex: 2.2 }]} numberOfLines={1}>
                    {r.observation}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer pagination like screenshot */}
            <View style={styles.paginationRow}>
              <Text style={styles.paginationLeft}>
                Affichage de l’élément {Math.min((pageSafe - 1) * pageSize + 1, filteredLabels.length)} à{" "}
                {Math.min(pageSafe * pageSize, filteredLabels.length)} sur {filteredLabels.length} éléments
              </Text>

              <View style={styles.paginationRight}>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  style={styles.pageBtn}
                >
                  <Text style={styles.pageBtnText}>Précédent</Text>
                </TouchableOpacity>

                <View style={styles.pageCircle}>
                  <Text style={styles.pageCircleText}>{pageSafe}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={styles.pageBtn}
                >
                  <Text style={styles.pageBtnText}>Suivant</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}


              {/* Gynécologie */}
      {leftTab === "gynecology" && (
      <GynecologyTab
        theme={theme}
        onModifyLabel={openLabelModal}
        value={specialities.gynecology}
        onChange={(next) => setSpecialities((s) => ({ ...s, gynecology: next }))}
        />
      )}


      {leftTab === "cardiology" && (
      <CardiologyTab
        theme={theme}
        value={specialities.cardiology}
        onChange={(next) => setSpecialities((s) => ({ ...s, cardiology: next }))}
        />
      )}

    {leftTab === "dermatology" && (
      <DermatologyTab
        theme={theme}
        value={specialities.dermatology}
        onChange={(next) => setSpecialities((s) => ({ ...s, dermatology: next }))}
        showTitle={!workspaceMode}
        />
      )}

      {leftTab === "orthopedics" && (
      <OrthopedicsTab
        theme={theme}
        value={specialities.orthopedics}
        onChange={(next) => setSpecialities((s) => ({ ...s, orthopedics: next }))}
        />
      )}

      {leftTab === "dentistry" && (
      <DentistryTab
        theme={theme}
        value={specialities.dentistry}
        onChange={(next) => setSpecialities((s) => ({ ...s, dentistry: next }))}
        />
      )}

      {isSpecialtyTab(leftTab) &&
        leftTab !== "gynecology" &&
        leftTab !== "cardiology" &&
        leftTab !== "dermatology" &&
        leftTab !== "orthopedics" &&
        leftTab !== "dentistry" && (
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Workspace consultation fields</Text>
            <Text style={styles.noteText}>
              This workspace uses dynamic consultation fields below.
            </Text>
            <View style={{ marginTop: 8, flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {(SPECIALTY_PARAMETER_FIELDS[leftTab] ?? GENERIC_PARAMETER_FIELDS).map((f) => (
                <View key={f.key} style={{ flex: 1, minWidth: 220 }}>
                  <WorkspaceReadOnlyField
                    theme={theme}
                    label={f.label}
                    value={String(parameters?.[f.key] ?? "-")}
                    multiline={!!f.multiline}
                    icon={FIELD_ICON_MAP[f.key] ?? "file-document-outline"}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

      </>
      )}

      {mainPage === "current_parameters" && (
      <>
        <View style={styles.rightTopRow}>
          <View style={{ flex: 1 }} />
          {!isEditingCurrentParams ? (
            <TouchableOpacity
              style={styles.yellowBtn}
              onPress={() => {
                setDraftCurrentParams({ ...parameters });
                setIsEditingCurrentParams(true);
              }}
            >
              <Text style={styles.yellowBtnText}>MODIFIER PARAMETRES</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.yellowBtn, { backgroundColor: theme.colors.success }]}
                onPress={() => {
                  if (draftCurrentParams) setParameters(draftCurrentParams);
                  setDraftCurrentParams(null);
                  setIsEditingCurrentParams(false);
                  onSave?.();
                }}
              >
                <Text style={styles.yellowBtnText}>CONFIRMER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.yellowBtn, { backgroundColor: theme.colors.textSecondary }]}
                onPress={() => {
                  setDraftCurrentParams(null);
                  setIsEditingCurrentParams(false);
                }}
              >
                <Text style={styles.yellowBtnText}>ANNULER</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isEditingCurrentParams ? (
          <WorkspaceInputField
            theme={theme}
            label="Motif de consultation :"
            value={draftCurrentParams?.motif_consultation ?? ""}
            onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), motif_consultation: v }))}
            icon={FIELD_ICON_MAP.motif_consultation}
          />
        ) : (
          <WorkspaceReadOnlyField theme={theme} label="Motif de consultation :" value={parameters.motif_consultation || "-"} icon={FIELD_ICON_MAP.motif_consultation} />
        )}

        <View style={styles.row}>
          <View style={styles.paramHalf}>
            {isEditingCurrentParams ? (
              <WorkspaceInputField
                theme={theme}
                label="glycémie :"
                value={draftCurrentParams?.glycemie ?? ""}
                onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), glycemie: v }))}
                icon={FIELD_ICON_MAP.glycemie}
              />
            ) : (
              <WorkspaceReadOnlyField theme={theme} label="glycémie :" value={parameters.glycemie || "-"} icon={FIELD_ICON_MAP.glycemie} />
            )}
          </View>
          <View style={styles.paramHalf}>
            {isEditingCurrentParams ? (
              <WorkspaceInputField
                theme={theme}
                label="HbA1c :"
                value={draftCurrentParams?.hba1c ?? ""}
                onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), hba1c: v }))}
                icon={FIELD_ICON_MAP.hba1c}
              />
            ) : (
              <WorkspaceReadOnlyField theme={theme} label="HbA1c :" value={parameters.hba1c || "-"} icon={FIELD_ICON_MAP.hba1c} />
            )}
          </View>
        </View>

        {isEditingCurrentParams ? (
          <WorkspaceInputField
            theme={theme}
            label="Examen clinique :"
            value={draftCurrentParams?.examen_clinique ?? ""}
            onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), examen_clinique: v }))}
            multiline
            icon={FIELD_ICON_MAP.examen_clinique}
          />
        ) : (
          <WorkspaceReadOnlyField theme={theme} label="Examen clinique :" value={parameters.examen_clinique || "-"} multiline icon={FIELD_ICON_MAP.examen_clinique} />
        )}

        {isEditingCurrentParams ? (
          <WorkspaceInputField
            theme={theme}
            label="Conclusion :"
            value={draftCurrentParams?.conclusion ?? ""}
            onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), conclusion: v }))}
            multiline
            icon={FIELD_ICON_MAP.conclusion}
          />
        ) : (
          <WorkspaceReadOnlyField theme={theme} label="Conclusion :" value={parameters.conclusion || "-"} multiline icon={FIELD_ICON_MAP.conclusion} />
        )}
      </>
      )}

      {mainPage === "previous_parameters" && (
      <>
        <View style={{ marginTop: 10 }}>
          <View style={styles.prevList}>
            {PROTO_PREVIOUS_PARAMS.map((p, idx) => {
              const active = idx === selectedPrevIndex;

              return (
                <View key={p.visitLabel}>
                  <View style={[styles.prevItem, active && styles.prevItemActive]}>
                    <TouchableOpacity onPress={() => setSelectedPrevIndex(idx)} style={styles.prevMainBtn} activeOpacity={0.8}>
                      <View
                        style={[
                          styles.prevBar,
                          { backgroundColor: active ? theme.colors.warning : theme.colors.border },
                        ]}
                      />
                      <Text style={[styles.prevItemText, active && styles.prevItemTextActive]}>
                        {p.visitLabel}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPrevIndex(idx);
                        setPreviousParamsModalOpen(true);
                      }}
                      style={styles.viewBtn}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </>
      )}
      </ThemedCard>

      {/* ================= MODALS ================= */}

      {/* "ÉTIQUETTE CONSULTATION" modal (matches first screenshot) */}
      <LabelModal
        theme={theme}
        visible={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        onSave={() => {
          // Save modal values back to main states (basic mapping).
          // You can extend this later as you add real data fields.
          setLabelModalOpen(false);
        }}
        labelPrintDate={labelPrintDate}
        setLabelPrintDate={setLabelPrintDate}
        labelType={labelType}
        setLabelType={setLabelType}
        vitals={vitals}
        setVitals={setVitals}
        lastRulesDate={lastRulesDate}
        setLastRulesDate={setLastRulesDate}
        cycleMenstrual={cycleMenstrual}
        setCycleMenstrual={setCycleMenstrual}
        observations={observations}
        setObservations={setObservations}
      />


      <PreviousParametersModal
        theme={theme}
        visible={previousParamsModalOpen}
        onClose={() => setPreviousParamsModalOpen(false)}
        row={selectedPrev}
        fields={parameterFields}
      />

      {/* "MODIFIER LE PATIENT" modal (matches the antecedents screenshot) */}
      <AntecedentsModal
        theme={theme}
        visible={antecedentsModalOpen}
        onClose={() => setAntecedentsModalOpen(false)}
        onSave={() => {
          setAntecedentsModalOpen(false);
        }}
        antMed={antMed}
        setAntMed={setAntMed}
        antChir={antChir}
        setAntChir={setAntChir}
        antFam={antFam}
        setAntFam={setAntFam}
        antOther={antOther}
        setAntOther={setAntOther}
        commentaire={commentaire}
        setCommentaire={setCommentaire}
      />

      <Modal visible={workspacePickerOpen} transparent animationType="fade" onRequestClose={() => setWorkspacePickerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: "center", justifyContent: "center", padding: 18 }}>
          <View style={{ width: "100%", maxWidth: 420, borderRadius: 12, overflow: "hidden", backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
            <View style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: theme.colors.primary }}>
              <Text style={{ color: theme.colors.textOnPrimary, fontWeight: "900" }}>Choisir le workspace</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 10, gap: 6, maxHeight: 420 }}>
              {enabledSpecialties.map((item) => {
                const active = item.key === selectedWorkspace;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => {
                      setSelectedWorkspace(item.key);
                      setWorkspacePickerOpen(false);
                    }}
                    style={{
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primarySoft : theme.colors.background,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontWeight: "800", color: theme.colors.text }}>{item.label}</Text>
                    {active ? <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, alignItems: "flex-end" }}>
              <TouchableOpacity onPress={() => setWorkspacePickerOpen(false)} style={{ backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
                <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


/* ==========================
   Helpers for the left label screens
========================== */

function InfoPair({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 180 }}>
      <Text style={{ fontWeight: "900", opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function TimelinePoint({
  theme,
  label,
  date,
  active,
}: {
  theme: any;
  label: string;
  date: string;
  active?: boolean;
}) {
  return (
    <View style={{ alignItems: "center", width: 160 }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          borderWidth: 3,
          borderColor: active ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.textOnPrimary,
          marginBottom: 6,
        }}
      />
      <Text style={{ fontWeight: "900", textAlign: "center", color: theme.colors.primary }}>
        {label}
      </Text>
      <Text style={{ fontWeight: "800", opacity: 0.7, marginTop: 4 }}>{date}</Text>
    </View>
  );
}

function BorderBox({
  theme,
  title,
  value,
  large,
}: {
  theme: any;
  title: string;
  value: string;
  large?: boolean;
}) {
  return (
    <View
      style={{
        borderWidth: 2,
        borderColor: theme.colors.primary + "59",
        borderRadius: 10,
        padding: 12,
        minHeight: large ? 110 : 80,
        flex: 1,
      }}
    >
      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ fontWeight: "900", opacity: 0.65 }}>{value}</Text>
    </View>
  );
}

function PreviousParametersModal({
  theme,
  visible,
  onClose,
  row,
  fields,
}: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: "center", justifyContent: "center", padding: 18 }}>
        <View style={{ width: "100%", maxWidth: 1100, maxHeight: "92%", borderRadius: 12, overflow: "hidden", backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
          <View style={{ paddingVertical: 12, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.info }}>
            <Text style={{ color: theme.colors.textOnPrimary, fontWeight: "900", letterSpacing: 0.5 }}>PARAMETRES PRECEDENTS</Text>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 12 }}>
            <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>{row?.visitLabel || "-"}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {(fields ?? GENERIC_PARAMETER_FIELDS).map((field: ParameterField) => (
                <View key={field.key} style={{ flex: 1, minWidth: field.multiline ? 320 : 230 }}>
                  <WorkspaceReadOnlyField
                    theme={theme}
                    label={field.label}
                    value={String(row?.data?.[field.key] ?? "-")}
                    multiline={!!field.multiline}
                    icon={FIELD_ICON_MAP[field.key] ?? "file-document-outline"}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }}>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 }}>
              <Text style={{ color: theme.colors.textOnPrimary, fontWeight: "900" }}>FERMER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ==========================
   Label modal: "ÉTIQUETTE CONSULTATION"
========================== */

function LabelModal({
  theme,
  visible,
  onClose,
  onSave,
  labelPrintDate,
  setLabelPrintDate,
  labelType,
  setLabelType,
  vitals,
  setVitals,
  lastRulesDate,
  setLastRulesDate,
  cycleMenstrual,
  setCycleMenstrual,
  observations,
  setObservations,
}: any) {
  const styles = createStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Blue modal header like screenshot */}
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.modalHeaderText}>ÉTIQUETTE CONSULTATION</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Row 1: Date d'impression / Type */}
            <View style={styles.modalRow}>
              <ModalField
                theme={theme}
                label="Date D'impression"
                value={labelPrintDate}
                onChange={setLabelPrintDate}
              />
              <ModalField
                theme={theme}
                label="Type"
                value={labelType}
                onChange={setLabelType}
              />
            </View>

            {/* Row 2: Taille / Poids */}
            <View style={styles.modalRow}>
              <ModalField
                theme={theme}
                label="Taille (Cm)"
                value={vitals.taille_cm}
                onChange={(v: string) => setVitals((s: any) => ({ ...s, taille_cm: v }))}
              />
              <ModalField
                theme={theme}
                label="Poids (Kg)"
                value={vitals.poids_kg}
                onChange={(v: string) => setVitals((s: any) => ({ ...s, poids_kg: v }))}
              />
            </View>

            {/* Row 3: Tension / Température */}
            <View style={styles.modalRow}>
              <ModalField
                theme={theme}
                label="Tension"
                value={vitals.tension}
                onChange={(v: string) => setVitals((s: any) => ({ ...s, tension: v }))}
              />
              <ModalField
                theme={theme}
                label="Température (°c)"
                value={vitals.temperature_c}
                onChange={(v: string) => setVitals((s: any) => ({ ...s, temperature_c: v }))}
              />
            </View>

            {/* Gynecology section inside modal (like screenshot) */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Gynécologie</Text>
              <View style={styles.modalRow}>
                <ModalField
                  theme={theme}
                  label="Date des dernières règles"
                  value={lastRulesDate}
                  onChange={setLastRulesDate}
                  placeholder="jj/mm/aaaa"
                />
                <ModalField
                  theme={theme}
                  label="Cycle menstruel"
                  value={cycleMenstrual}
                  onChange={setCycleMenstrual}
                  placeholder="-"
                />
              </View>
            </View>

            {/* Observation */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: "900", opacity: 0.75, marginBottom: 8 }}>
                Observation
              </Text>
              <TextInput
                value={observations}
                onChangeText={setObservations}
                multiline
                style={[
                  styles.modalTextarea,
                  { backgroundColor: theme.colors.background },
                ]}
              />
            </View>
          </ScrollView>

          {/* Footer actions: Annuler / Enregistrer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={onClose} style={styles.modalFooterBtnGhost}>
              <Text style={styles.modalFooterBtnGhostText}>ANNULER</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onSave} style={styles.modalFooterBtnGreen}>
              <Text style={styles.modalFooterBtnGreenText}>ENREGISTRER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ==========================
   Antecedents modal: "MODIFIER LE PATIENT"
========================== */

type PatientModalTabKey = "civil_status" | "history_comment";

const PATIENT_MODAL_TABS: Array<{ key: PatientModalTabKey; label: string }> = [
  { key: "civil_status", label: "Etat Civil" },
  { key: "history_comment", label: "Antécédents et Commentaire" },
];

function AntecedentsModal({
  theme,
  visible,
  onClose,
  onSave,
  antMed,
  setAntMed,
  antChir,
  setAntChir,
  antFam,
  setAntFam,
  antOther,
  setAntOther,
  commentaire,
  setCommentaire,
}: any) {
  const styles = createStyles(theme);
  const [tab, setTab] = React.useState<PatientModalTabKey>("history_comment");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.modalHeaderText}>MODIFIER LE PATIENT</Text>
          </View>

          {/* Top tabs inside modal (Etat Civil / Antécédents...) */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <WorkspaceFlatTabs
              theme={theme}
              tabs={PATIENT_MODAL_TABS}
              activeKey={tab}
              onChange={setTab}
            />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {tab === "civil_status" && (
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>Etat Civil</Text>
                <Text style={styles.noteText}>
                  (Prototype) Add patient civil status fields here (name, DOB, address, etc.).
                </Text>
              </View>
            )}

            {tab === "history_comment" && (
              <>
                <View style={styles.modalRow}>
                  <ModalTextarea theme={theme} label="Antécédents Médicaux :" value={antMed} onChange={setAntMed} />
                  <ModalTextarea theme={theme} label="Antécédents Chirurgicaux :" value={antChir} onChange={setAntChir} />
                </View>

                <View style={styles.modalRow}>
                  <ModalTextarea theme={theme} label="Antécédents Familiaux :" value={antFam} onChange={setAntFam} />
                  <ModalTextarea theme={theme} label="Antécédents - Autres :" value={antOther} onChange={setAntOther} />
                </View>

                <View style={{ marginTop: 12 }}>
                  <ModalTextarea
                    theme={theme}
                    label="Commentaire"
                    value={commentaire}
                    onChange={setCommentaire}
                    large
                  />
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={onClose} style={styles.modalFooterBtnGhost}>
              <Text style={styles.modalFooterBtnGhostText}>ANNULER</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onSave} style={styles.modalFooterBtnGreen}>
              <Text style={styles.modalFooterBtnGreenText}>ENREGISTRER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ==========================
   Modal field helpers
========================== */

function ModalField({
  theme,
  label,
  value,
  onChange,
  placeholder,
}: {
  theme: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={{ flex: 1, minWidth: 240 }}>
      <Text style={{ fontWeight: "900", opacity: 0.75, marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          backgroundColor: theme.colors.textOnPrimary,
          minHeight: 44,
        }}
      />
    </View>
  );
}

function ModalTextarea({
  theme,
  label,
  value,
  onChange,
  large,
}: {
  theme: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  large?: boolean;
}) {
  return (
    <View style={{ flex: 1, minWidth: 240 }}>
      <Text style={{ fontWeight: "900", opacity: 0.75, marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          backgroundColor: theme.colors.textOnPrimary,
          minHeight: large ? 110 : 70,
        }}
      />
    </View>
  );
}

/* ==========================
   Styles
========================== */

const createStyles = (theme: any) =>
  StyleSheet.create({
    singlePaneWrap: {
      width: "100%",
      alignSelf: "stretch",
      gap: 12,
    },
    twoColWrap: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
      width: "100%",        // ✅ important: stretch full width
      alignSelf: "stretch", // ✅ helps on web
    },
    col: {
      flex: 1,              // ✅ each column takes 50%
      minWidth: 0,          // ✅ prevents overflow / weird shrinking on web
    },

    metaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 10,
      flexWrap: "wrap",
    },
    metaLine: { fontWeight: "800", opacity: 0.75, marginTop: 2 },

    yellowBtn: {
      backgroundColor: theme.colors.warning,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignSelf: "flex-start",
    },
    yellowBtnText: { fontWeight: "900", color: theme.colors.textOnPrimary, fontSize: 12 },

    grid2: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
    paramHalf: { flex: 1, minWidth: 230 },

    rightTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },

    /* ===== Label tab visuals ===== */
    labelBanner: {
      alignItems: "center",
      paddingVertical: 18,
      borderRadius: 10,
      backgroundColor: theme.colors.accent,
    },
    labelBannerTitle: { fontWeight: "900", opacity: 0.8, marginBottom: 8 },
    labelBannerDateRow: { flexDirection: "row", gap: 10 },
    labelBannerDateBox: {
      width: 54,
      height: 54,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    labelBannerDateText: { color: theme.colors.textOnPrimary, fontWeight: "900", fontSize: 18 },

    labelInfoRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },

    timelineWrap: {
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceVariant,
    },
    sectionTitle: { fontWeight: "900", textAlign: "center", marginBottom: 10, opacity: 0.75 },
    timelineLine: {
      height: 2,
      backgroundColor: theme.colors.border,
      marginHorizontal: 10,
      marginBottom: 12,
    },
    timelinePoints: { flexDirection: "row", justifyContent: "space-between", gap: 10 },

    noteBox: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      backgroundColor: theme.colors.surfaceVariant,
    },
    noteTitle: { fontWeight: "900", marginBottom: 6 },
    noteText: { fontWeight: "800", opacity: 0.7, lineHeight: 18 },

    antecedentsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    /* ===== Table styles (Étiquettes précédentes) ===== */
    searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    searchLabel: { fontWeight: "900", opacity: 0.75 },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 40,
    },

    tableHeader: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    th: { color: theme.colors.textOnPrimary, fontWeight: "900", fontSize: 12 },

    tableBody: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      overflow: "hidden",
    },
    tr: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 10 },
    td: { fontWeight: "900", opacity: 0.75, fontSize: 12 },

    paginationRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    paginationLeft: { fontWeight: "800", opacity: 0.7 },
    paginationRight: { flexDirection: "row", alignItems: "center", gap: 10 },
    pageBtn: { paddingVertical: 6, paddingHorizontal: 10 },
    pageBtnText: { fontWeight: "900", opacity: 0.75 },
    pageCircle: {
      width: 28,
      height: 28,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: theme.colors.primary + "99",
      alignItems: "center",
      justifyContent: "center",
    },
    pageCircleText: { fontWeight: "900", color: theme.colors.primary },

    /* ===== Previous parameters list ===== */
    prevList: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      overflow: "hidden",
    },
    prevItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.textOnPrimary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    prevItemActive: {
      backgroundColor: theme.colors.warningSoft,
    },
    prevBar: { width: 6, height: 22, borderRadius: 6, marginRight: 10 },
    prevMainBtn: { flex: 1, flexDirection: "row", alignItems: "center" },
    prevItemText: { fontWeight: "900", opacity: 0.75 },
    prevItemTextActive: { opacity: 1 },
    viewBtn: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 },

    primaryBtn: {
      marginTop: 14,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    primaryBtnText: { color: theme.colors.textOnPrimary, fontWeight: "900", letterSpacing: 0.5 },

    /* ===== Modal ===== */
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 920,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
    },
    modalHeader: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    modalHeaderText: {
      color: theme.colors.textOnPrimary,
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    modalRow: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
    modalSection: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
    modalSectionTitle: { fontWeight: "900", color: theme.colors.warning, marginBottom: 10 },

    modalTextarea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      minHeight: 96,
      backgroundColor: theme.colors.textOnPrimary,
    },

    modalFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceVariant,
    },
    modalFooterBtnGhost: { paddingVertical: 10, paddingHorizontal: 10 },
    modalFooterBtnGhostText: { fontWeight: "900", opacity: 0.8 },
    modalFooterBtnGreen: {
      backgroundColor: theme.colors.success,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 999,
      minWidth: 220,
      alignItems: "center",
    },
    modalFooterBtnGreenText: { color: theme.colors.textOnPrimary, fontWeight: "900" },
    workspaceDialogCard: {
      width: "100%",
      maxHeight: "92%",
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    workspaceDialogHeader: {
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    workspaceDialogTabsWrap: {
      padding: 12,
    },
    workspaceDialogBody: {
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    workspaceDialogFooter: {
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },

    prevExpanded: {
      paddingHorizontal: 12,
      paddingBottom: 14,
      backgroundColor: theme.colors.textOnPrimary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },

  });









