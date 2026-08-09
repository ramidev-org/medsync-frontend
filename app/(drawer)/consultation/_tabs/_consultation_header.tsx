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
  patientBirthDate?: string;
  patientPhone?: string;
  patientId?: string;
  doctorName?: string;
  visitMeta?: string;
  workspaceLabel?: string;
  workspaceOptions?: { key: string; label: string }[];
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
  patientBirthDate,
  patientPhone,
  patientId,
  doctorName,
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
  const initials = (patientName || "Patient")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const birthDate = patientBirthDate ? new Date(patientBirthDate) : null;
  const birthLabel = birthDate && !Number.isNaN(birthDate.getTime())
    ? birthDate.toLocaleDateString("fr-FR")
    : "Non renseignée";

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
          <View style={s.patientIdentityWrap}>
            <View style={s.patientInitials}>
              <Text style={s.patientInitialsText}>{initials}</Text>
            </View>
            <View style={s.patientCopy}>
              <View style={s.patientNameRow}>
                <Text style={s.patientName}>{patientName || "Patient"}</Text>
                <Ionicons name="person-circle-outline" size={19} color={theme.colors.primary} />
              </View>
              <Text style={s.patientMeta}>Né(e) le {birthLabel}{patientMeta ? `  •  ${patientMeta}` : ""}  •  ID: {patientId ? patientId.slice(0, 8).toUpperCase() : "—"}</Text>
              <View style={s.phoneRow}>
                <Ionicons name="call-outline" size={15} color={theme.colors.textSecondary} />
                <Text style={s.patientMeta}>{patientPhone || "Téléphone non renseigné"}</Text>
              </View>
            </View>
          </View>

          <View style={s.patientFacts}>
            <View style={s.patientFact}>
              <Text style={s.factLabel}>Dernière consultation</Text>
              <Text style={s.factValuePrimary}>{consultationStats?.visitLabel || visitMeta || "—"}</Text>
            </View>
            <View style={s.factDivider} />
            <View style={s.patientFact}>
              <Text style={s.factLabel}>Médecin traitant</Text>
              <Text numberOfLines={1} style={s.factValue}>{doctorName || "Médecin traitant"}</Text>
            </View>
            <View style={s.factDivider} />
            <View style={s.patientFactCompact}>
              <Text style={s.factLabel}>Statut</Text>
              <View style={[s.statusBadge, status === "closed" ? s.statusBadgeClosed : s.statusBadgeOpen]}>
                <View style={[s.statusDot, { backgroundColor: status === "closed" ? theme.colors.success : theme.colors.warning }]} />
                <Text style={[s.statusBadgeText, { color: status === "closed" ? theme.colors.success : "#b76400" }]}>{consultationStats?.statusLabel || st.label}</Text>
              </View>
            </View>
            {!!onWorkspaceChange && (
              <View style={s.workspaceDropdownWrap}>
                <Text style={s.workspaceLabel}>Spécialité</Text>
                <TouchableOpacity onPress={() => setWorkspacePickerOpen((v) => !v)} style={s.workspaceBtn}>
                  <Ionicons name="medkit-outline" size={17} color={theme.colors.primary} />
                  <Text numberOfLines={1} style={s.workspaceBtnText}>{workspaceLabel || "Workspace"}</Text>
                  <Ionicons name="chevron-down-outline" size={14} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                {workspacePickerOpen && (
                  <View style={s.workspaceMenu}>
                    <ScrollView style={s.workspaceMenuScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                      {workspaceOptions.map((w) => (
                        <TouchableOpacity key={w.key} onPress={() => { onWorkspaceChange(w.key); setWorkspacePickerOpen(false); }} style={s.workspaceMenuItem}>
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
      backgroundColor: theme.colors.backgroundAlt,
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
      backgroundColor: "transparent",
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    leftTop: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primary + "33",
      ...(typeof window !== "undefined"
        ? ({ boxShadow: "0 8px 18px rgba(37,99,235,0.12)" } as any)
        : null),
    },
    title: { fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
    pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    pillText: { color: theme.colors.textOnPrimary, fontWeight: "700" },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    statusText: { color: theme.colors.textOnPrimary, fontWeight: "700", fontSize: 12 },
    rightTop: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
    linkBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 6 },
    linkText: { fontWeight: "600", opacity: 0.75, color: theme.colors.text },
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
    actionText: { color: theme.colors.textOnPrimary, fontWeight: "700", fontSize: 12 },
    patientStrip: {
      marginTop: 10,
      minHeight: 116,
      paddingHorizontal: 24,
      paddingVertical: 18,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
      flexWrap: "wrap",
      zIndex: 70,
      ...(typeof window !== "undefined" ? ({ overflow: "visible" } as any) : null),
    },
    patientIdentityWrap: {
      flex: 1,
      minWidth: 260,
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
    },
    patientInitials: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#E8F8F2",
    },
    patientInitialsText: { fontSize: 22, fontWeight: "600", color: theme.colors.success },
    patientCopy: { flex: 1, minWidth: 0 },
    patientNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    patientName: { fontWeight: "700", fontSize: 19, color: theme.colors.text },
    patientMeta: { marginTop: 5, fontSize: 12, color: theme.colors.textSecondary },
    phoneRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    patientFacts: { flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap", zIndex: 200, elevation: 20 },
    patientFact: { minWidth: 135, maxWidth: 180 },
    patientFactCompact: { minWidth: 86 },
    factLabel: { marginBottom: 7, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.45, color: theme.colors.textSecondary },
    factValue: { fontSize: 13, fontWeight: "700", color: theme.colors.text },
    factValuePrimary: { fontSize: 13, fontWeight: "700", color: theme.colors.primary },
    factDivider: { width: 1, height: 42, backgroundColor: theme.colors.border },
    statusBadge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 6 },
    statusBadgeOpen: { backgroundColor: theme.colors.warningSoft },
    statusBadgeClosed: { backgroundColor: theme.colors.successSoft },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusBadgeText: { fontSize: 10, fontWeight: "800" },
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
    visitText: { fontWeight: "700", color: theme.colors.primary },
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
      fontWeight: "700",
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
    workspaceBtnText: { fontWeight: "700", color: theme.colors.textSecondary },
    workspaceLabel: {
      marginBottom: 7,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.45,
      color: theme.colors.textSecondary,
    },
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
      fontWeight: "600",
      color: theme.colors.text,
    },
  });
