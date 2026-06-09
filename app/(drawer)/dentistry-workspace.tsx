import { PageShell } from "@/components/page_shell";
import { SpecialtyWorkspaceScaffold } from "@/components/workspaces/SpecialtyWorkspaceScaffold";
import { TreatmentSwipeSelector, type TreatmentSwipeOption } from "@/components/dentistry/TreatmentSwipeSelector";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { BlueField } from "./consultation/_tabs/_ui";
import { useTheme } from "@/theme/theme_provider";

type DentistryWorkspaceTab = "treatment" | "consultation_observation" | "treatment_history" | "consultation_history";

type PreviousConsultationRow = {
  visitLabel: string;
  chiefComplaint: string;
  toothRecords: string;
  materialsUsed: string;
  nextStep: string;
  notes: string;
};

type DentistryWorkspaceTreatmentKey =
  | "full_cleanup"
  | "braces"
  | "whitening"
  | "retainer"
  | "other";

const PREVIOUS_CONSULTATIONS: PreviousConsultationRow[] = [
  {
    visitLabel: "Session #3 - 12.06.2026",
    chiefComplaint: "Pain clearly reduced after last visit.",
    toothRecords: "Tooth 36: under treatment, canal cleaning completed.",
    materialsUsed: "Irrigation, temporary filling",
    nextStep: "Final obturation and control x-ray",
    notes: "No swelling. Good response to treatment.",
  },
  {
    visitLabel: "Session #2 - 03.06.2026",
    chiefComplaint: "Continue treatment for tooth 36.",
    toothRecords: "Tooth 36: canal preparation stage.",
    materialsUsed: "Canal files, antiseptic irrigation",
    nextStep: "Temporary seal, next follow-up planned",
    notes: "Pain lower than initial session.",
  },
  {
    visitLabel: "Session #1 - 27.05.2026",
    chiefComplaint: "Severe pain lower left molar.",
    toothRecords: "Tooth 36: caries with pulpitis.",
    materialsUsed: "Local anesthesia",
    nextStep: "Start root canal treatment",
    notes: "Initial consultation.",
  },
];

const DENTISTRY_TREATMENT_OPTIONS: TreatmentSwipeOption<DentistryWorkspaceTreatmentKey>[] = [
  {
    key: "full_cleanup",
    label: "Teeth Cleaning",
    shortLabel: "Cleaning",
    tag: "Hygiene",
    description: "Cleaning and polishing.",
    icon: "toothbrush",
    accentColor: "#0F766E",
  },
  {
    key: "braces",
    label: "Braces Review",
    shortLabel: "Braces",
    tag: "Orthodontics",
    description: "Adjustments and wire check.",
    icon: "tooth",
    accentColor: "#2563EB",
  },
  {
    key: "whitening",
    label: "Whitening",
    shortLabel: "Whitening",
    tag: "Cosmetic",
    description: "Brightening and shade care.",
    icon: "star-four-points",
    accentColor: "#D97706",
  },
  {
    key: "retainer",
    label: "Retainer Check",
    shortLabel: "Retainer",
    tag: "Retention",
    description: "Fit and stability check.",
    icon: "shield-check",
    accentColor: "#7C3AED",
  },
  {
    key: "other",
    label: "Other Treatment",
    shortLabel: "Custom",
    tag: "Custom",
    description: "Any custom dental session.",
    icon: "medical-bag",
    accentColor: "#475569",
  },
];

