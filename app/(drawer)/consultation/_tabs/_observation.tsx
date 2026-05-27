import { BlueField, MetricCard } from "./_ui";
import { ThemedCard } from "@/components/default_card";
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

type SpecialtyKey = "gynecology" | "cardiology" | "dermatology" | "orthopedics" | "dentistry";

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
  { key: "gynecology", label: "Gynécologie" },
  { key: "cardiology", label: "Cardiologie" },
  { key: "dermatology", label: "Dermatologie" },
  { key: "orthopedics", label: "Orthopedie" },
  { key: "dentistry", label: "Dentisterie" },
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
  dentistry: GENERIC_PARAMETER_FIELDS,
};

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
}: any) {
  const styles = createStyles(theme);

  const isSpecialtyTab = (k: string): k is SpecialtyKey =>
    k === "gynecology" || k === "cardiology" || k === "dermatology" || k === "orthopedics" || k === "dentistry";

  // Only show the specialty sub-tab that matches the doctor's speciality (if any).
  const enabledSpecialties = React.useMemo(() => {
    const normalized = normalizeSpeciality(doctorSpeciality ?? null);
    if (isSpecialtyTab(normalized)) {
      return SPECIALTY_TABS.filter((t) => t.key === normalized);
    }
    return [];
  }, [doctorSpeciality]);

  const leftTabs = React.useMemo(() => {
    const specialtyOnly =
      !!workspaceMode && enabledSpecialties.length > 0
        ? enabledSpecialties.map((x) => ({ key: x.key as LeftTabKey, label: x.label }))
        : null;

    return specialtyOnly ?? [
      ...BASE_LEFT_TABS,
      ...enabledSpecialties.map((x) => ({ key: x.key as LeftTabKey, label: x.label })),
    ];
  }, [enabledSpecialties, workspaceMode]);

  const mainTabs = React.useMemo(() => {
    if (workspaceMode) {
      return MAIN_PAGE_TABS.filter((tab) => tab.key === "workspace");
    }
    return MAIN_PAGE_TABS;
  }, [workspaceMode]);

  const [leftTab, setLeftTab] = React.useState<LeftTabKey>(() => {
    if (typeof initialLeftTab === "string") return initialLeftTab as any;
    if (workspaceMode && enabledSpecialties.length > 0) return enabledSpecialties[0].key as any;
    return "label";
  });
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
    if (workspaceMode && enabledSpecialties.length > 0) return enabledSpecialties[0].key;
    if (isSpecialtyTab(leftTab)) return leftTab;
    return null;
  }, [workspaceMode, enabledSpecialties, leftTab]);
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


  return (
    <View style={styles.singlePaneWrap}>
      <ThemedCard>
        <FlatTabs
          theme={theme}
          tabs={mainTabs}
          activeKey={mainPage}
          onChange={setMainPage}
        />

      {mainPage === "workspace" && (
      <>
        {/* Workspace sub-tabs */}
        {(!workspaceMode || leftTabs.length > 1) && (
          <FlatTabs
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
                    { backgroundColor: idx % 2 === 0 ? "rgba(0,0,0,0.02)" : "transparent" },
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
          <BlueField
            theme={theme}
            label="Motif de consultation :"
            value={draftCurrentParams?.motif_consultation ?? ""}
            onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), motif_consultation: v }))}
            minHeight={56}
          />
        ) : (
          <ReadOnlyBlueBox theme={theme} label="Motif de consultation :" value={parameters.motif_consultation || "-"} />
        )}

        <View style={styles.row}>
          <View style={styles.paramHalf}>
            {isEditingCurrentParams ? (
              <BlueField
                theme={theme}
                label="glycémie :"
                value={draftCurrentParams?.glycemie ?? ""}
                onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), glycemie: v }))}
                minHeight={56}
              />
            ) : (
              <ReadOnlyBlueBox theme={theme} label="glycémie :" value={parameters.glycemie || "-"} />
            )}
          </View>
          <View style={styles.paramHalf}>
            {isEditingCurrentParams ? (
              <BlueField
                theme={theme}
                label="HbA1c :"
                value={draftCurrentParams?.hba1c ?? ""}
                onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), hba1c: v }))}
                minHeight={56}
              />
            ) : (
              <ReadOnlyBlueBox theme={theme} label="HbA1c :" value={parameters.hba1c || "-"} />
            )}
          </View>
        </View>

        {isEditingCurrentParams ? (
          <BlueField
            theme={theme}
            label="Examen clinique :"
            value={draftCurrentParams?.examen_clinique ?? ""}
            onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), examen_clinique: v }))}
            multiline
            minHeight={88}
          />
        ) : (
          <ReadOnlyBlueBox theme={theme} label="Examen clinique :" value={parameters.examen_clinique || "-"} multiline />
        )}

        {isEditingCurrentParams ? (
          <BlueField
            theme={theme}
            label="Conclusion :"
            value={draftCurrentParams?.conclusion ?? ""}
            onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), conclusion: v }))}
            multiline
            minHeight={88}
          />
        ) : (
          <ReadOnlyBlueBox theme={theme} label="Conclusion :" value={parameters.conclusion || "-"} multiline />
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
                          { backgroundColor: active ? "#F5B301" : "rgba(0,0,0,0.08)" },
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
    </View>
  );
}

/* ==========================
   FlatTabs component (visual style like screenshots)
========================== */

