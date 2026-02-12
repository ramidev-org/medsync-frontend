import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  theme: any;

  // left
  title?: string;          // "CONSULTATION"
  stepText?: string;       // "1/4"
  onBack?: () => void;

  // patient strip
  patientName?: string;    // "Sara Ben Ali"
  patientMeta?: string;    // "29 ans • F • ID: P-2031"
  visitMeta?: string;      // "Visite #6 • 31.05.2022 • 10:30"

  status?: "open" | "in_consultation" | "closed" | "cancelled";

  // right actions
  onLastVisit?: () => void;
  onSave?: () => void;
  onClose?: () => void;
  onPrint?: () => void;
};

function statusUi(status?: Props["status"]) {
  switch (status) {
    case "closed":
      return { label: "TERMINÉE", bg: "#16a34a" };
    case "cancelled":
      return { label: "ANNULÉE", bg: "#ef4444" };
    case "in_consultation":
      return { label: "EN COURS", bg: "#f59e0b" };
    case "open":
    default:
      return { label: "OUVERTE", bg: "#2563eb" };
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
  status = "open",

  onLastVisit,
  onSave,
  onClose,
  onPrint,
}: Props) {
  const s = createStyles(theme);
  const st = statusUi(status);

  return (
    <View style={s.wrap}>
      {/* Row 1: top title + actions */}
      <View style={s.topRow}>
        <View style={s.leftTop}>
          {!!onBack && (
            <TouchableOpacity onPress={onBack} style={s.backBtn}>
              <Ionicons name="arrow-back-outline" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          )}

          <Text style={s.title}>{title}</Text>
          <View style={[s.pill, { backgroundColor: theme.colors.primary }]}>
            <Text style={s.pillText}>{stepText}</Text>
          </View>

          <View style={[s.statusPill, { backgroundColor: st.bg }]}>
            <Text style={s.statusText}>{st.label}</Text>
          </View>
        </View>

        <View style={s.rightTop}>
          <TouchableOpacity onPress={onLastVisit} style={s.linkBtn}>
            <Text style={s.linkText}>Dernière visite</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
          </TouchableOpacity>

          {!!onPrint && (
            <TouchableOpacity onPress={onPrint} style={s.iconAction}>
              <Ionicons name="print-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {!!onSave && (
            <TouchableOpacity onPress={onSave} style={[s.actionBtn, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="save-outline" size={16} color="#fff" />
              <Text style={s.actionText}>SAUVEGARDER</Text>
            </TouchableOpacity>
          )}

          {!!onClose && (
            <TouchableOpacity onPress={onClose} style={[s.actionBtn, { backgroundColor: "#10A760" }]}>
              <Ionicons name="checkmark-outline" size={16} color="#fff" />
              <Text style={s.actionText}>CLÔTURER</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Row 2: patient strip */}
      {(patientName || patientMeta || visitMeta) && (
        <View style={s.patientStrip}>
          <View style={{ flex: 1 }}>
            {!!patientName && <Text style={s.patientName}>{patientName}</Text>}
            {!!patientMeta && <Text style={s.patientMeta}>{patientMeta}</Text>}
          </View>

          {!!visitMeta && (
            <View style={s.visitBox}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text style={s.visitText}>{visitMeta}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.06)",
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
      backgroundColor: "rgba(0,0,0,0.04)",
    },
    title: { fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },

    pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    pillText: { color: "#fff", fontWeight: "900" },

    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    statusText: { color: "#fff", fontWeight: "900", fontSize: 12 },

    rightTop: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
    linkBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 6 },
    linkText: { fontWeight: "800", opacity: 0.75, color: theme.colors.text },

    iconAction: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F5B301",
    },

    actionBtn: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    actionText: { color: "#fff", fontWeight: "900", fontSize: 12 },

    patientStrip: {
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: "rgba(0,0,0,0.03)",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },
    patientName: { fontWeight: "900", fontSize: 14 },
    patientMeta: { fontWeight: "800", opacity: 0.7, marginTop: 2 },

    visitBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: "rgba(0,140,255,0.08)",
    },
    visitText: { fontWeight: "900", color: theme.colors.primary },
  });