function FlatTabs<T extends string>({
  theme,
  tabs,
  activeKey,
  onChange,
}: {
  theme: any;
  tabs: { key: T; label: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }[];
  activeKey: T;
  onChange: (k: T) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 6,
              borderWidth: 1,
              backgroundColor: active ? theme.colors.surface : theme.colors.surfaceVariant,
              borderColor: active ? theme.colors.border : "transparent",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {t.icon ? <MaterialCommunityIcons name={t.icon} size={15} color={active ? theme.colors.primary : theme.colors.textSecondary} /> : null}
              <Text style={{ fontWeight: "900", opacity: active ? 1 : 0.75 }}>{t.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ReadOnlyBlueBox({ theme, label, value, multiline }: { theme: any; label: string; value: string; multiline?: boolean }) {
  return (
    <View style={{ marginTop: 12, flex: 1 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: "900", marginBottom: 6 }}>{label}</Text>
      <View style={{ borderWidth: 2, borderColor: "rgba(0, 140, 255, 0.35)", borderRadius: 10, padding: 12, minHeight: multiline ? 88 : 56, backgroundColor: theme.colors.background, justifyContent: "center" }}>
        <Text style={{ fontWeight: "900", opacity: 0.75 }}>{value || "-"}</Text>
      </View>
    </View>
  );
}

export default function DentistryWorkspacePage() {
  const { theme } = useTheme();
  const [workspaceTab, setWorkspaceTab] = React.useState<DentistryWorkspaceTab>("treatment");
  const [isEditingCurrentParams, setIsEditingCurrentParams] = React.useState(false);
  const [draftCurrentParams, setDraftCurrentParams] = React.useState<any | null>(null);
  const [generalTreatmentType, setGeneralTreatmentType] =
    React.useState<DentistryWorkspaceTreatmentKey>("full_cleanup");
  const [generalTreatmentNote, setGeneralTreatmentNote] = React.useState("");
  const [generalTreatmentHistory, setGeneralTreatmentHistory] = React.useState<Array<{ id: string; type: string; note: string; createdAt: string }>>([]);
  const [expandedTreatmentHistoryId, setExpandedTreatmentHistoryId] = React.useState<string | null>(null);
  const [expandedConsultationIndex, setExpandedConsultationIndex] = React.useState<number | null>(0);

  const [parameters, setParameters] = React.useState({
    chief_dental_complaint: "",
    tooth_records_summary: "",
    materials_used: "",
    next_dental_step: "",
    clinical_notes: "",
  });

  const activeTreatmentCard =
    DENTISTRY_TREATMENT_OPTIONS.find((option) => option.key === generalTreatmentType) ??
    DENTISTRY_TREATMENT_OPTIONS[0];

  return (
    <PageShell>
      <SpecialtyWorkspaceScaffold
        theme={theme}
        title="Dentistry Desk"
        subtitle="Dental charting, treatment workflow, and consultation history."
        icon="tooth-outline"
        stats={[
          { label: "Odontogram", value: "Active", tone: "blue" },
          { label: "Treatment Log", value: "Structured", tone: "green" },
          { label: "Consultation", value: "Dental", tone: "orange" },
        ]}
      >
        <View style={{ borderWidth: 0, borderRadius: 18, backgroundColor: theme.colors.surface, padding: 14 }}>
          <View style={{ marginTop: 12, gap: 18 }}>
            <FlatTabs
              theme={theme}
              tabs={[
                { key: "treatment", label: "Treatment", icon: "tooth-outline" },
                { key: "consultation_observation", label: "Consultation / Observation", icon: "clipboard-text-outline" },
                { key: "treatment_history", label: "Treatment History", icon: "history" },
                { key: "consultation_history", label: "Consultation History", icon: "history" },
              ]}
              activeKey={workspaceTab}
              onChange={setWorkspaceTab}
            />

            {workspaceTab === "treatment" && (
              <View style={{ padding: 2 }}>
                <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, padding: 12, gap: 12, marginBottom: 12 }}>
                  <TreatmentSwipeSelector
                    theme={theme}
                    options={DENTISTRY_TREATMENT_OPTIONS}
                    value={generalTreatmentType}
                    onChange={setGeneralTreatmentType}
                  />
                  <BlueField theme={theme} label={`Treatment note - ${activeTreatmentCard.label}`} value={generalTreatmentNote} onChange={setGeneralTreatmentNote} multiline minHeight={88} />
                  <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <TouchableOpacity
                      onPress={() => {
                        setGeneralTreatmentHistory((rows) => [
                          {
                            id: `${Date.now()}`,
                            type: activeTreatmentCard.label,
                            note: generalTreatmentNote.trim(),
                            createdAt: new Date().toLocaleString(),
                          },
                          ...rows,
                        ]);
                        setGeneralTreatmentNote("");
                      }}
                      style={{ backgroundColor: theme.colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}
                    >
                      <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary, fontSize: 12 }}>Add treatment</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            )}

            {workspaceTab === "treatment_history" && (
              <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.background, padding: 10, gap: 8 }}>
                <Text style={{ fontWeight: "900", color: theme.colors.text }}>General treatment history</Text>
                {generalTreatmentHistory.length === 0 ? (
                  <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>No general treatments yet.</Text>
                ) : (
                  generalTreatmentHistory.map((r) => {
                    const expanded = expandedTreatmentHistoryId === r.id;
                    return (
                      <View key={r.id} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, overflow: "hidden", backgroundColor: theme.colors.surface }}>
                        <TouchableOpacity
                          onPress={() => setExpandedTreatmentHistoryId((current) => (current === r.id ? null : r.id))}
                          activeOpacity={0.85}
                          style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}
                        >
                          <View style={{ width: 6, height: 24, borderRadius: 6, backgroundColor: expanded ? theme.colors.primary : theme.colors.border }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "900", color: theme.colors.text }}>{r.type}</Text>
                            <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>{r.createdAt}</Text>
                          </View>
                          <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                        {expanded ? (
                          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                            <ReadOnlyBlueBox theme={theme} label="Treatment note :" value={r.note || "-"} multiline />
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {workspaceTab === "consultation_observation" && (
            <>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 4 }}>
                {!isEditingCurrentParams ? (
                  <TouchableOpacity
                    style={{ backgroundColor: theme.colors.warning, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
                    onPress={() => {
                      setDraftCurrentParams({ ...parameters });
                      setIsEditingCurrentParams(true);
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: "#fff", fontSize: 12 }}>EDIT PARAMETERS</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: theme.colors.success, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
                      onPress={() => {
                        if (draftCurrentParams) {
                          setParameters(draftCurrentParams);
                        }
                        setDraftCurrentParams(null);
                        setIsEditingCurrentParams(false);
                      }}
                    >
                      <Text style={{ fontWeight: "900", color: "#fff", fontSize: 12 }}>CONFIRM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: theme.colors.textSecondary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
                      onPress={() => {
                        setDraftCurrentParams(null);
                        setIsEditingCurrentParams(false);
                      }}
                    >
                      <Text style={{ fontWeight: "900", color: "#fff", fontSize: 12 }}>CANCEL</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {isEditingCurrentParams ? (
                <>
                  <BlueField theme={theme} label="Chief dental complaint :" value={draftCurrentParams?.chief_dental_complaint ?? ""} onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), chief_dental_complaint: v }))} multiline minHeight={88} />
                  <BlueField theme={theme} label="Tooth records summary :" value={draftCurrentParams?.tooth_records_summary ?? ""} onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), tooth_records_summary: v }))} multiline minHeight={88} />
                  <BlueField theme={theme} label="Materials used :" value={draftCurrentParams?.materials_used ?? ""} onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), materials_used: v }))} minHeight={56} />
                  <BlueField theme={theme} label="Next dental step :" value={draftCurrentParams?.next_dental_step ?? ""} onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), next_dental_step: v }))} minHeight={56} />
                  <BlueField theme={theme} label="Clinical notes :" value={draftCurrentParams?.clinical_notes ?? ""} onChange={(v: string) => setDraftCurrentParams((s: any) => ({ ...(s ?? parameters), clinical_notes: v }))} multiline minHeight={88} />
                </>
              ) : (
                <>
                  <ReadOnlyBlueBox theme={theme} label="Chief dental complaint :" value={parameters.chief_dental_complaint || "-"} multiline />
                  <ReadOnlyBlueBox theme={theme} label="Tooth records summary :" value={parameters.tooth_records_summary || "-"} multiline />
                  <ReadOnlyBlueBox theme={theme} label="Materials used :" value={parameters.materials_used || "-"} />
                  <ReadOnlyBlueBox theme={theme} label="Next dental step :" value={parameters.next_dental_step || "-"} />
                  <ReadOnlyBlueBox theme={theme} label="Clinical notes :" value={parameters.clinical_notes || "-"} multiline />
                </>
              )}
            </>
          )}

          {workspaceTab === "consultation_history" && (
            <View style={{ marginTop: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", borderRadius: 10, overflow: "hidden" }}>
              {PREVIOUS_CONSULTATIONS.map((p, idx) => {
                const expanded = idx === expandedConsultationIndex;
                return (
                  <View key={p.visitLabel} style={{ backgroundColor: expanded ? "rgba(245, 179, 1, 0.08)" : "#fff", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" }}>
                    <TouchableOpacity
                      onPress={() => setExpandedConsultationIndex((current) => (current === idx ? null : idx))}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12 }}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: 6, height: 22, borderRadius: 6, marginRight: 10, backgroundColor: expanded ? "#F5B301" : "rgba(0,0,0,0.08)" }} />
                      <Text style={{ flex: 1, fontWeight: "900", opacity: expanded ? 1 : 0.75 }}>{p.visitLabel}</Text>
                      <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    {expanded ? (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                        <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>{p.visitLabel}</Text>
                        <ReadOnlyBlueBox theme={theme} label="Chief dental complaint :" value={p.chiefComplaint} multiline />
                        <ReadOnlyBlueBox theme={theme} label="Tooth records :" value={p.toothRecords} multiline />
                        <ReadOnlyBlueBox theme={theme} label="Materials used :" value={p.materialsUsed} />
                        <ReadOnlyBlueBox theme={theme} label="Next dental step :" value={p.nextStep} />
                        <ReadOnlyBlueBox theme={theme} label="Notes :" value={p.notes} multiline />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </SpecialtyWorkspaceScaffold>
    </PageShell>
  );
}
