import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  theme: any;
  title?: string;
  stepText?: string;
  onBack?: () => void;
  patientName?: string;
  patientMeta?: string;
  visitMeta?: string;
  workspaceLabel?: string;
  workspaceOptions?: Array<{ key: string; label: string }>;
  onWorkspaceChange?: (key: string) => void;
  status?: "open" | "in_consultation" | "closed" | "cancelled";
  onLastVisit?: () => void;
  onSave?: () => void;
  onClose?: () => void;
  onPrint?: () => void;
  consultationStats?: {
    statusLabel?: string;
    specialtyLabel?: string;
    visitLabel?: string;
  };
};

function statusUi(status?: Props["status"]) {
  switch (status) {
    case "closed":
      return { label: "TERMINEE", tone: "success" as const };
    case "cancelled":
      return { label: "ANNULEE", tone: "error" as const };
    case "in_consultation":
      return { label: "EN COURS", tone: "warning" as const };
    case "open":
    default:
      return { label: "OUVERTE", tone: "primary" as const };
  }
}

export default function ConsultationHeader({
  theme,
  title = "CONSULTATION",
  stepText = "1/4",
  onBack,
  patientName,
  patientMeta,
  visitMeta,
  workspaceLabel,
  workspaceOptions = [],
  onWorkspaceChange,
  status = "open",
  onLastVisit,
  onSave,
  onClose,
  onPrint,
  consultationStats,
}: Props) {
  const s = createStyles(theme);
  const st = statusUi(status);
  const [workspacePickerOpen, setWorkspacePickerOpen] = React.useState(false);

  return (
    <View style={s.wrap}>
      <View style={s.topRow}>
        <View style={s.leftTop}>
          {!!onBack && (
            <TouchableOpacity onPress={onBack} style={s.backBtn}>
              <Ionicons name="arrow-back-outline" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          )}

          <Text style={s.title}>{title}</Text>
        </View>

        <View style={s.rightTop}>
          <TouchableOpacity onPress={onLastVisit} style={s.linkBtn}>
            <Text style={s.linkText}>Derniere visite</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
          </TouchableOpacity>

          {!!onPrint && (
            <TouchableOpacity onPress={onPrint} style={s.iconAction}>
              <Ionicons name="print-outline" size={18} color={theme.colors.textOnPrimary} />
            </TouchableOpacity>
          )}

          {!!onSave && (
            <TouchableOpacity onPress={onSave} style={[s.actionBtn, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="save-outline" size={16} color={theme.colors.textOnPrimary} />
              <Text style={s.actionText}>SAUVEGARDER</Text>
            </TouchableOpacity>
          )}

          {!!onClose && (
            <TouchableOpacity onPress={onClose} style={[s.actionBtn, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark-outline" size={16} color={theme.colors.textOnPrimary} />
              <Text style={s.actionText}>CLOTURER</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(patientName || patientMeta || visitMeta) && (
        <View style={s.patientStrip}>
          <View style={s.patientTopRow}>
            <View style={s.patientIdentityWrap}>
              <View style={s.patientIconBox}>
                <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={{ minWidth: 180 }}>
                <Text style={s.patientName}>{patientName || "Patient"}</Text>
                <Text style={s.patientMeta}>{patientMeta || "-"}</Text>
              </View>
            </View>

            <View style={s.patientActionsTopRight}>
              {!!onWorkspaceChange && (
                <View style={s.workspaceDropdownWrap}>
                  <TouchableOpacity onPress={() => setWorkspacePickerOpen((v) => !v)} style={s.workspaceBtn}>
                    <Ionicons name="medkit-outline" size={16} color={theme.colors.primary} />
                    <Text style={s.workspaceBtnText}>{workspaceLabel || "Workspace"}</Text>
                    <Ionicons name="chevron-down-outline" size={14} color={theme.colors.textSecondary} />
                  </TouchableOpacity>

                  {workspacePickerOpen && (
                    <View style={s.workspaceMenu}>
                      <ScrollView style={s.workspaceMenuScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                        {workspaceOptions.map((w) => (
                          <TouchableOpacity
                            key={w.key}
                            onPress={() => {
                              onWorkspaceChange(w.key);
                              setWorkspacePickerOpen(false);
                            }}
                            style={s.workspaceMenuItem}
                          >
                            <Text style={s.workspaceMenuText}>{w.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={s.statsRowInline}>
            <View style={[s.statCard, s.statBlue]}>
              <Text style={s.statValue}>{consultationStats?.statusLabel || st.label}</Text>
              <Text style={s.statLabel}>Statut</Text>
            </View>
            <View style={[s.statCard, s.statGreen]}>
              <Text style={s.statValue}>{consultationStats?.specialtyLabel || (workspaceLabel || "Workspace")}</Text>
              <Text style={s.statLabel}>Specialite</Text>
            </View>
            <View style={[s.statCard, s.statOrange]}>
              <Text style={s.statValue}>{consultationStats?.visitLabel || (visitMeta || "-")}</Text>
              <Text style={s.statLabel}>Visite</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    wrap: {
      position: "relative",
      paddingHorizontal: 0,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 0,
      zIndex: 1000,
      ...(typeof window !== "undefined" ? ({ overflow: "visible" } as any) : null),
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    leftTop: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceVariant,
    },
    title: { fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
    pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    pillText: { color: theme.colors.textOnPrimary, fontWeight: "900" },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    statusText: { color: theme.colors.textOnPrimary, fontWeight: "900", fontSize: 12 },
    rightTop: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
    linkBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 6 },
    linkText: { fontWeight: "800", opacity: 0.75, color: theme.colors.text },
    iconAction: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.warning,
    },
    actionBtn: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    actionText: { color: theme.colors.textOnPrimary, fontWeight: "900", fontSize: 12 },
    patientStrip: {
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      zIndex: 70,
      ...(typeof window !== "undefined" ? ({ overflow: "visible" } as any) : null),
    },
    patientTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      zIndex: 200,
      elevation: 20,
    },
    patientIdentityWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minWidth: 240,
      flexShrink: 0,
    },
    patientActionsTopRight: {
      flexShrink: 0,
      alignItems: "flex-end",
      justifyContent: "flex-start",
      marginLeft: 8,
    },
    patientIconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    patientName: { fontWeight: "900", fontSize: 18 },
    patientMeta: { fontWeight: "700", color: theme.colors.textSecondary, marginTop: 2 },
    visitBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    visitText: { fontWeight: "900", color: theme.colors.primary },
    statsRowInline: {
      marginTop: 12,
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
      width: "100%",
      alignItems: "stretch",
      zIndex: 1,
      elevation: 1,
    },
    statCard: {
      flex: 1,
      minWidth: 220,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    statBlue: { backgroundColor: theme.colors.primarySoft },
    statGreen: { backgroundColor: theme.colors.successSoft },
    statOrange: { backgroundColor: theme.colors.warningSoft },
    statValue: {
      fontWeight: "900",
      fontSize: 18,
      color: theme.colors.text,
    },
    statLabel: {
      marginTop: 2,
      fontWeight: "700",
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    workspaceBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    workspaceBtnText: { fontWeight: "900", color: theme.colors.textSecondary },
    workspaceDropdownWrap: {
      position: "relative",
      zIndex: 99999,
      elevation: 80,
      ...(typeof window !== "undefined" ? ({ overflow: "visible" } as any) : null),
    },
    workspaceMenu: {
      position: "absolute",
      top: 44,
      right: 0,
      width: 260,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      zIndex: 99999,
      elevation: 60,
      overflow: "hidden",
      ...(typeof window !== "undefined" ? ({ boxShadow: "0 12px 28px rgba(2,8,23,0.18)" } as any) : null),
    },
    workspaceMenuScroll: {
      maxHeight: 240,
    },
    workspaceMenuItem: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    workspaceMenuText: {
      fontWeight: "800",
      color: theme.colors.text,
    },
  });
