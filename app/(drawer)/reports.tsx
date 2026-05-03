import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const KPIS = [
  { label: "Monthly Revenue", value: "$18,420", icon: "cash-outline" as const },
  { label: "Consultations", value: "312", icon: "document-text-outline" as const },
  { label: "No-show Rate", value: "4.8%", icon: "trending-down-outline" as const },
  { label: "Avg Wait Time", value: "11 min", icon: "time-outline" as const },
];

export default function ReportsPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <PageShell title="Clinic Reports" subtitle="Operational and financial insights with export-ready summaries.">
      <View style={styles.grid}>
        {KPIS.map((kpi) => (
          <View key={kpi.label} style={styles.card}>
            <Ionicons name={kpi.icon} size={18} color={theme.colors.primary} />
            <Text style={styles.value}>{kpi.value}</Text>
            <Text style={styles.label}>{kpi.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.cardWide}>
        <Text style={styles.sectionTitle}>Weekly Highlights</Text>
        <Text style={styles.item}>• Most booked service: Endodontics (48 appointments)</Text>
        <Text style={styles.item}>• Busiest doctor: Dr. Karim (92 patients this week)</Text>
        <Text style={styles.item}>• Best conversion source: Returning patients (63%)</Text>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    card: { minWidth: 220, flexGrow: 1, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 14, gap: 8 },
    value: { fontSize: 24, fontWeight: "900", color: theme.colors.text },
    label: { color: theme.colors.textSecondary, fontWeight: "700" },
    cardWide: { marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 16, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
    item: { color: theme.colors.textSecondary, fontWeight: "700" },
  });
