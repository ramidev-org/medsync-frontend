import { PageShell } from "@/components/page_shell";
import { SpecialtyWorkspaceScaffold } from "@/components/workspaces/SpecialtyWorkspaceScaffold";
import { ToothTreatmentPanel } from "@/components/dentistry/ToothTreatmentPanel";
import { DentistryHistoryFilters, DentistryTreatmentHistoryCards } from "@/components/dentistry/DentistryTreatmentHistoryCards";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
  const [previousModalOpen, setPreviousModalOpen] = React.useState(false);
  const [selectedPrevIndex, setSelectedPrevIndex] = React.useState(0);
  const selectedPrev = PREVIOUS_CONSULTATIONS[selectedPrevIndex];

  const [state, setState] = React.useState<{ activeProcedure?: any; selectedTeeth?: string[]; odontogram?: any }>({});
  const [generalTreatmentType, setGeneralTreatmentType] = React.useState("full_cleanup");
  const [generalTreatmentNote, setGeneralTreatmentNote] = React.useState("");
  const [generalTreatmentHistory, setGeneralTreatmentHistory] = React.useState<Array<{ id: string; type: string; note: string; createdAt: string }>>([]);
  const [from, setFrom] = React.useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [to, setTo] = React.useState<Date>(() => new Date());

  const [parameters, setParameters] = React.useState({
    chief_dental_complaint: "",
    tooth_records_summary: "",
    materials_used: "",
    next_dental_step: "",
    clinical_notes: "",
  });

  const resetFilters = React.useCallback(() => {
    const d = new Date();
    const f = new Date(d);
    f.setDate(f.getDate() - 30);
    setFrom(f);
    setTo(d);
  }, []);

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
                  <Text style={{ fontWeight: "900", color: theme.colors.primary }}>Treatments without teeth selection</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {[
                      { key: "full_cleanup", label: "Full Cleanup" },
                      { key: "braces", label: "Braces" },
                      { key: "whitening", label: "Whitening" },
                      { key: "retainer", label: "Retainer Check" },
                      { key: "other", label: "Other Treatment" },
                    ].map((t) => {
                      const active = generalTreatmentType === t.key;
                      return (
                        <TouchableOpacity
                          key={t.key}
                          onPress={() => setGeneralTreatmentType(t.key)}
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
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <BlueField theme={theme} label="Treatment note" value={generalTreatmentNote} onChange={setGeneralTreatmentNote} multiline minHeight={88} />
                  <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <TouchableOpacity
                      onPress={() => {
                        const typeLabel =
                          generalTreatmentType === "full_cleanup"
                            ? "Full Cleanup"
                            : generalTreatmentType === "braces"
                              ? "Braces"
                              : generalTreatmentType === "whitening"
                                ? "Whitening"
                                : generalTreatmentType === "retainer"
                                  ? "Retainer Check"
                                  : "Other Treatment";
                        setGeneralTreatmentHistory((rows) => [
                          { id: `${Date.now()}`, type: typeLabel, note: generalTreatmentNote.trim(), createdAt: new Date().toLocaleString() },
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

                <ToothTreatmentPanel
                  theme={theme}
                  selectedTeeth={state.selectedTeeth ?? []}
                  onChangeSelectedTeeth={(next) => setState((s) => ({ ...s, selectedTeeth: next }))}
                  activeProcedure={state.activeProcedure ?? "caries"}
                  onChangeActiveProcedure={(next) => setState((s) => ({ ...s, activeProcedure: next }))}
                  odontogram={state.odontogram ?? {}}
                  onChangeOdontogram={(next) => setState((s) => ({ ...s, odontogram: next }))}
                />
              </View>
            )}

            {workspaceTab === "treatment_history" && (
              <>
                <DentistryHistoryFilters theme={theme} from={from} to={to} onFromChange={setFrom} onToChange={setTo} onReset={resetFilters} />
                <View style={{ marginTop: 4 }}>
                  <DentistryTreatmentHistoryCards theme={theme} odontogram={state.odontogram ?? {}} from={from} to={to} maxHeight={340} />
                </View>
                <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.background, padding: 10, gap: 8, marginTop: 8 }}>
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>General treatment history</Text>
                  {generalTreatmentHistory.length === 0 ? (
                    <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>No general treatments yet.</Text>
                  ) : (
                    generalTreatmentHistory.map((r) => (
                      <View key={r.id} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, backgroundColor: theme.colors.surface }}>
                        <Text style={{ fontWeight: "900", color: theme.colors.text }}>{r.type}</Text>
                        <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>{r.createdAt}</Text>
                        {!!r.note && <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>{r.note}</Text>}
                      </View>
                    ))
                  )}
                </View>
              </>
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
                const active = idx === selectedPrevIndex;
                return (
                  <View key={p.visitLabel} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, backgroundColor: active ? "rgba(245, 179, 1, 0.08)" : "#fff", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" }}>
                    <TouchableOpacity onPress={() => setSelectedPrevIndex(idx)} style={{ flex: 1, flexDirection: "row", alignItems: "center" }} activeOpacity={0.8}>
                      <View style={{ width: 6, height: 22, borderRadius: 6, marginRight: 10, backgroundColor: active ? "#F5B301" : "rgba(0,0,0,0.08)" }} />
                      <Text style={{ fontWeight: "900", opacity: active ? 1 : 0.75 }}>{p.visitLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setSelectedPrevIndex(idx); setPreviousModalOpen(true); }} style={{ marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 }}>
                      <MaterialCommunityIcons name="eye-outline" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </SpecialtyWorkspaceScaffold>

      <Modal visible={previousModalOpen} transparent animationType="fade" onRequestClose={() => setPreviousModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <View style={{ width: "100%", maxWidth: 920, borderRadius: 10, overflow: "hidden", backgroundColor: theme.colors.surface }}>
            <View style={{ paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary }}>
              <Text style={{ color: "#fff", fontWeight: "900", letterSpacing: 0.5 }}>PREVIOUS CONSULTATION</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>{selectedPrev.visitLabel}</Text>
              <ReadOnlyBlueBox theme={theme} label="Chief dental complaint :" value={selectedPrev.chiefComplaint} multiline />
              <ReadOnlyBlueBox theme={theme} label="Tooth records :" value={selectedPrev.toothRecords} multiline />
              <ReadOnlyBlueBox theme={theme} label="Materials used :" value={selectedPrev.materialsUsed} />
              <ReadOnlyBlueBox theme={theme} label="Next dental step :" value={selectedPrev.nextStep} />
              <ReadOnlyBlueBox theme={theme} label="Notes :" value={selectedPrev.notes} multiline />
            </ScrollView>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", backgroundColor: "rgba(0,0,0,0.02)" }}>
              <TouchableOpacity onPress={() => setPreviousModalOpen(false)} style={{ backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 }}>
                <Text style={{ color: "#fff", fontWeight: "900" }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}
