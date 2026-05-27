import { PageShell } from "@/components/page_shell";
import { SpecialtyWorkspaceScaffold } from "@/components/workspaces/SpecialtyWorkspaceScaffold";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Body from "react-native-body-highlighter";

type WorkspaceTab = "treatment" | "consultation_observation" | "treatment_history" | "consultation_history";
type BodySide = "front" | "back";
type BodyGender = "male" | "female";
type DermatologyParams = {
  main_skin_complaint: string;
  lesion_body_site: string;
  lesion_morphology: string;
  lesion_evolution: string;
  plan: string;
};

type PrevRow = {
  visitLabel: string;
  main_skin_complaint: string;
  lesion_body_site: string;
  lesion_morphology: string;
  lesion_evolution: string;
  plan: string;
};

const PREVIOUS_ROWS: PrevRow[] = [
  {
    visitLabel: "Session #3 - 12.06.2026",
    main_skin_complaint: "Itching reduced, no new lesions.",
    lesion_body_site: "left forearm, chest",
    lesion_morphology: "plaque, scale",
    lesion_evolution: "Improving after topical treatment.",
    plan: "Continue same protocol for 2 weeks.",
  },
  {
    visitLabel: "Session #2 - 02.06.2026",
    main_skin_complaint: "Persistent rash over trunk.",
    lesion_body_site: "chest, upper-back",
    lesion_morphology: "papule, plaque",
    lesion_evolution: "Slight spread compared to initial visit.",
    plan: "Adjust topical steroid and add emollient.",
  },
];