function FlatTabs<T extends string>({
  theme,
  tabs,
  activeKey,
  onChange,
}: {
  theme: any;
  tabs: {
    key: T;
    label: string;
    icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  }[];
  activeKey: T;
  onChange: (k: T) => void;
}) {
  return (
    <View
      style={[
        flatTabStyles.row,
        { borderBottomColor: theme.colors.border },
      ]}
    >
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[
              flatTabStyles.tab,
              {
                backgroundColor: active ? theme.colors.surface : theme.colors.surfaceVariant,
                borderColor: active ? theme.colors.border : "transparent",
              },
            ]}
          >
            <View style={flatTabStyles.tabInner}>
              {t.icon ? (
                <MaterialCommunityIcons
                  name={t.icon}
                  size={15}
                  color={active ? theme.colors.primary : theme.colors.textSecondary}
                />
              ) : null}
              <Text style={[flatTabStyles.tabText, { opacity: active ? 1 : 0.75 }]}>
                {t.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const flatTabStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  tabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabText: {
    fontWeight: "900",
  },
});

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
          borderColor: active ? theme.colors.primary : "rgba(0,0,0,0.2)",
          backgroundColor: "#fff",
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
        borderColor: "rgba(0, 140, 255, 0.35)",
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

/* ==========================
   Right side read-only blue boxes (like screenshot)
========================== */

function ReadOnlyBlueBox({
  theme,
  label,
  value,
  multiline,
}: {
  theme: any;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 12, flex: 1 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: "900", marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          borderWidth: 2,
          borderColor: "rgba(0, 140, 255, 0.35)",
          borderRadius: 10,
          padding: 12,
          minHeight: multiline ? 88 : 56,
          backgroundColor: theme.colors.background,
          justifyContent: "center",
        }}
      >
        <Text style={{ fontWeight: "900", opacity: 0.75 }}>{value}</Text>
      </View>
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
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 18 }}>
        <View style={{ width: "100%", maxWidth: 920, borderRadius: 10, overflow: "hidden", backgroundColor: theme.colors.surface }}>
          <View style={{ paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary }}>
            <Text style={{ color: "#fff", fontWeight: "900", letterSpacing: 0.5 }}>PARAMETRES PRECEDENTS</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>{row?.visitLabel || "-"}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {(fields ?? GENERIC_PARAMETER_FIELDS).map((field: ParameterField) => (
                <View key={field.key} style={{ flex: 1, minWidth: field.multiline ? 320 : 230 }}>
                  <ReadOnlyBlueBox
                    theme={theme}
                    label={field.label}
                    value={String(row?.data?.[field.key] ?? "-")}
                    multiline={!!field.multiline}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", backgroundColor: "rgba(0,0,0,0.02)" }}>
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 }}>
              <Text style={{ color: "#fff", fontWeight: "900" }}>FERMER</Text>
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
            <FlatTabs
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
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 8,
          padding: 12,
          backgroundColor: "#fff",
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
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 8,
          padding: 12,
          backgroundColor: "#fff",
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
    yellowBtnText: { fontWeight: "900", color: "#fff", fontSize: 12 },

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
    labelBannerDateText: { color: "#fff", fontWeight: "900", fontSize: 18 },

    labelInfoRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },

    timelineWrap: {
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.02)",
    },
    sectionTitle: { fontWeight: "900", textAlign: "center", marginBottom: 10, opacity: 0.75 },
    timelineLine: {
      height: 2,
      backgroundColor: "rgba(0,0,0,0.10)",
      marginHorizontal: 10,
      marginBottom: 12,
    },
    timelinePoints: { flexDirection: "row", justifyContent: "space-between", gap: 10 },

    noteBox: {
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.12)",
      borderRadius: 10,
      padding: 12,
      backgroundColor: "rgba(0,0,0,0.02)",
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
      borderColor: "rgba(0,0,0,0.15)",
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
    th: { color: "#fff", fontWeight: "900", fontSize: 12 },

    tableBody: {
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.08)",
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
      borderColor: "rgba(120, 60, 200, 0.6)",
      alignItems: "center",
      justifyContent: "center",
    },
    pageCircleText: { fontWeight: "900", color: "rgba(120, 60, 200, 0.9)" },

    /* ===== Previous parameters list ===== */
    prevList: {
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.10)",
      borderRadius: 10,
      overflow: "hidden",
    },
    prevItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.06)",
    },
    prevItemActive: {
      backgroundColor: "rgba(245, 179, 1, 0.08)",
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
    primaryBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 0.5 },

    /* ===== Modal ===== */
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
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
      color: "#fff",
      fontWeight: "900",
      letterSpacing: 0.5,
    },
    modalRow: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
    modalSection: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)" },
    modalSectionTitle: { fontWeight: "900", color: "rgba(245, 100, 120, 0.9)", marginBottom: 10 },

    modalTextarea: {
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.15)",
      borderRadius: 8,
      padding: 12,
      minHeight: 96,
      backgroundColor: "#fff",
    },

    modalFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: "rgba(0,0,0,0.08)",
      backgroundColor: "rgba(0,0,0,0.02)",
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
    modalFooterBtnGreenText: { color: "#fff", fontWeight: "900" },

    prevExpanded: {
      paddingHorizontal: 12,
      paddingBottom: 14,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.06)",
    },

  });






