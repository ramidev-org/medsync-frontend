import { PageShell } from "@/components/page_shell";
import { SpecialtyWorkspaceScaffold } from "@/components/workspaces/SpecialtyWorkspaceScaffold";
import { WorkspaceFlatTabs, WorkspaceInputField, WorkspaceReadOnlyField } from "@/components/workspaces/theme/WorkspaceTheme";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

type FieldDef = { key: string; label: string; multiline?: boolean };
type PreviousSnapshot = { visitLabel: string; values: Record<string, string> };
type Props = {
  pageTitle: string;
  pageSubtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  workspaceTitle: string;
  workspaceSubtitle: string;
  formFields: FieldDef[];
  defaultFields?: FieldDef[];
  initialValues: Record<string, string>;
  historyRows: string[];
  previousSnapshots?: PreviousSnapshot[];
};

type WorkspaceTab = "treatment" | "consultation_observation" | "treatment_history" | "consultation_history";

const FIELD_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  weight_kg: "scale",
  height_cm: "human-male-height",
  temperature_c: "thermometer",
  blood_pressure: "heart-pulse",
  heart_rate: "heart-outline",
  spo2: "water-percent",
  reason_for_visit: "text-box-outline",
  chief_complaint: "stethoscope",
  plan: "clipboard-text-outline",
};


