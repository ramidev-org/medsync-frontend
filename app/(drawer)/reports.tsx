import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const KPI_CARDS = [
  { label: "Monthly Revenue", value: "$18,420", badge: "Stable", icon: "cash-outline" as const, tone: "#2563EB" },
  { label: "Consultations", value: "312", badge: "+12%", icon: "document-text-outline" as const, tone: "#0F766E" },
  { label: "No-show Rate", value: "4.8%", badge: "Low", icon: "trending-down-outline" as const, tone: "#C2410C" },
  { label: "Avg Wait Time", value: "11 min", badge: "-3 min", icon: "time-outline" as const, tone: "#7C3AED" },
];

const PERFORMANCE_ROWS = [
  { title: "Most booked service", meta: "Endodontics", detail: "48 appointments this week", accent: "#DBEAFE" },
  { title: "Busiest doctor", meta: "Dr. Karim", detail: "92 patients handled this week", accent: "#DCFCE7" },
  { title: "Best conversion source", meta: "Returning patients", detail: "63% of confirmed bookings", accent: "#FEF3C7" },
];

const EXPORT_ACTIONS = [
  { label: "Export PDF", icon: "download-outline" as const },
  { label: "Share Summary", icon: "send-outline" as const },
];

export default function ReportsPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <PageShell title="Clinic Reports" subtitle="Operational and financial insights with a clearer daily reporting layout.">
      <View style={styles.heroCard}>
        <View style={styles.brandPill}>
          <Ionicons name="analytics-outline" size={16} color="#1D4ED8" />
          <Text style={styles.brandText}>MedSync Analytics</Text>
        </View>

        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>A cleaner reporting desk for the clinic team.</Text>
            <Text style={styles.heroDescription}>
              Follow income, consultation flow, patient behavior, and the week’s highlights from one bright summary layer.
            </Text>
          </View>

          <View style={styles.heroActions}>
            {EXPORT_ACTIONS.map((action, index) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.heroButton, index === 0 ? styles.heroButtonPrimary : styles.heroButtonDark]}
              >
                <Ionicons name={action.icon} size={16} color="#fff" />
                <Text style={styles.heroButtonText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        {KPI_CARDS.map((card) => (
          <View key={card.label} style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIconWrap, { backgroundColor: `${card.tone}14` }]}>
                <Ionicons name={card.icon} size={18} color={card.tone} />
              </View>
              <Text style={[styles.badge, { color: card.tone, backgroundColor: `${card.tone}14` }]}>{card.badge}</Text>
            </View>
            <Text style={styles.kpiValue}>{card.value}</Text>
            <Text style={styles.kpiLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.contentGrid}>
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Weekly Highlights</Text>
          <Text style={styles.sectionSubtitle}>Quick operational wins and pressure points for the team.</Text>

          <View style={styles.highlightList}>
            {PERFORMANCE_ROWS.map((item) => (
              <View key={item.title} style={styles.highlightRow}>
                <View style={[styles.highlightAccent, { backgroundColor: item.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightMeta}>{item.meta}</Text>
                  <Text style={styles.highlightDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Executive Snapshot</Text>
          <Text style={styles.sectionSubtitle}>Short narrative for admin review or export.</Text>

          <View style={styles.snapshotBox}>
            <Text style={styles.snapshotLead}>This week stayed healthy across operations.</Text>
            <Text style={styles.snapshotText}>
              Consultation demand is strong, no-show rate remains controlled, and wait time improved compared to the previous period.
            </Text>
          </View>

          <View style={styles.snapshotMetric}>
            <Text style={styles.snapshotMetricLabel}>Revenue pacing</Text>
            <Text style={styles.snapshotMetricValue}>78% of monthly target reached</Text>
          </View>

          <View style={styles.snapshotMetric}>
            <Text style={styles.snapshotMetricLabel}>Follow-up pressure</Text>
            <Text style={styles.snapshotMetricValue}>21 pending callbacks need review</Text>
          </View>
        </View>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    heroCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 20,
      gap: 16,
      marginBottom: 14,
    },
    brandPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#EFF6FF",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    brandText: {
      color: "#1D4ED8",
      fontWeight: "800",
      fontSize: 12,
    },
    heroTop: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 16,
    },
    heroTitle: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "900",
    },
    heroDescription: {
      marginTop: 8,
      maxWidth: 720,
      color: theme.colors.textSecondary,
      fontWeight: "700",
      lineHeight: 22,
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      alignItems: "center",
    },
    heroButton: {
      minHeight: 44,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    heroButtonPrimary: {
      backgroundColor: "#2563EB",
    },
    heroButtonDark: {
      backgroundColor: "#0F172A",
    },
    heroButtonText: {
      color: "#fff",
      fontWeight: "900",
    },
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    kpiCard: {
      flexGrow: 1,
      minWidth: 210,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 16,
      gap: 10,
    },
    kpiHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    kpiIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontSize: 11,
      fontWeight: "900",
    },
    kpiValue: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "900",
    },
    kpiLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
    },
    contentGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 14,
    },
    contentCard: {
      flex: 1,
      minWidth: 320,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 18,
      gap: 14,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "900",
    },
    sectionSubtitle: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
      lineHeight: 20,
    },
    highlightList: {
      gap: 12,
    },
    highlightRow: {
      flexDirection: "row",
      gap: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      padding: 14,
    },
    highlightAccent: {
      width: 10,
      borderRadius: 999,
    },
    highlightTitle: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    highlightMeta: {
      marginTop: 4,
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "900",
    },
    highlightDetail: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontWeight: "700",
      lineHeight: 20,
    },
    snapshotBox: {
      borderRadius: 18,
      backgroundColor: "#EFF6FF",
      padding: 16,
      gap: 8,
    },
    snapshotLead: {
      color: "#1D4ED8",
      fontSize: 16,
      fontWeight: "900",
    },
    snapshotText: {
      color: "#334155",
      fontWeight: "700",
      lineHeight: 20,
    },
    snapshotMetric: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      padding: 14,
      gap: 6,
    },
    snapshotMetricLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    snapshotMetricValue: {
      color: theme.colors.text,
      fontWeight: "900",
    },
  });
