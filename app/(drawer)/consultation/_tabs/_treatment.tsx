import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { FIELD_ICON_MAP, getTreatmentExtraFields, getTreatmentOptions } from "@/components/consultation/observation_fields";
import { WorkspaceInputField, WorkspaceReadOnlyField } from "@/components/workspaces/theme/WorkspaceTheme";
import { CardiologyTab, type CardiologyState } from "./observation_specialities/_cardiologie";
import { DentistryTab, type DentistryState } from "./observation_specialities/_dentistry";
import { DermatologyTab, type DermatologyState } from "./observation_specialities/_dermatologie";
import { GynecologyTab, type GynecologyState } from "./observation_specialities/_gynecologie";
import { OrthopedicsTab, type OrthopedicsState } from "./observation_specialities/_orthopedie";
import { SelectionCard } from "./_ui";

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

const SIDEBAR_TABS: Array<{
  key: TreatmentViewTab;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}> = [
  { key: "summary", label: "Resume", icon: "text-box-check-outline" },
  { key: "history", label: "Traitements", icon: "clipboard-list-outline" },
];

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

function renderSpecialtyReadonly(theme: any, row: TreatmentHistoryRow | null) {
  if (!row?.specialtySnapshot) return null;

  if (row.workspace === "gynecology") {
    return <GynecologyTab theme={theme} onModifyLabel={() => {}} value={row.specialtySnapshot} onChange={() => {}} />;
  }
  if (row.workspace === "cardiology") {
    return <CardiologyTab theme={theme} value={row.specialtySnapshot} onChange={() => {}} />;
  }
  if (row.workspace === "dermatology") {
    return <DermatologyTab theme={theme} value={row.specialtySnapshot} onChange={() => {}} />;
  }
  if (row.workspace === "orthopedics") {
    return <OrthopedicsTab theme={theme} value={row.specialtySnapshot} onChange={() => {}} />;
  }
  if (row.workspace === "dentistry") {
    return <DentistryTab theme={theme} value={row.specialtySnapshot} onChange={() => {}} />;
  }
  return null;
}

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
  const [isEditingCurrentTreatment, setIsEditingCurrentTreatment] = React.useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = React.useState<string | null>("current-treatment");
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

  const treatmentOptions = React.useMemo(() => getTreatmentOptions(selectedWorkspace), [selectedWorkspace]);

  React.useEffect(() => {
    if (!treatmentOptions.some((item) => item.key === treatmentType)) {
      setTreatmentType(treatmentOptions[0]?.key ?? "follow_up_treatment");
    }
  }, [treatmentOptions, treatmentType]);

  const treatmentTypeLabel = React.useCallback(
    (key: string, workspace = selectedWorkspace) => getTreatmentOptions(workspace).find((item) => item.key === key)?.label || key,
    [selectedWorkspace],
  );

  const hasSpecialtyWidgetTab = ["gynecology", "cardiology", "dermatology", "orthopedics", "dentistry"].includes(
    selectedWorkspace,
  );

  const renderSpecialtyEditor = React.useCallback(() => {
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

  const currentTreatmentRow = React.useMemo<TreatmentHistoryRow>(
    () => ({
      id: "current-treatment",
      type: treatmentType,
      note: treatmentNote.trim(),
      createdAt: treatmentHistory.find((row) => row.id === "current-treatment")?.createdAt || "Consultation en cours",
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
    }),
    [selectedWorkspace, specialities, treatmentExtra, treatmentHistory, treatmentNote, treatmentType],
  );

  const historyRows = React.useMemo(() => {
    const previousRows = treatmentHistory.filter((row) => row.id !== "current-treatment");
    if (currentTreatmentRow.note || Object.keys(currentTreatmentRow.extra ?? {}).length) {
      return [currentTreatmentRow, ...previousRows];
    }
    return treatmentHistory.length
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
  }, [currentTreatmentRow, selectedWorkspace, treatmentHistory]);

  const selectedHistoryRow = historyRows.find((row) => row.id === selectedHistoryId) ?? null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Traitements</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Plan de soin, procedures et suivi therapeutique.
          </Text>
        </View>
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
          {activeView === "summary" ? (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Resume du traitement</Text>
                {!isEditingCurrentTreatment ? (
                  <TouchableOpacity
                    onPress={() => setIsEditingCurrentTreatment(true)}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.info }]}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.colors.textOnPrimary }]}>Modifier le traitement</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <TouchableOpacity
                      onPress={() => setIsEditingCurrentTreatment(false)}
                      style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                    >
                      <Text style={[styles.actionBtnText, { color: theme.colors.textSecondary }]}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const savedRow: TreatmentHistoryRow = {
                          ...currentTreatmentRow,
                          createdAt: new Date().toLocaleString(),
                        };
                        setTreatmentHistory((prev) => {
                          const previousRows = prev.filter((row) => row.id !== "current-treatment");
                          return [savedRow, ...previousRows];
                        });
                        setSelectedHistoryId(savedRow.id);
                        setIsEditingCurrentTreatment(false);
                      }}
                      style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
                    >
                      <Text style={[styles.actionBtnText, { color: theme.colors.textOnPrimary }]}>Enregistrer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.metricRow}>
                <SummaryCard
                  theme={theme}
                  title={treatmentTypeLabel(currentTreatmentRow.type, currentTreatmentRow.workspace)}
                  subtitle="Traitement actif"
                />
                <SummaryCard theme={theme} title={currentTreatmentRow.createdAt} subtitle="Derniere mise a jour" />
              </View>

              <View style={styles.metricRow}>
                <SummaryCard theme={theme} title={String(historyRows.length)} subtitle="Nombre de traitements" />
                <SummaryCard theme={theme} title={selectedWorkspace.replaceAll("_", " ")} subtitle="Workspace" />
              </View>

              <View style={[styles.detailCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.detailTitle, { color: theme.colors.text }]}>Derniere note</Text>
                {isEditingCurrentTreatment ? (
                  <WorkspaceInputField
                    theme={theme}
                    label="Treatment note :"
                    value={treatmentNote}
                    onChange={setTreatmentNote}
                    multiline
                    icon="notebook-edit-outline"
                  />
                ) : (
                  <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                    {currentTreatmentRow.note || "Aucune note de traitement pour le moment."}
                  </Text>
                )}
              </View>

              {isEditingCurrentTreatment ? (
                <View style={[styles.detailCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.detailTitle, { color: theme.colors.text }]}>Critères du traitement actuel</Text>
                  <View style={{ marginTop: 8, gap: 12 }}>
                    <View style={styles.optionGrid}>
                      {treatmentOptions.map((option) => {
                        return (
                          <SelectionCard
                            key={option.key}
                            theme={theme}
                            icon={option.icon}
                            title={option.label}
                            description={option.description}
                            active={treatmentType === option.key}
                            onPress={() => setTreatmentType(option.key)}
                          />
                        );
                      })}
                    </View>
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
                </View>
              ) : getTreatmentExtraFields(currentTreatmentRow.workspace)
                  .filter((field) => currentTreatmentRow.extra?.[field.key])
                  .length ? (
                <View style={[styles.detailCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.detailTitle, { color: theme.colors.text }]}>Critères enregistrés</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                    {getTreatmentExtraFields(currentTreatmentRow.workspace)
                      .filter((field) => currentTreatmentRow.extra?.[field.key])
                      .map((field) => (
                        <View key={`${currentTreatmentRow.id}-${field.key}`} style={{ flex: 1, minWidth: 220 }}>
                          <WorkspaceReadOnlyField
                            theme={theme}
                            label={field.label}
                            value={String(currentTreatmentRow.extra?.[field.key] ?? "-")}
                            multiline={!!field.multiline}
                            icon={FIELD_ICON_MAP[field.key] ?? "file-document-outline"}
                          />
                        </View>
                      ))}
                  </View>
                </View>
              ) : null}

              {isEditingCurrentTreatment && hasSpecialtyWidgetTab ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 10,
                    backgroundColor: theme.colors.background,
                    padding: 8,
                  }}
                >
                  {renderSpecialtyEditor()}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Historique des traitements</Text>
              <View style={[styles.listCard, { borderColor: theme.colors.border }]}>
                {historyRows.map((row) => {
                  const active = row.id === selectedHistoryRow?.id;
                  return (
                    <View
                      key={row.id}
                      style={[
                        styles.listRow,
                        {
                          backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
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
                          backgroundColor: active ? theme.colors.info : theme.colors.border,
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => setSelectedHistoryId((current) => (current === row.id ? null : row.id))}
                        style={{ flex: 1 }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                          {treatmentTypeLabel(row.type, row.workspace)}
                        </Text>
                        <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>
                          {row.createdAt}
                        </Text>
                      </TouchableOpacity>
                      <MaterialCommunityIcons name={active ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.textSecondary} />
                      {active ? (
                        <View style={{ width: "100%", paddingTop: 12 }}>
                          <View style={[styles.detailCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.detailTitle, { color: theme.colors.text }]}>Detail du traitement</Text>
                            <Text style={{ color: theme.colors.text, fontWeight: "900", marginBottom: 8 }}>
                              {treatmentTypeLabel(row.type, row.workspace)}
                            </Text>
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
                            {row.specialtySnapshot ? (
                              <View
                                pointerEvents="none"
                                style={{
                                  marginTop: 12,
                                  borderWidth: 1,
                                  borderColor: theme.colors.border,
                                  borderRadius: 10,
                                  backgroundColor: theme.colors.background,
                                  padding: 8,
                                }}
                              >
                                {renderSpecialtyReadonly(theme, row)}
                              </View>
                            ) : null}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
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
      flexWrap: "wrap",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    optionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
  });
