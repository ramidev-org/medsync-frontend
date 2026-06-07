import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { WorkspaceFlatTabs, WorkspaceInputField, WorkspaceReadOnlyField } from "@/components/workspaces/theme/WorkspaceTheme";
import { FIELD_ICON_MAP, getTreatmentExtraFields } from "./_observation_fields";
import { CardiologyTab, type CardiologyState } from "./observation_specialities/_cardiologie";
import { DentistryTab, type DentistryState } from "./observation_specialities/_dentistry";
import { DermatologyTab, type DermatologyState } from "./observation_specialities/_dermatologie";
import { GynecologyTab, type GynecologyState } from "./observation_specialities/_gynecologie";
import { OrthopedicsTab, type OrthopedicsState } from "./observation_specialities/_orthopedie";

type TreatmentViewTab = "summary" | "history";

type TreatmentHistoryRow = {
  id: string;
  type: string;
  note: string;
  createdAt: string;
  workspace: string;
  extra?: Record<string, string>;
  specialtySnapshot?: any;
};

type SpecialitiesState = {
  gynecology: GynecologyState;
  cardiology: CardiologyState;
  dermatology: DermatologyState;
  orthopedics: OrthopedicsState;
  dentistry: DentistryState;
};

const TREATMENT_OPTIONS_BY_SPECIALTY: Record<string, Array<{ key: string; label: string }>> = {
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

const SIDEBAR_TABS: Array<{
  key: TreatmentViewTab;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}> = [
  { key: "summary", label: "Résumé", icon: "text-box-check-outline" },
  { key: "history", label: "Traitements", icon: "clipboard-list-outline" },
];

export default function TreatmentTab({
  theme,
  workspaceKey,
}: {
  theme: any;
  workspaceKey: string;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [activeView, setActiveView] = React.useState<TreatmentViewTab>("summary");
  const [selectedWorkspace, setSelectedWorkspace] = React.useState(workspaceKey || "general_medicine");
  const [treatmentType, setTreatmentType] = React.useState("follow_up_treatment");
  const [treatmentNote, setTreatmentNote] = React.useState("");
  const [treatmentExtra, setTreatmentExtra] = React.useState<Record<string, string>>({});
  const [treatmentHistory, setTreatmentHistory] = React.useState<TreatmentHistoryRow[]>([]);
  const [treatmentCreateOpen, setTreatmentCreateOpen] = React.useState(false);
  const [treatmentViewId, setTreatmentViewId] = React.useState<string | null>(null);
  const [treatmentModalTab, setTreatmentModalTab] = React.useState<"core" | "specialty">("core");
  const [treatmentViewTab, setTreatmentViewTab] = React.useState<"core" | "specialty">("core");
  const [specialities, setSpecialities] = React.useState<SpecialitiesState>({
    gynecology: {},
    cardiology: {},
    dermatology: {},
    orthopedics: {},
    dentistry: {},
  });

  React.useEffect(() => {
    setSelectedWorkspace(workspaceKey || "general_medicine");
  }, [workspaceKey]);

  const treatmentOptions =
    TREATMENT_OPTIONS_BY_SPECIALTY[selectedWorkspace] ?? TREATMENT_OPTIONS_BY_SPECIALTY.default;

  React.useEffect(() => {
    if (!treatmentOptions.some((item) => item.key === treatmentType)) {
      setTreatmentType(treatmentOptions[0]?.key ?? "follow_up_treatment");
    }
  }, [treatmentOptions, treatmentType]);

  const treatmentTypeLabel = React.useCallback(
    (key: string, workspace = selectedWorkspace) =>
      (
        TREATMENT_OPTIONS_BY_SPECIALTY[workspace] ??
        TREATMENT_OPTIONS_BY_SPECIALTY.default
      ).find((item) => item.key === key)?.label || key,
    [selectedWorkspace],
  );

  const hasSpecialtyWidgetTab = ["gynecology", "cardiology", "dermatology", "orthopedics", "dentistry"].includes(
    selectedWorkspace,
  );

  const renderSpecialtyDialogPanel = React.useCallback(() => {
    if (selectedWorkspace === "gynecology") {
      return (
        <GynecologyTab
          theme={theme}
          onModifyLabel={() => {}}
          value={specialities.gynecology}
          onChange={(next) => setSpecialities((prev) => ({ ...prev, gynecology: next }))}
        />
      );
    }
    if (selectedWorkspace === "cardiology") {
      return (
        <CardiologyTab
          theme={theme}
          value={specialities.cardiology}
          onChange={(next) => setSpecialities((prev) => ({ ...prev, cardiology: next }))}
        />
      );
    }
    if (selectedWorkspace === "dermatology") {
      return (
        <DermatologyTab
          theme={theme}
          value={specialities.dermatology}
          onChange={(next) => setSpecialities((prev) => ({ ...prev, dermatology: next }))}
        />
      );
    }
    if (selectedWorkspace === "orthopedics") {
      return (
        <OrthopedicsTab
          theme={theme}
          value={specialities.orthopedics}
          onChange={(next) => setSpecialities((prev) => ({ ...prev, orthopedics: next }))}
        />
      );
    }
    if (selectedWorkspace === "dentistry") {
      return (
        <DentistryTab
          theme={theme}
          value={specialities.dentistry}
          onChange={(next) => setSpecialities((prev) => ({ ...prev, dentistry: next }))}
        />
      );
    }
    return null;
  }, [selectedWorkspace, specialities, theme]);

  const rows = treatmentHistory.length
    ? treatmentHistory
    : [
        {
          id: "seed-1",
          type: "follow_up_treatment",
          note: "Initial treatment session.",
          createdAt: "Session #1 - Recent",
          workspace: selectedWorkspace,
        },
      ];

  const latestRow = rows[0] ?? null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Traitements</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Plan de soin, procedures et suivi therapeutique.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setTreatmentModalTab("core");
            setTreatmentCreateOpen(true);
          }}
          style={[styles.actionBtn, { backgroundColor: theme.colors.info }]}
        >
          <Text style={[styles.actionBtnText, { color: theme.colors.textOnPrimary }]}>+ Nouveau traitement</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={[styles.sidebar, { backgroundColor: theme.colors.surfaceVariant }]}>
          {SIDEBAR_TABS.map((tab) => {
            const active = tab.key === activeView;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveView(tab.key)}
                style={[
                  styles.sidebarItem,
                  {
                    backgroundColor: active ? theme.colors.surface : "transparent",
                    borderColor: active ? theme.colors.border : "transparent",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={18}
                  color={active ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={{
                    fontWeight: "900",
                    color: active ? theme.colors.primary : theme.colors.textSecondary,
                    fontSize: 14,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1 }}>
          {activeView === "summary" && latestRow ? (
            <View style={{ gap: 12 }}>
              <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Résumé du traitement</Text>
              <View style={styles.metricRow}>
                <SummaryCard
                  theme={theme}
                  title={treatmentTypeLabel(latestRow.type, latestRow.workspace)}
                  subtitle="Traitement actif"
                />
                <SummaryCard theme={theme} title={latestRow.createdAt} subtitle="Dernière mise à jour" />
              </View>
              <View style={styles.metricRow}>
                <SummaryCard theme={theme} title={String(rows.length)} subtitle="Nombre de traitements" />
                <SummaryCard theme={theme} title={selectedWorkspace.replaceAll("_", " ")} subtitle="Workspace" />
              </View>
              <View style={[styles.detailCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.detailTitle, { color: theme.colors.text }]}>Dernière note</Text>
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  {latestRow.note || "Aucune note de traitement pour le moment."}
                </Text>
              </View>
              {getTreatmentExtraFields(latestRow.workspace)
                .filter((field) => latestRow.extra?.[field.key])
                .length ? (
                <View style={[styles.detailCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.detailTitle, { color: theme.colors.text }]}>Critères enregistrés</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                    {getTreatmentExtraFields(latestRow.workspace)
                      .filter((field) => latestRow.extra?.[field.key])
                      .map((field) => (
                        <View key={`${latestRow.id}-${field.key}`} style={{ flex: 1, minWidth: 220 }}>
                          <WorkspaceReadOnlyField
                            theme={theme}
                            label={field.label}
                            value={String(latestRow.extra?.[field.key] ?? "-")}
                            multiline={!!field.multiline}
                            icon={FIELD_ICON_MAP[field.key] ?? "file-document-outline"}
                          />
                        </View>
                      ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Historique des traitements</Text>
              <View style={[styles.listCard, { borderColor: theme.colors.border }]}>
                {rows.map((row, index) => (
                  <View
                    key={row.id}
                    style={[
                      styles.listRow,
                      {
                        backgroundColor: index === 0 ? theme.colors.primarySoft : theme.colors.surface,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 24,
                        borderRadius: 6,
                        marginRight: 10,
                        backgroundColor: index === 0 ? theme.colors.info : theme.colors.border,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                        {treatmentTypeLabel(row.type, row.workspace)}
                      </Text>
                      <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>
                        {row.createdAt}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setTreatmentViewTab("core");
                        setTreatmentViewId(row.id);
                      }}
                      style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      <Modal visible={treatmentCreateOpen} transparent animationType="fade" onRequestClose={() => setTreatmentCreateOpen(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.modalHeaderText, { color: theme.colors.textOnPrimary }]}>Nouveau traitement</Text>
            </View>
            {(
              [
                { key: "core", label: "Treatment form", icon: "clipboard-text-outline" },
                ...(hasSpecialtyWidgetTab
                  ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const)
                  : []),
              ] as const
            ).length > 1 ? (
              <View style={styles.modalTabs}>
                <WorkspaceFlatTabs
                  theme={theme}
                  tabs={[
                    { key: "core", label: "Treatment form", icon: "clipboard-text-outline" },
                    ...(hasSpecialtyWidgetTab
                      ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const)
                      : []),
                  ]}
                  activeKey={treatmentModalTab}
                  onChange={(key: any) => setTreatmentModalTab(key)}
                />
              </View>
            ) : null}
            <ScrollView contentContainerStyle={styles.modalBody}>
              {treatmentModalTab === "core" ? (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {treatmentOptions.map((option) => {
                      const active = treatmentType === option.key;
                      return (
                        <TouchableOpacity
                          key={option.key}
                          onPress={() => setTreatmentType(option.key)}
                          style={{
                            borderWidth: 1,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                            borderRadius: 999,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "900",
                              color: active ? theme.colors.primary : theme.colors.textSecondary,
                              fontSize: 12,
                            }}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <WorkspaceInputField
                    theme={theme}
                    label="Treatment note :"
                    value={treatmentNote}
                    onChange={setTreatmentNote}
                    multiline
                    icon="notebook-edit-outline"
                  />
                  {getTreatmentExtraFields(selectedWorkspace).map((field) => (
                    <WorkspaceInputField
                      key={`${selectedWorkspace}-${field.key}`}
                      theme={theme}
                      label={field.label}
                      value={treatmentExtra[field.key] ?? ""}
                      onChange={(value) => setTreatmentExtra((prev) => ({ ...prev, [field.key]: value }))}
                      multiline={!!field.multiline}
                      icon={FIELD_ICON_MAP[field.key] ?? "file-document-edit-outline"}
                    />
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 10,
                    backgroundColor: theme.colors.background,
                    padding: 8,
                  }}
                >
                  {renderSpecialtyDialogPanel()}
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setTreatmentCreateOpen(false)}
                style={[styles.modalGhostBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setTreatmentHistory((prev) => [
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
                    ...prev,
                  ]);
                  setTreatmentNote("");
                  setTreatmentExtra({});
                  setTreatmentCreateOpen(false);
                  setActiveView("history");
                }}
                style={[styles.modalPrimaryBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary }}>Add treatment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!treatmentViewId} transparent animationType="fade" onRequestClose={() => setTreatmentViewId(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.modalHeaderText, { color: theme.colors.textOnPrimary }]}>Treatment View</Text>
            </View>
            {(
              [
                { key: "core", label: "Treatment form", icon: "clipboard-text-outline" },
                ...(hasSpecialtyWidgetTab
                  ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const)
                  : []),
              ] as const
            ).length > 1 ? (
              <View style={styles.modalTabs}>
                <WorkspaceFlatTabs
                  theme={theme}
                  tabs={[
                    { key: "core", label: "Treatment form", icon: "clipboard-text-outline" },
                    ...(hasSpecialtyWidgetTab
                      ? ([{ key: "specialty", label: "Specialty widgets", icon: "stethoscope" }] as const)
                      : []),
                  ]}
                  activeKey={treatmentViewTab}
                  onChange={(key: any) => setTreatmentViewTab(key)}
                />
              </View>
            ) : null}
            <ScrollView contentContainerStyle={styles.modalBody}>
              {(() => {
                const row = rows.find((entry) => entry.id === treatmentViewId) ?? null;
                if (!row) {
                  return <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>Not found</Text>;
                }

                return treatmentViewTab === "core" ? (
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      {(TREATMENT_OPTIONS_BY_SPECIALTY[row.workspace] ?? TREATMENT_OPTIONS_BY_SPECIALTY.default).map(
                        (option) => {
                          const active = row.type === option.key;
                          return (
                            <View
                              key={`view-${option.key}`}
                              style={{
                                borderWidth: 1,
                                borderColor: active ? theme.colors.primary : theme.colors.border,
                                backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                                borderRadius: 999,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontWeight: "900",
                                  color: active ? theme.colors.primary : theme.colors.textSecondary,
                                  fontSize: 12,
                                }}
                              >
                                {option.label}
                              </Text>
                            </View>
                          );
                        },
                      )}
                    </View>
                    <WorkspaceReadOnlyField
                      theme={theme}
                      label="Treatment note :"
                      value={row.note || "-"}
                      multiline
                      icon="notebook-outline"
                    />
                    {getTreatmentExtraFields(row.workspace)
                      .filter((field) => row.extra?.[field.key])
                      .map((field) => (
                        <WorkspaceReadOnlyField
                          key={`${row.id}-${field.key}`}
                          theme={theme}
                          label={field.label}
                          value={String(row.extra?.[field.key] ?? "-")}
                          multiline={!!field.multiline}
                          icon={FIELD_ICON_MAP[field.key] ?? "file-document-outline"}
                        />
                      ))}
                  </View>
                ) : (
                  <View
                    pointerEvents="none"
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: 10,
                      backgroundColor: theme.colors.background,
                      padding: 8,
                    }}
                  >
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
                );
              })()}
            </ScrollView>
            <View style={[styles.modalFooter, { justifyContent: "flex-end" }]}>
              <TouchableOpacity
                onPress={() => setTreatmentViewId(null)}
                style={[styles.modalPrimaryBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={{ fontWeight: "900", color: theme.colors.textOnPrimary }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryCard({ theme, title, subtitle }: { theme: any; title: string; subtitle: string }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 220,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ color: theme.colors.text, fontWeight: "900", fontSize: 16 }}>{title}</Text>
      <Text style={{ color: theme.colors.textSecondary, marginTop: 6, fontWeight: "700", fontSize: 13 }}>
        {subtitle}
      </Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    wrap: {
      gap: 18,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: "900",
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
    },
    actionBtn: {
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 11,
    },
    actionBtnText: {
      fontWeight: "900",
      fontSize: 14,
    },
    body: {
      flexDirection: "row",
      gap: 18,
      alignItems: "stretch",
    },
    sidebar: {
      width: 220,
      borderRadius: 20,
      padding: 14,
      gap: 8,
      alignSelf: "stretch",
    },
    sidebarItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    panelTitle: {
      fontSize: 18,
      fontWeight: "900",
    },
    metricRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    detailCard: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 16,
    },
    detailTitle: {
      fontWeight: "900",
      fontSize: 16,
      marginBottom: 6,
    },
    detailText: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "700",
    },
    listCard: {
      borderWidth: 1,
      borderRadius: 16,
      overflow: "hidden",
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    modalBackdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 1100,
      maxHeight: "92%",
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
    },
    modalHeader: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    modalHeaderText: {
      fontWeight: "900",
      fontSize: 16,
    },
    modalTabs: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    modalBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 12,
    },
    modalFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    modalGhostBtn: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    modalPrimaryBtn: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
  });
