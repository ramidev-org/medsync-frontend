import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Avatar } from "@/components/patient_avatar";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import {
  FIELD_ICON_MAP,
  SPECIALTY_TABS,
  getTreatmentExtraFields,
  getTreatmentOptions,
  isSpecialtyKey,
  type ParameterField,
  type SpecialtyKey,
} from "@/components/consultation/observation_fields";
type TreatmentTabKey = "summary" | "medications" | "plan" | "documents";

type TreatmentHistoryRow = {
  id: string;
  type: string;
  note: string;
  createdAt: string;
  workspace: SpecialtyKey;
  status: "active" | "completed" | "cancelled";
  extra: Record<string, string>;
};

const SUMMARY_FIELD_KEYS: Partial<Record<SpecialtyKey, string[]>> = {
  general_medicine: ["treatment_goal", "prescribed_medication", "patient_instructions", "follow_up_window"],
  cardiology: ["treatment_goal", "medication_adjustment", "anticoagulation_status", "follow_up_window"],
  dermatology: ["treatment_focus", "topical_or_systemic", "skin_care_instructions", "review_interval"],
  gynecology: ["care_path", "pregnancy_support", "safety_advice", "follow_up_window"],
  orthopedics: ["immobilization", "analgesia_plan", "rehab_program", "review_interval"],
  dentistry: ["treatment_focus", "treated_area", "procedure_done", "next_visit_goal"],
  pediatrics: ["treatment_goal", "weight_based_plan", "parent_guidance", "follow_up_window"],
  endocrinology_diabetes: ["glycemic_target", "therapy_adjustment", "nutrition_advice", "follow_up_window"],
  ent: ["target_region", "medical_or_local_care", "hearing_or_imaging_request", "follow_up_window"],
  ophthalmology: ["treatment_goal", "drops_or_correction", "procedure_done", "follow_up_window"],
  pulmonology: ["bronchodilator_plan", "oxygen_support", "respiratory_education", "follow_up_window"],
  gastroenterology: ["treatment_goal", "dietary_adjustment", "procedure_done", "follow_up_window"],
  analyses_medicales: ["order_priority", "sample_type", "turnaround_expectation", "lab_comments"],
};

