import { PageShell } from "@/components/layout/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { getClinicAnalytics } from "@/services/analytics.services";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function percentOf(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export default function ReportsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<Awaited<
    ReturnType<typeof getClinicAnalytics>
  > | null>(null);

  const load = React.useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getClinicAnalytics({ requesterId: user.id });
      setReport(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const summary = report?.summary;
  const bestDay = React.useMemo(() => {
    if (!report?.daily?.length) return null;
    return [...report.daily].sort(
      (a, b) => b.appointments + b.consultations - (a.appointments + a.consultations),
    )[0];
  }, [report?.daily]);

  const kpiCards = summary
    ? [
        {
          label: "Revenue",
          value: formatMoney(summary.revenueTotal),
          badge: formatMoney(summary.revenueTotal - summary.expensesTotal),
          icon: "cash-outline" as const,
          tone: "#2563EB",
        },
        {
          label: "Consultations",
          value: String(summary.consultationsTotal),
          badge: `${summary.completedAppointments} completed`,
          icon: "document-text-outline" as const,
          tone: "#0F766E",
        },
        {
          label: "No-show Rate",
          value: percentOf(summary.noShowAppointments, summary.appointmentsTotal),
          badge: `${summary.noShowAppointments} no-shows`,
          icon: "trending-down-outline" as const,
          tone: "#C2410C",
        },
        {
          label: "Open Tasks",
          value: String(summary.pendingTasks),
          badge: `${summary.doneTasks} done`,
          icon: "checkbox-outline" as const,
          tone: "#4F46E5",
        },
      ]
    : [];

  const performanceRows = report
    ? [
        {
          title: "Most active day",
          meta: bestDay ? bestDay.label : "No activity yet",
          detail: bestDay
            ? `${bestDay.appointments} appointments and ${bestDay.consultations} consultations`
            : "Fresh appointments will start shaping the trend here.",
          accent: "#DBEAFE",
        },
        {
          title: "Low stock watch",
          meta: `${report.lowStock.length} flagged item${report.lowStock.length === 1 ? "" : "s"}`,
          detail: report.lowStock.length
            ? report.lowStock
                .slice(0, 2)
                .map((item) => `${item.name} (${item.qty_on_hand})`)
                .join(" • ")
            : "Inventory looks healthy for now.",
          accent: "#FEF3C7",
        },
        {
          title: "Team workload",
          meta: `${summary?.pendingTasks ?? 0} open tasks`,
          detail: `${summary?.doneTasks ?? 0} completed tasks in the current board`,
          accent: "#DCFCE7",
        },
      ]
    : [];

  const snapshotLead = summary
    ? summary.pendingTasks > 6
      ? "Operations need attention this week."
      : "Operations are moving in a healthy rhythm."
    : "Clinic summary is preparing.";

  return (
    <PageShell
      title="Clinic Reports"
      subtitle="Operational and financial insights backed by the live clinic workspace."
    >
      <View style={styles.heroCard}>
        <View style={styles.brandPill}>
          <Ionicons name="analytics-outline" size={16} color="#1D4ED8" />
          <Text style={styles.brandText}>MedSync Analytics</Text>
        </View>

        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>A reporting desk tied to real clinic activity.</Text>
            <Text style={styles.heroDescription}>
              Revenue, consultations, open tasks, and stock pressure now come from the live
              clinic data instead of placeholder widgets.
            </Text>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.heroButton, styles.heroButtonPrimary]}
              onPress={load}
            >
              <Ionicons name="refresh-outline" size={16} color="#fff" />
              <Text style={styles.heroButtonText}>Refresh Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.feedbackCard}>
          <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
          <Text style={[styles.feedbackText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.feedbackCard}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.feedbackText}>Loading the clinic reporting layer…</Text>
        </View>
      ) : null}

      <View style={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <View key={card.label} style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIconWrap, { backgroundColor: `${card.tone}14` }]}>
                <Ionicons name={card.icon} size={18} color={card.tone} />
              </View>
              <Text style={[styles.badge, { color: card.tone, backgroundColor: `${card.tone}14` }]}>
                {card.badge}
              </Text>
            </View>
            <Text style={styles.kpiValue}>{card.value}</Text>
            <Text style={styles.kpiLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.contentGrid}>
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Weekly Highlights</Text>
          <Text style={styles.sectionSubtitle}>
            Short, current signals pulled from the same appointments, payments, and tasks
            the team works with every day.
          </Text>

          <View style={styles.highlightList}>
            {performanceRows.map((item) => (
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
          <Text style={styles.sectionSubtitle}>
            A fast admin-readable story generated from the current month window.
          </Text>

          <View style={styles.snapshotBox}>
            <Text style={styles.snapshotLead}>{snapshotLead}</Text>
            <Text style={styles.snapshotText}>
              The clinic logged {summary?.appointmentsTotal ?? 0} appointments,{" "}
              {summary?.consultationsTotal ?? 0} consultations, and{" "}
              {formatMoney(summary?.revenueTotal ?? 0)} in payments during the active period.
            </Text>
          </View>

          <View style={styles.snapshotMetric}>
            <Text style={styles.snapshotMetricLabel}>Revenue pacing</Text>
            <Text style={styles.snapshotMetricValue}>
              {formatMoney(summary?.revenueTotal ?? 0)} revenue vs{" "}
              {formatMoney(summary?.expensesTotal ?? 0)} expenses
            </Text>
          </View>

          <View style={styles.snapshotMetric}>
            <Text style={styles.snapshotMetricLabel}>Front desk pressure</Text>
            <Text style={styles.snapshotMetricValue}>
              {summary?.cancelledAppointments ?? 0} cancelled and{" "}
              {summary?.noShowAppointments ?? 0} no-show appointments
            </Text>
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
      fontWeight: "600",
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
      fontWeight: "700",
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
    heroButtonText: {
      color: "#fff",
      fontWeight: "700",
    },
    feedbackCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    feedbackText: { color: theme.colors.textSecondary, fontWeight: "600" },
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
      fontWeight: "700",
    },
    kpiValue: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: "700",
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
      fontWeight: "700",
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
      fontWeight: "700",
      textTransform: "uppercase",
    },
    highlightMeta: {
      marginTop: 4,
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "700",
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
      fontWeight: "700",
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
      fontWeight: "700",
      textTransform: "uppercase",
    },
    snapshotMetricValue: {
      color: theme.colors.text,
      fontWeight: "700",
    },
  });