export default function GenericMedicalWorkspacePage(props: Props) {
  const { theme } = useTheme();
  const [workspaceTab, setWorkspaceTab] = React.useState<WorkspaceTab>("consultation_observation");
  const [parameters, setParameters] = React.useState<Record<string, string>>(props.initialValues);
  const [treatmentType, setTreatmentType] = React.useState("follow_up_treatment");
  const [treatmentNote, setTreatmentNote] = React.useState("");
  const [treatmentHistory, setTreatmentHistory] = React.useState<Array<{ id: string; type: string; note: string; createdAt: string }>>([]);
  const [isEditingCurrentParams, setIsEditingCurrentParams] = React.useState(false);
  const [draftCurrentParams, setDraftCurrentParams] = React.useState<Record<string, string> | null>(null);
  const snapshots = React.useMemo<PreviousSnapshot[]>(
    () =>
      props.previousSnapshots && props.previousSnapshots.length
        ? props.previousSnapshots
        : [
            { visitLabel: "Session #3 - Recent", values: props.initialValues },
            { visitLabel: "Session #2 - Previous", values: Object.fromEntries(props.formFields.map((f) => [f.key, ""])) },
            { visitLabel: "Session #1 - Initial", values: Object.fromEntries(props.formFields.map((f) => [f.key, ""])) },
          ],
    [props.previousSnapshots, props.initialValues, props.formFields]
  );
  const [previousModalOpen, setPreviousModalOpen] = React.useState(false);
  const [selectedPrevIndex, setSelectedPrevIndex] = React.useState(0);
  const selectedPrev = snapshots[selectedPrevIndex];

  const defaultFields = React.useMemo<FieldDef[]>(() => {
    if (props.defaultFields) return props.defaultFields;
    return [
      { key: "weight_kg", label: "Weight (kg)" },
      { key: "height_cm", label: "Height (cm)" },
      { key: "temperature_c", label: "Temperature (°C)" },
      { key: "blood_pressure", label: "Blood pressure" },
      { key: "heart_rate", label: "Heart rate (bpm)" },
      { key: "spo2", label: "SpO2 (%)" },
    ];
  }, [props.defaultFields]);

  const defaultFieldKeys = React.useMemo(() => new Set(defaultFields.map((f) => f.key)), [defaultFields]);
  const specialtyFields = React.useMemo(() => props.formFields.filter((f) => !defaultFieldKeys.has(f.key)), [props.formFields, defaultFieldKeys]);

  return (
    <PageShell>
      <SpecialtyWorkspaceScaffold
        theme={theme}
        title={props.workspaceTitle}
        subtitle={props.workspaceSubtitle}
        icon={props.icon}
        stats={[
          { label: "History", value: "Ready", tone: "blue" },
          { label: "Session Fields", value: "Structured", tone: "green" },
          { label: "Specialty", value: "Dynamic", tone: "orange" },
        ]}
      >
        <View style={{ borderWidth: 0, borderRadius: 18, backgroundColor: theme.colors.surface, padding: 14 }}>
          <WorkspaceFlatTabs
            theme={theme}
            tabs={[
              { key: "treatment", label: "Treatment", icon: "medical-bag" },
              { key: "consultation_observation", label: "Consultation / Observation", icon: "clipboard-text-outline" },
              { key: "treatment_history", label: "Treatment History", icon: "history" },
              { key: "consultation_history", label: "Consultation History", icon: "history" },
            ]}
            activeKey={workspaceTab}
            onChange={setWorkspaceTab}
          />

          {workspaceTab === "treatment" && (
            <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.background, padding: 10, gap: 10 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.primary }}>Treatment</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  { key: "follow_up_treatment", label: "Follow-up treatment" },
                  { key: "medication_adjustment", label: "Medication adjustment" },
                  { key: "procedure", label: "Procedure" },
                  { key: "other", label: "Other" },
                ].map((t) => {
                  const active = treatmentType === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
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
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <TouchableOpacity
                  onPress={() => {
                    setTreatmentHistory((rows) => [
                      { id: `${Date.now()}`, type: treatmentType, note: treatmentNote.trim(), createdAt: new Date().toLocaleString() },
                      ...rows,
                    ]);
                    setTreatmentNote("");
                  }}
                  style={{ backgroundColor: theme.colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}
                >
                  <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary, fontSize: 12 }}>Add treatment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {workspaceTab === "treatment_history" && (
            <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.background, padding: 10, gap: 8 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.text }}>Treatment History</Text>
              {treatmentHistory.length > 0 ? (
                treatmentHistory.map((row) => (
                  <View key={row.id} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, backgroundColor: theme.colors.surface }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.text }}>{row.type}</Text>
                    <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>{row.createdAt}</Text>
                    {!!row.note && <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>{row.note}</Text>}
                  </View>
                ))
              ) : props.historyRows.length === 0 ? (
                <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>No treatment history yet.</Text>
              ) : (
                props.historyRows.map((row) => (
                  <View key={row} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, backgroundColor: theme.colors.surface }}>
                    <Text style={{ fontWeight: "800", color: theme.colors.text }}>{row}</Text>
                  </View>
                ))
              )}
            </View>
          )}

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
                        if (draftCurrentParams) setParameters(draftCurrentParams);
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

              {!!defaultFields.length && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>Default consultation criteria</Text>
                  <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                    {defaultFields.map((f) =>
                      isEditingCurrentParams ? (
                        <View key={`default-${f.key}`} style={{ flex: 1, minWidth: 220 }}>
                          <WorkspaceInputField
                            theme={theme}
                            label={`${f.label} :`}
                            value={(draftCurrentParams?.[f.key] ?? "") as string}
                            onChange={(v) => setDraftCurrentParams((s) => ({ ...(s ?? parameters), [f.key]: v }))}
                            multiline={f.multiline}
                            icon={FIELD_ICONS[f.key]}
                          />
                        </View>
                      ) : (
                        <View key={`default-${f.key}`} style={{ flex: 1, minWidth: 220 }}>
                          <WorkspaceReadOnlyField theme={theme} label={`${f.label} :`} value={parameters[f.key] ?? "-"} multiline={f.multiline} icon={FIELD_ICONS[f.key]} />
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: "900", color: theme.colors.text }}>Specialty-specific criteria</Text>
                <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                  {specialtyFields.map((f) =>
                  isEditingCurrentParams ? (
                    <View key={`specialty-${f.key}`} style={{ flex: 1, minWidth: 220 }}>
                      <WorkspaceInputField
                        theme={theme}
                        label={`${f.label} :`}
                        value={(draftCurrentParams?.[f.key] ?? "") as string}
                        onChange={(v) => setDraftCurrentParams((s) => ({ ...(s ?? parameters), [f.key]: v }))}
                        multiline={f.multiline}
                        icon={FIELD_ICONS[f.key] ?? "file-document-edit-outline"}
                      />
                    </View>
                  ) : (
                    <View key={`specialty-${f.key}`} style={{ flex: 1, minWidth: 220 }}>
                      <WorkspaceReadOnlyField theme={theme} label={`${f.label} :`} value={parameters[f.key] ?? "-"} multiline={f.multiline} icon={FIELD_ICONS[f.key] ?? "file-document-outline"} />
                    </View>
                  )
                  )}
                </View>
              </View>
            </>
          )}

          {workspaceTab === "consultation_history" && (
            <View style={{ marginTop: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", borderRadius: 10, overflow: "hidden" }}>
              {snapshots.map((p, idx) => {
                const active = idx === selectedPrevIndex;
                return (
                  <View key={p.visitLabel} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, backgroundColor: active ? theme.colors.warningSoft : theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
                    <TouchableOpacity onPress={() => setSelectedPrevIndex(idx)} style={{ flex: 1, flexDirection: "row", alignItems: "center" }} activeOpacity={0.8}>
                      <View style={{ width: 6, height: 22, borderRadius: 6, marginRight: 10, backgroundColor: active ? theme.colors.warning : theme.colors.border }} />
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
        <View style={{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: "center", justifyContent: "center", padding: 18 }}>
          <View style={{ width: "100%", maxWidth: 920, borderRadius: 10, overflow: "hidden", backgroundColor: theme.colors.surface }}>
            <View style={{ paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary }}>
              <Text style={{ color: "#fff", fontWeight: "900", letterSpacing: 0.5 }}>PREVIOUS PARAMETERS</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>{selectedPrev?.visitLabel}</Text>
              {!!defaultFields.length && (
                <>
                  <Text style={{ marginTop: 10, fontWeight: "900", color: theme.colors.text }}>Default consultation criteria</Text>
                  {defaultFields.map((f) => (
                    <WorkspaceReadOnlyField key={`prev-default-${f.key}`} theme={theme} label={`${f.label} :`} value={selectedPrev?.values?.[f.key] ?? "-"} multiline={f.multiline} icon={FIELD_ICONS[f.key]} />
                  ))}
                </>
              )}
              <Text style={{ marginTop: 10, fontWeight: "900", color: theme.colors.text }}>Specialty-specific criteria</Text>
              {specialtyFields.map((f) => (
                <WorkspaceReadOnlyField key={`prev-specialty-${f.key}`} theme={theme} label={`${f.label} :`} value={selectedPrev?.values?.[f.key] ?? "-"} multiline={f.multiline} icon={FIELD_ICONS[f.key] ?? "file-document-outline"} />
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }}>
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