const TABS: { key: TreatmentTabKey; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[] = [
  { key: "summary", label: "Résumé", icon: "text-box-check-outline" },
  { key: "medications", label: "Médicaments", icon: "pill" },
  { key: "plan", label: "Plan / Suivi", icon: "timeline-clock-outline" },
  { key: "documents", label: "Documents", icon: "file-document-outline" },
];

const SEED_HISTORY: TreatmentHistoryRow[] = [
  { id: "seed-hypertension", type: "follow_up_treatment", note: "Traitement en cours", createdAt: "28/07/2026", workspace: "cardiology", status: "active", extra: {} },
  { id: "seed-infection", type: "medication_adjustment", note: "Traitement terminé", createdAt: "12/06/2026 — 12/07/2026", workspace: "general_medicine", status: "completed", extra: {} },
  { id: "seed-back", type: "procedure", note: "Traitement terminé", createdAt: "05/05/2026 — 15/05/2026", workspace: "orthopedics", status: "completed", extra: {} },
  { id: "seed-rhinitis", type: "follow_up_treatment", note: "Traitement annulé", createdAt: "20/04/2026", workspace: "ent", status: "cancelled", extra: {} },
  { id: "seed-diabetes", type: "follow_up_treatment", note: "Surveillance glycémique", createdAt: "12/03/2026", workspace: "endocrinology_diabetes", status: "active", extra: {} },
  { id: "seed-dental", type: "preventive_care", note: "Contrôle bucco-dentaire", createdAt: "18/02/2026", workspace: "dentistry", status: "completed", extra: {} },
];

export default function TreatmentTab({
  theme,
  workspaceKey,
  patient,
  doctor,
  consultationDate,
  createSignal = 0,
}: {
  theme: any;
  workspaceKey: string;
  patient?: any;
  doctor?: any;
  consultationDate?: string;
  createSignal?: number;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const normalizedWorkspace: SpecialtyKey = isSpecialtyKey(workspaceKey) ? workspaceKey : "general_medicine";
  const [activeTab, setActiveTab] = React.useState<TreatmentTabKey>("summary");
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<SpecialtyKey>(normalizedWorkspace);
  const [treatmentType, setTreatmentType] = React.useState("follow_up_treatment");
  const [treatmentNote, setTreatmentNote] = React.useState("");
  const [treatmentExtra, setTreatmentExtra] = React.useState<Record<string, string>>({});
  const [history, setHistory] = React.useState<TreatmentHistoryRow[]>(SEED_HISTORY);
  const [draftId, setDraftId] = React.useState("current-treatment");
  const [selectedId, setSelectedId] = React.useState("current-treatment");
  const [editing, setEditing] = React.useState(false);
  const [historyExpanded, setHistoryExpanded] = React.useState(false);
  const [historyQuery, setHistoryQuery] = React.useState("");

  React.useEffect(() => {
    setSelectedWorkspace(normalizedWorkspace);
    setSelectedId(draftId);
  }, [draftId, normalizedWorkspace]);

  const treatmentOptions = React.useMemo(() => getTreatmentOptions(selectedWorkspace), [selectedWorkspace]);
  React.useEffect(() => {
    if (!treatmentOptions.some((option) => option.key === treatmentType)) setTreatmentType(treatmentOptions[0]?.key || "follow_up_treatment");
  }, [treatmentOptions, treatmentType]);

  const startNewTreatment = React.useCallback(() => {
    const nextId = `treatment-${Date.now()}`;
    setDraftId(nextId);
    setSelectedId(nextId);
    setSelectedWorkspace(normalizedWorkspace);
    setTreatmentType(getTreatmentOptions(normalizedWorkspace)[0]?.key || "follow_up_treatment");
    setTreatmentNote("");
    setTreatmentExtra({});
    setEditing(true);
    setActiveTab("summary");
  }, [normalizedWorkspace]);

  const previousCreateSignal = React.useRef(createSignal);
  React.useEffect(() => {
    if (createSignal !== previousCreateSignal.current) {
      previousCreateSignal.current = createSignal;
      startNewTreatment();
    }
  }, [createSignal, startNewTreatment]);

  const currentRow = React.useMemo<TreatmentHistoryRow>(() => ({
    id: draftId,
    type: treatmentType,
    note: treatmentNote.trim(),
    createdAt: formatDate(consultationDate),
    workspace: selectedWorkspace,
    status: "active",
    extra: treatmentExtra,
  }), [consultationDate, draftId, selectedWorkspace, treatmentExtra, treatmentNote, treatmentType]);

  const rows = React.useMemo(() => {
    const withoutDraft = history.filter((row) => row.id !== draftId);
    return [currentRow, ...withoutDraft];
  }, [currentRow, draftId, history]);
  const selectedRow = rows.find((row) => row.id === selectedId) || currentRow;
  const filteredRows = rows.filter((row) => treatmentLabel(row.type, row.workspace).toLowerCase().includes(historyQuery.trim().toLowerCase()));
  const visibleRows = historyExpanded ? filteredRows : filteredRows.slice(0, 5);
  const displayFields = getImportantTreatmentFields(selectedRow.workspace);
  const workspaceLabel = SPECIALTY_TABS.find((item) => item.key === selectedRow.workspace)?.label || selectedRow.workspace.replaceAll("_", " ");
  const patientName = `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim() || "Patient";
  const birthDate = patient?.date_of_birth ? new Date(patient.date_of_birth) : null;
  const birthLabel = birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate.toLocaleDateString("fr-FR") : "Non renseignée";
  const doctorName = doctor?.nom_complet || doctor?.full_name || doctor?.name || "Médecin traitant";

  const saveTreatment = () => {
    const saved = { ...currentRow, createdAt: formatDate(new Date().toISOString()) };
    setHistory((previous) => [saved, ...previous.filter((row) => row.id !== saved.id)]);
    setSelectedId(saved.id);
    setEditing(false);
    setActiveTab("summary");
  };

  const editSelectedTreatment = () => {
    setDraftId(selectedRow.id);
    setSelectedWorkspace(selectedRow.workspace);
    setTreatmentType(selectedRow.type);
    setTreatmentNote(selectedRow.note);
    setTreatmentExtra({ ...selectedRow.extra });
    setEditing(true);
    setActiveTab("summary");
  };

  return (
    <View style={styles.root}>
      <View style={styles.patientCard}>
        <View style={styles.patientIdentity}>
          <Avatar firstName={patient?.first_name} lastName={patient?.last_name} size={70} />
          <View style={styles.patientCopy}>
            <View style={styles.patientNameRow}><Text style={styles.patientName}>{patientName}</Text><MaterialCommunityIcons name={patient?.sex === "female" ? "gender-female" : "gender-male"} size={19} color={theme.colors.primary} /></View>
            <Text style={styles.patientMeta}>Né(e) le {birthLabel}{patient?.age ? ` (${patient.age} ans)` : ""} · ID: {patient?.id ? String(patient.id).slice(0, 8).toUpperCase() : "—"}</Text>
            <View style={styles.phoneRow}><MaterialCommunityIcons name="phone-outline" size={18} color={theme.colors.textSecondary} /><Text style={styles.patientMeta}>{patient?.phone || "Téléphone non renseigné"}</Text></View>
          </View>
        </View>
        <View style={styles.patientFacts}>
          <View style={styles.patientFact}><Text style={styles.factLabel}>Allergies</Text><Text style={styles.allergyValue}>{patient?.allergies || "Aucune connue"}</Text></View>
          <View style={styles.factDivider} />
          <View style={styles.patientFact}><Text style={styles.factLabel}>Médecin traitant</Text><Text style={styles.factValue}>{doctorName}</Text></View>
          <TouchableOpacity
            style={[styles.patientEditButton, editing && styles.patientSaveButton]}
            onPress={editing ? saveTreatment : editSelectedTreatment}
            accessibilityLabel={editing ? "Enregistrer le traitement" : "Modifier le traitement"}
          >
            <MaterialCommunityIcons name={editing ? "content-save-check-outline" : "pencil-outline"} size={21} color={editing ? "#fff" : theme.colors.success} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.workspaceRow}>
        <View style={styles.historyPanel}>
          <Text style={styles.historyTitle}>Historique des traitements</Text>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}><MaterialCommunityIcons name="magnify" size={19} color={theme.colors.textSecondary} /><TextInput value={historyQuery} onChangeText={setHistoryQuery} placeholder="Rechercher un traitement..." placeholderTextColor={theme.colors.textSecondary} style={styles.searchInput} /></View>
            <TouchableOpacity style={styles.filterButton}><MaterialCommunityIcons name="filter-variant" size={20} color={theme.colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={historyExpanded} nestedScrollEnabled>
            {visibleRows.map((row) => {
              const active = selectedRow.id === row.id;
              const status = statusMeta(row.status, theme);
              return (
                <TouchableOpacity key={row.id} style={[styles.historyCard, active && styles.historyCardActive]} onPress={() => { setSelectedId(row.id); setActiveTab("summary"); }}>
                  <View style={styles.historyStatusRow}><View style={[styles.statusBadge, { backgroundColor: status.background }]}><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View><Text style={styles.historyDate}>{row.createdAt}</Text></View>
                  <View style={styles.historyMainRow}><View style={styles.historyCopy}><Text style={styles.historyName} numberOfLines={1}>{treatmentLabel(row.type, row.workspace)}</Text><Text style={styles.historyNote} numberOfLines={1}>{row.note || status.description}</Text></View>{active ? <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.primary} /> : null}</View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {filteredRows.length > 5 ? <TouchableOpacity style={styles.viewAllButton} onPress={() => setHistoryExpanded((value) => !value)}><Text style={styles.viewAllText}>{historyExpanded ? "RÉDUIRE LA LISTE" : "VOIR TOUS LES TRAITEMENTS"}</Text><MaterialCommunityIcons name={historyExpanded ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.primary} /></TouchableOpacity> : null}
        </View>

        <View style={styles.mainPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return <TouchableOpacity key={tab.key} style={[styles.tabButton, active && styles.tabButtonActive]} onPress={() => setActiveTab(tab.key)}><MaterialCommunityIcons name={tab.icon} size={20} color={active ? theme.colors.primary : theme.colors.textSecondary} /><Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text></TouchableOpacity>;
            })}
          </ScrollView>

          <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent} nestedScrollEnabled>
            {activeTab === "summary" ? (
              <View style={styles.summaryContent}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Résumé du traitement</Text>
                  {editing ? (
                    <View style={styles.formActions}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}><Text style={styles.cancelText}>ANNULER</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.saveButton} onPress={saveTreatment}><MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" /><Text style={styles.saveText}>ENREGISTRER</Text></TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.outlineButton} onPress={editSelectedTreatment}><Text style={styles.outlineButtonText}>MODIFIER LE TRAITEMENT</Text></TouchableOpacity>
                  )}
                </View>
                <View style={styles.noteSection}>
                  <View style={styles.noteIcon}><MaterialCommunityIcons name="note-text-outline" size={22} color={theme.colors.primary} /></View>
                  <View style={styles.noteCopy}>
                    <Text style={styles.noteTitle}>Dernière note</Text>
                    {editing ? <TextInput value={treatmentNote} onChangeText={setTreatmentNote} multiline placeholder="Saisir une note de traitement" placeholderTextColor={theme.colors.textSecondary} style={styles.inlineNoteInput} /> : <Text style={styles.noteText}>{selectedRow.note || "Aucune note de traitement pour le moment."}</Text>}
                  </View>
                </View>
                <View style={styles.specialtyFields}>
                  {displayFields.map((field) => <View key={field.key} style={styles.specialtyField}><View style={styles.specialtyLabelRow}><MaterialCommunityIcons name={FIELD_ICON_MAP[field.key] || "clipboard-text-outline"} size={21} color={theme.colors.primary} /><Text style={styles.specialtyLabel}>{cleanLabel(field.label)}</Text></View>{editing ? <TextInput value={treatmentExtra[field.key] || ""} onChangeText={(value) => setTreatmentExtra((current) => ({ ...current, [field.key]: value }))} multiline={Boolean(field.multiline)} placeholder="Saisir une valeur" placeholderTextColor={theme.colors.textSecondary} style={[styles.inlineFieldInput, field.multiline && styles.inlineFieldInputMultiline]} /> : <Text style={styles.specialtyValue} numberOfLines={2}>{selectedRow.extra[field.key] || "Non renseigné"}</Text>}</View>)}
                </View>
                <TreatmentTimeline styles={styles} theme={theme} startDate={consultationDate} />
              </View>
            ) : null}

            {activeTab === "medications" ? (
              <View style={styles.formSection}><Text style={styles.sectionTitle}>Type de traitement</Text><Text style={styles.sectionDescription}>Les options proposées s’adaptent automatiquement à la spécialité sélectionnée.</Text><View style={styles.optionGrid}>{treatmentOptions.map((option) => { const active = treatmentType === option.key; return <TouchableOpacity key={option.key} style={[styles.optionCard, active && styles.optionCardActive]} onPress={() => setTreatmentType(option.key)}><View style={[styles.optionIcon, active && styles.optionIconActive]}><MaterialCommunityIcons name={option.icon} size={24} color={active ? "#fff" : theme.colors.primary} /></View><View style={styles.optionCopy}><Text style={styles.optionTitle}>{option.label}</Text><Text style={styles.optionDescription}>{option.description}</Text></View>{active ? <MaterialCommunityIcons name="check-circle" size={21} color={theme.colors.primary} /> : null}</TouchableOpacity>; })}</View></View>
            ) : null}

            {activeTab === "plan" ? (
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Plan et suivi · {workspaceLabel}</Text><Text style={styles.sectionDescription}>Champs essentiels adaptés à la spécialité du médecin.</Text></View></View>
                <View style={styles.planNoteField}><View style={styles.specialtyLabelRow}><MaterialCommunityIcons name="notebook-edit-outline" size={21} color={theme.colors.primary} /><Text style={styles.specialtyLabel}>Note du traitement</Text></View><TextInput value={treatmentNote} onChangeText={setTreatmentNote} multiline placeholder="Saisir une note de traitement" placeholderTextColor={theme.colors.textSecondary} style={[styles.modernInput, styles.modernInputMultiline]} /></View>
                <View style={styles.formGrid}>{getImportantTreatmentFields(selectedWorkspace).map((field) => <View key={field.key} style={styles.modernField}><View style={styles.specialtyLabelRow}><MaterialCommunityIcons name={FIELD_ICON_MAP[field.key] || "file-document-edit-outline"} size={21} color={theme.colors.primary} /><Text style={styles.specialtyLabel}>{cleanLabel(field.label)}</Text></View><TextInput value={treatmentExtra[field.key] || ""} onChangeText={(value) => setTreatmentExtra((current) => ({ ...current, [field.key]: value }))} multiline={Boolean(field.multiline)} placeholder="Saisir une valeur" placeholderTextColor={theme.colors.textSecondary} style={[styles.modernInput, field.multiline && styles.modernInputMultiline]} /></View>)}</View>
                <View style={styles.formActions}><TouchableOpacity style={styles.cancelButton} onPress={() => { setEditing(false); setActiveTab("summary"); }}><Text style={styles.cancelText}>ANNULER</Text></TouchableOpacity><TouchableOpacity style={styles.saveButton} onPress={saveTreatment}><MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" /><Text style={styles.saveText}>ENREGISTRER</Text></TouchableOpacity></View>
              </View>
            ) : null}

            {activeTab === "documents" ? <View style={styles.emptyState}><View style={styles.emptyIcon}><MaterialCommunityIcons name="file-document-multiple-outline" size={36} color={theme.colors.primary} /></View><Text style={styles.sectionTitle}>Documents du traitement</Text><Text style={styles.sectionDescription}>Les ordonnances, comptes rendus et documents associés apparaîtront ici.</Text></View> : null}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function getImportantTreatmentFields(workspace: SpecialtyKey): ParameterField[] {
  const fields = getTreatmentExtraFields(workspace);
  const preferredKeys = SUMMARY_FIELD_KEYS[workspace] || fields.map((field) => field.key);
  return preferredKeys.map((key) => fields.find((field) => field.key === key)).filter((field): field is ParameterField => Boolean(field)).slice(0, 4);
}

function treatmentLabel(type: string, workspace: SpecialtyKey) {
  return getTreatmentOptions(workspace).find((option) => option.key === type)?.label || type.replaceAll("_", " ");
}

function cleanLabel(label: string) {
  return label.replace(/\s*:\s*$/, "");
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? "Consultation en cours" : date.toLocaleDateString("fr-FR");
}

function addMonths(value: string | undefined, months: number) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("fr-FR");
}

function statusMeta(status: TreatmentHistoryRow["status"], theme: any) {
  if (status === "completed") return { label: "TERMINÉ", description: "Traitement terminé", color: theme.colors.warning, background: "#FFF5DB" };
  if (status === "cancelled") return { label: "ANNULÉ", description: "Traitement annulé", color: theme.colors.textSecondary, background: theme.colors.surfaceVariant };
  return { label: "ACTIF", description: "Traitement actif", color: theme.colors.success, background: "#E7F8EF" };
}

function TreatmentTimeline({ styles, theme, startDate }: any) {
  const steps = [
    { label: "Début", date: addMonths(startDate, 0), active: true },
    { label: "Suivi 1", date: addMonths(startDate, 1) },
    { label: "Suivi 2", date: addMonths(startDate, 2) },
    { label: "Évaluation", date: addMonths(startDate, 3) },
  ];
  return <View style={styles.timelineSection}><Text style={styles.timelineTitle}>Aperçu du plan de traitement</Text><View style={styles.timelineRow}>{steps.map((step, index) => <View key={step.label} style={styles.timelineStep}>{index < steps.length - 1 ? <View style={styles.timelineLine} /> : null}<View style={[styles.timelineDot, step.active && styles.timelineDotActive]}><MaterialCommunityIcons name={step.active ? "check" : "calendar-blank-outline"} size={18} color={step.active ? "#fff" : theme.colors.textSecondary} /></View><Text style={[styles.timelineLabel, step.active && { color: theme.colors.primary }]}>{step.label}</Text><Text style={styles.timelineDate}>{step.date}</Text></View>)}</View><View style={styles.nextFollowUp}><MaterialCommunityIcons name="information-outline" size={21} color={theme.colors.primary} /><Text style={styles.nextFollowUpText}>Prochain suivi prévu le <Text style={{ fontWeight: "600" }}>{addMonths(startDate, 1)}</Text></Text><TouchableOpacity style={styles.planButton}><Text style={styles.planButtonText}>VOIR LE PLAN COMPLET</Text></TouchableOpacity></View></View>;
}

const createStyles = (theme: any) => StyleSheet.create({
  root: { width: "100%", gap: 14 },
  patientCard: { minHeight: 126, paddingHorizontal: 28, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 24, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, ...(Platform.OS === "web" ? ({ boxShadow: "0 8px 22px rgba(15,23,42,0.04)" } as any) : null) },
  patientIdentity: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 18 },
  initials: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F8F2" },
  initialsText: { fontSize: 23, fontWeight: "600", color: theme.colors.success },
  patientCopy: { flex: 1, minWidth: 0 },
  patientNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  patientName: { fontSize: 19, fontWeight: "700", color: theme.colors.text },
  patientMeta: { marginTop: 6, fontSize: 12, color: theme.colors.textSecondary },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  patientFacts: { flexDirection: "row", alignItems: "center", gap: 26 },
  patientFact: { minWidth: 160 },
  factLabel: { fontSize: 12, fontWeight: "500", color: theme.colors.textSecondary },
  factValue: { marginTop: 7, fontSize: 13, fontWeight: "600", color: theme.colors.text },
  allergyValue: { marginTop: 7, fontSize: 13, fontWeight: "600", color: theme.colors.success },
  factDivider: { width: 1, height: 58, backgroundColor: theme.colors.border },
  patientEditButton: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#EBF9F2" },
  patientSaveButton: { backgroundColor: theme.colors.success },
  workspaceRow: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  historyPanel: { width: 355, minHeight: 740, padding: 18, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface },
  historyTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  searchRow: { marginTop: 18, flexDirection: "row", gap: 10 },
  searchBox: { flex: 1, minHeight: 44, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: "#FCFDFF" },
  searchInput: { flex: 1, minWidth: 0, fontSize: 12, color: theme.colors.text, outlineStyle: "none" } as any,
  filterButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: "#FCFDFF" },
  historyScroll: { maxHeight: 530, marginTop: 14 },
  historyList: { gap: 8, paddingBottom: 2 },
  historyCard: { minHeight: 96, padding: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: "#FCFDFF" },
  historyCardActive: { borderColor: theme.colors.primary, backgroundColor: "#F7FAFF" },
  historyStatusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 9, fontWeight: "600" },
  historyDate: { fontSize: 10, color: theme.colors.textSecondary },
  historyMainRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  historyCopy: { flex: 1, minWidth: 0 },
  historyName: { fontSize: 12, fontWeight: "600", color: theme.colors.text },
  historyNote: { marginTop: 5, fontSize: 11, color: theme.colors.textSecondary },
  viewAllButton: { minHeight: 42, marginTop: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 9 },
  viewAllText: { fontSize: 10, fontWeight: "600", color: theme.colors.primary },
  mainPanel: { flex: 1, minWidth: 0, minHeight: 740, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface },
  tabsScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tabsRow: { minWidth: "100%", paddingHorizontal: 18 },
  tabButton: { flex: 1, minWidth: 138, minHeight: 62, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabButtonActive: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 12, fontWeight: "500", color: theme.colors.textSecondary },
  tabTextActive: { fontWeight: "600", color: theme.colors.primary },
  tabScroll: { flex: 1 },
  tabContent: { padding: 26 },
  summaryContent: { gap: 16 },
  sectionHeader: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  sectionDescription: { marginTop: 5, fontSize: 12, color: theme.colors.textSecondary },
  outlineButton: { minHeight: 40, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 9 },
  outlineButtonText: { fontSize: 10, fontWeight: "600", color: theme.colors.primary },
  noteSection: { minHeight: 104, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12 },
  noteIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
  noteCopy: { flex: 1, minWidth: 0 },
  noteTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
  noteText: { marginTop: 9, fontSize: 12, lineHeight: 19, color: theme.colors.textSecondary },
  inlineNoteInput: { minHeight: 54, marginTop: 8, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: "#FCFDFF", color: theme.colors.text, fontSize: 12, textAlignVertical: "top", outlineStyle: "none" } as any,
  specialtyFields: { paddingVertical: 12, flexDirection: "row", flexWrap: "wrap", gap: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border },
  specialtyField: { flex: 1, minWidth: 190, minHeight: 60, paddingHorizontal: 8, paddingVertical: 4 },
  specialtyLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  specialtyLabel: { flex: 1, fontSize: 11, fontWeight: "500", color: theme.colors.textSecondary },
  specialtyValue: { marginTop: 7, fontSize: 12, lineHeight: 17, fontWeight: "500", color: theme.colors.text },
  inlineFieldInput: { minHeight: 38, marginTop: 7, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: "#FCFDFF", color: theme.colors.text, fontSize: 12, outlineStyle: "none" } as any,
  inlineFieldInputMultiline: { minHeight: 58, textAlignVertical: "top" },
  timelineSection: { overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12 },
  timelineTitle: { padding: 18, fontSize: 13, fontWeight: "600", color: theme.colors.text },
  timelineRow: { paddingHorizontal: 26, paddingVertical: 10, flexDirection: "row" },
  timelineStep: { flex: 1, alignItems: "center", position: "relative" },
  timelineLine: { position: "absolute", top: 17, left: "50%", width: "100%", height: 1, backgroundColor: theme.colors.border },
  timelineDot: { width: 36, height: 36, zIndex: 1, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: theme.colors.surfaceVariant },
  timelineDotActive: { backgroundColor: theme.colors.primary },
  timelineLabel: { marginTop: 10, fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary },
  timelineDate: { marginTop: 6, fontSize: 10, color: theme.colors.textSecondary },
  nextFollowUp: { minHeight: 62, margin: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, backgroundColor: "#F6F9FF" },
  nextFollowUpText: { flex: 1, fontSize: 11, color: theme.colors.text },
  planButton: { minHeight: 34, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 8 },
  planButtonText: { fontSize: 9, fontWeight: "600", color: theme.colors.primary },
  formSection: { minHeight: 590, gap: 16 },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  planNoteField: { padding: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modernField: { flex: 1, minWidth: 300, padding: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modernInput: { minHeight: 42, marginTop: 9, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: "#FCFDFF", color: theme.colors.text, fontSize: 12, outlineStyle: "none" } as any,
  modernInputMultiline: { minHeight: 72, textAlignVertical: "top" },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelButton: { minHeight: 42, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9 },
  cancelText: { fontSize: 10, fontWeight: "600", color: theme.colors.textSecondary },
  saveButton: { minHeight: 42, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 9, backgroundColor: theme.colors.primary },
  saveText: { fontSize: 10, fontWeight: "600", color: "#fff" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionCard: { width: "48.8%", minWidth: 260, minHeight: 92, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, backgroundColor: "#FCFDFF" },
  optionCardActive: { borderColor: theme.colors.primary, backgroundColor: "#F5F8FF" },
  optionIcon: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
  optionIconActive: { backgroundColor: theme.colors.primary },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 12, fontWeight: "600", color: theme.colors.text },
  optionDescription: { marginTop: 5, fontSize: 10, lineHeight: 15, color: theme.colors.textSecondary },
  emptyState: { minHeight: 550, alignItems: "center", justifyContent: "center" },
  emptyIcon: { width: 76, height: 76, marginBottom: 16, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
});