function Field({ theme, label, value, onChange, multiline }: { theme: any; label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
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

function ReadOnlyField({ theme, label, value, multiline }: { theme: any; label: string; value: string; multiline?: boolean }) {
  return (
    <View style={{ marginTop: 12, flex: 1 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: "900", marginBottom: 6 }}>{label}</Text>
      <View style={{ borderWidth: 2, borderColor: "rgba(0, 140, 255, 0.35)", borderRadius: 10, padding: 12, minHeight: multiline ? 88 : 56, backgroundColor: theme.colors.background, justifyContent: "center" }}>
        <Text style={{ fontWeight: "900", opacity: 0.75 }}>{value || "-"}</Text>
      </View>
    </View>
  );
}

export default function DermatologyWorkspacePage() {
  const { theme } = useTheme();
  const [tab, setTab] = React.useState<WorkspaceTab>("consultation_observation");
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<DermatologyParams | null>(null);
  const [params, setParams] = React.useState<DermatologyParams>({
    main_skin_complaint: "",
    lesion_body_site: "",
    lesion_morphology: "",
    lesion_evolution: "",
    plan: "",
  });
  const [gender, setGender] = React.useState<BodyGender>("female");
  const [side, setSide] = React.useState<BodySide>("front");
  const [selectedZones, setSelectedZones] = React.useState<string[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);
  const [selectedHistory, setSelectedHistory] = React.useState(0);
  const [treatmentNote, setTreatmentNote] = React.useState("");
  const [treatments, setTreatments] = React.useState<Array<{ id: string; note: string; createdAt: string }>>([]);

  const bodyData = selectedZones.map((slug) => ({ slug, intensity: 2 as const }));

  return (
    <PageShell>
      <SpecialtyWorkspaceScaffold
        theme={theme}
        title="Dermatology Desk"
        subtitle="Lesion mapping, morphology, and longitudinal follow-up."
        icon="face-man-outline"
        stats={[
          { label: "Body map", value: "Interactive", tone: "blue" },
          { label: "Consultation", value: "Dermatology", tone: "green" },
          { label: "History", value: "Structured", tone: "orange" },
        ]}
      >
        <View style={{ borderRadius: 18, backgroundColor: theme.colors.surface, padding: 14 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            {[
              { key: "treatment", label: "Treatment", icon: "medical-bag" },
              { key: "consultation_observation", label: "Consultation / Observation", icon: "clipboard-text-outline" },
              { key: "treatment_history", label: "Treatment History", icon: "history" },
              { key: "consultation_history", label: "Consultation History", icon: "history" },
            ].map((t) => {
              const active = tab === (t.key as WorkspaceTab);
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setTab(t.key as WorkspaceTab)}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1, backgroundColor: active ? theme.colors.surface : theme.colors.surfaceVariant, borderColor: active ? theme.colors.border : "transparent" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MaterialCommunityIcons name={t.icon as any} size={15} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text style={{ fontWeight: "900", opacity: active ? 1 : 0.75 }}>{t.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {tab === "treatment" && (
            <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.background, padding: 10, gap: 8 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.text }}>Treatment</Text>
              <Field theme={theme} label="Treatment note" value={treatmentNote} onChange={setTreatmentNote} multiline />
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <TouchableOpacity
                  onPress={() => {
                    const note = treatmentNote.trim();
                    if (!note) return;
                    setTreatments((rows) => [{ id: `${Date.now()}`, note, createdAt: new Date().toLocaleString() }, ...rows]);
                    setTreatmentNote("");
                  }}
                  style={{ backgroundColor: theme.colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}
                >
                  <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary, fontSize: 12 }}>Add treatment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {tab === "consultation_observation" && (
            <>
              <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.background, padding: 10, marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>Anatomy zone map</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity onPress={() => setSide((s) => (s === "front" ? "back" : "front"))} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>Side: {side}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setGender((g) => (g === "male" ? "female" : "male"))} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>Gender: {gender}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ marginTop: 8, alignItems: "center", justifyContent: "center" }}>
                  <Body
                    data={bodyData as any}
                    side={side}
                    gender={gender}
                    scale={1.45}
                    border="#dbe3f2"
                    onBodyPartPress={(part: any) => {
                      const slug = String(part?.slug ?? "").trim();
                      if (!slug) return;
                      setSelectedZones((prev) => (prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug]));
                    }}
                  />
                </View>
                <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {selectedZones.length === 0 ? (
                    <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>No selected zones.</Text>
                  ) : (
                    selectedZones.map((z) => (
                      <View key={z} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.surface }}>
                        <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>{z}</Text>
                      </View>
                    ))
                  )}
                </View>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const joined = selectedZones.join(", ");
                      if (editing) setDraft((d) => ({ ...(d ?? params), lesion_body_site: joined }));
                      else setParams((p) => ({ ...p, lesion_body_site: joined }));
                    }}
                    style={{ backgroundColor: theme.colors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary, fontSize: 12 }}>Use zones in lesion body site</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 4 }}>
                {!editing ? (
                  <TouchableOpacity
                    style={{ backgroundColor: theme.colors.warning, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
                    onPress={() => {
                      setDraft({ ...params });
                      setEditing(true);
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: "#fff", fontSize: 12 }}>EDIT PARAMETERS</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: theme.colors.success, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
                      onPress={() => {
                        if (draft) setParams(draft);
                        setDraft(null);
                        setEditing(false);
                      }}
                    >
                      <Text style={{ fontWeight: "900", color: "#fff", fontSize: 12 }}>CONFIRM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: theme.colors.textSecondary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
                      onPress={() => {
                        setDraft(null);
                        setEditing(false);
                      }}
                    >
                      <Text style={{ fontWeight: "900", color: "#fff", fontSize: 12 }}>CANCEL</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {editing ? (
                <>
                  <Field theme={theme} label="Main skin complaint :" value={draft?.main_skin_complaint ?? ""} onChange={(v) => setDraft((d) => ({ ...(d ?? params), main_skin_complaint: v }))} multiline />
                  <Field theme={theme} label="Lesion body site :" value={draft?.lesion_body_site ?? ""} onChange={(v) => setDraft((d) => ({ ...(d ?? params), lesion_body_site: v }))} />
                  <Field theme={theme} label="Lesion morphology :" value={draft?.lesion_morphology ?? ""} onChange={(v) => setDraft((d) => ({ ...(d ?? params), lesion_morphology: v }))} />
                  <Field theme={theme} label="Lesion evolution :" value={draft?.lesion_evolution ?? ""} onChange={(v) => setDraft((d) => ({ ...(d ?? params), lesion_evolution: v }))} multiline />
                  <Field theme={theme} label="Plan :" value={draft?.plan ?? ""} onChange={(v) => setDraft((d) => ({ ...(d ?? params), plan: v }))} multiline />
                </>
              ) : (
                <>
                  <ReadOnlyField theme={theme} label="Main skin complaint :" value={params.main_skin_complaint} multiline />
                  <ReadOnlyField theme={theme} label="Lesion body site :" value={params.lesion_body_site} />
                  <ReadOnlyField theme={theme} label="Lesion morphology :" value={params.lesion_morphology} />
                  <ReadOnlyField theme={theme} label="Lesion evolution :" value={params.lesion_evolution} multiline />
                  <ReadOnlyField theme={theme} label="Plan :" value={params.plan} multiline />
                </>
              )}
            </>
          )}

          {tab === "treatment_history" && (
            <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.background, padding: 10, gap: 8 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.text }}>Treatment History</Text>
              {treatments.length === 0 ? (
                <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>No treatments yet.</Text>
              ) : (
                treatments.map((t) => (
                  <View key={t.id} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, backgroundColor: theme.colors.surface }}>
                    <Text style={{ fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>{t.createdAt}</Text>
                    <Text style={{ marginTop: 4, fontWeight: "800", color: theme.colors.text }}>{t.note}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {tab === "consultation_history" && (
            <View style={{ marginTop: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.10)", borderRadius: 10, overflow: "hidden" }}>
              {PREVIOUS_ROWS.map((row, idx) => {
                const active = idx === selectedHistory;
                return (
                  <View key={row.visitLabel} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, backgroundColor: active ? "rgba(245, 179, 1, 0.08)" : "#fff", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" }}>
                    <TouchableOpacity onPress={() => setSelectedHistory(idx)} style={{ flex: 1, flexDirection: "row", alignItems: "center" }} activeOpacity={0.8}>
                      <View style={{ width: 6, height: 22, borderRadius: 6, marginRight: 10, backgroundColor: active ? "#F5B301" : "rgba(0,0,0,0.08)" }} />
                      <Text style={{ fontWeight: "900", opacity: active ? 1 : 0.75 }}>{row.visitLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setSelectedHistory(idx); setHistoryModalOpen(true); }} style={{ marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 6 }}>
                      <MaterialCommunityIcons name="eye-outline" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </SpecialtyWorkspaceScaffold>

      <Modal visible={historyModalOpen} transparent animationType="fade" onRequestClose={() => setHistoryModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <View style={{ width: "100%", maxWidth: 920, borderRadius: 10, overflow: "hidden", backgroundColor: theme.colors.surface }}>
            <View style={{ paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary }}>
              <Text style={{ color: "#fff", fontWeight: "900", letterSpacing: 0.5 }}>PREVIOUS CONSULTATION</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>{PREVIOUS_ROWS[selectedHistory]?.visitLabel}</Text>
              <ReadOnlyField theme={theme} label="Main skin complaint :" value={PREVIOUS_ROWS[selectedHistory]?.main_skin_complaint ?? "-"} multiline />
              <ReadOnlyField theme={theme} label="Lesion body site :" value={PREVIOUS_ROWS[selectedHistory]?.lesion_body_site ?? "-"} />
              <ReadOnlyField theme={theme} label="Lesion morphology :" value={PREVIOUS_ROWS[selectedHistory]?.lesion_morphology ?? "-"} />
              <ReadOnlyField theme={theme} label="Lesion evolution :" value={PREVIOUS_ROWS[selectedHistory]?.lesion_evolution ?? "-"} multiline />
              <ReadOnlyField theme={theme} label="Plan :" value={PREVIOUS_ROWS[selectedHistory]?.plan ?? "-"} multiline />
            </ScrollView>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", backgroundColor: "rgba(0,0,0,0.02)" }}>
              <TouchableOpacity onPress={() => setHistoryModalOpen(false)} style={{ backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 }}>
                <Text style={{ color: "#fff", fontWeight: "900" }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}
