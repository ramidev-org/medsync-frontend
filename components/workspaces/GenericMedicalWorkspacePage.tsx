import { PageShell } from "@/components/page_shell";
import { SpecialtyWorkspaceScaffold } from "@/components/workspaces/SpecialtyWorkspaceScaffold";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

type FieldDef = { key: string; label: string; multiline?: boolean };
type PreviousSnapshot = { visitLabel: string; values: Record<string, string> };
type Props = {
  pageTitle: string;
  pageSubtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  workspaceTitle: string;
  workspaceSubtitle: string;
  formFields: FieldDef[];
  initialValues: Record<string, string>;
  historyRows: string[];
  previousSnapshots?: PreviousSnapshot[];
};

type WorkspaceTab = "treatment" | "consultation_observation" | "treatment_history" | "consultation_history";

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

function BlueField({ theme, label, value, onChange, multiline }: { theme: any; label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <View style={{ marginTop: 12, flex: 1 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: "900", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={!!multiline}
        style={{
          borderWidth: 2,
          borderColor: "rgba(0, 140, 255, 0.35)",
          borderRadius: 10,
          padding: 12,
          minHeight: multiline ? 88 : 56,
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          textAlignVertical: multiline ? "top" : "center",
          fontWeight: "700",
        }}
      />
    </View>
  );
}


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
          <FlatTabs
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
              <BlueField theme={theme} label="Treatment note :" value={treatmentNote} onChange={setTreatmentNote} multiline />
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

              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                {props.formFields.map((f) =>
                  isEditingCurrentParams ? (
                    <View key={f.key} style={{ flex: 1, minWidth: 220 }}>
                      <BlueField
                        theme={theme}
                        label={`${f.label} :`}
                        value={(draftCurrentParams?.[f.key] ?? "") as string}
                        onChange={(v) => setDraftCurrentParams((s) => ({ ...(s ?? parameters), [f.key]: v }))}
                        multiline={f.multiline}
                      />
                    </View>
                  ) : (
                    <View key={f.key} style={{ flex: 1, minWidth: 220 }}>
                      <ReadOnlyBlueBox theme={theme} label={`${f.label} :`} value={parameters[f.key] ?? "-"} multiline={f.multiline} />
                    </View>
                  )
                )}
              </View>
            </>
          )}

          {workspaceTab === "consultation_history" && (
            <View style={{ marginTop: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", borderRadius: 10, overflow: "hidden" }}>
              {snapshots.map((p, idx) => {
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
              <Text style={{ color: "#fff", fontWeight: "900", letterSpacing: 0.5 }}>PREVIOUS PARAMETERS</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>{selectedPrev?.visitLabel}</Text>
              {(props.formFields ?? []).map((f) => (
                <ReadOnlyBlueBox key={f.key} theme={theme} label={`${f.label} :`} value={selectedPrev?.values?.[f.key] ?? "-"} multiline={f.multiline} />
              ))}
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
