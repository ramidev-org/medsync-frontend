import { EChart } from "@/components/charts/echart";
import { PageShell } from "@/components/layout/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { getClinicAnalytics } from "@/services/analytics.services";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import type { EChartsOption } from "echarts";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatMoney, percentOf } from "@/utils/format";

type StatTab =
  | "patient_flow"
  | "revenue"
  | "appointment_status"
  | "consultation_status"
  | "task_status"
  | "stock_alerts";

type SeriesModel = {
  name: string;
  data: number[];
  color: string;
};

type ChartModel =
  | {
      kind: "line" | "bar";
      labels: string[];
      series: SeriesModel[];
    }
  | {
      kind: "pie";
      pieData: { name: string; value: number; color: string }[];
    };

const STAT_TABS: { key: StatTab; label: string }[] = [
  { key: "patient_flow", label: "Patient Flow" },
  { key: "revenue", label: "Revenue Trend" },
  { key: "appointment_status", label: "Appointment Status" },
  { key: "consultation_status", label: "Consultation Status" },
  { key: "task_status", label: "Task Board" },
  { key: "stock_alerts", label: "Stock Alerts" },
];

export default function ReportsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<Awaited<
    ReturnType<typeof getClinicAnalytics>
  > | null>(null);
  const [activeStatTab, setActiveStatTab] = React.useState<StatTab>("patient_flow");
  const [chartWidth, setChartWidth] = React.useState(600);
  const enterAnim = React.useMemo(() => new Animated.Value(0), []);

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
          tone: theme.colors.primary,
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
          accent: theme.colors.primarySoft,
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
          accent: theme.colors.warningSoft,
        },
        {
          title: "Team workload",
          meta: `${summary?.pendingTasks ?? 0} open tasks`,
          detail: `${summary?.doneTasks ?? 0} completed tasks in the current board`,
          accent: theme.colors.successSoft,
        },
      ]
    : [];

  const snapshotLead = summary
    ? summary.pendingTasks > 6
      ? "Operations need attention this week."
      : "Operations are moving in a healthy rhythm."
    : "Clinic summary is preparing.";

  React.useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeStatTab, enterAnim]);

  const chartModel = React.useMemo<ChartModel>(() => {
    if (!report) {
      return { kind: "line", labels: [], series: [] };
    }

    if (activeStatTab === "patient_flow") {
      return {
        kind: "line",
        labels: report.daily.map((point) => point.label),
        series: [
          { name: "Appointments", data: report.daily.map((point) => point.appointments), color: "#2563eb" },
          { name: "Consultations", data: report.daily.map((point) => point.consultations), color: "#06b6d4" },
        ],
      };
    }

    if (activeStatTab === "revenue") {
      return {
        kind: "bar",
        labels: report.daily.map((point) => point.label),
        series: [{ name: "Revenue", data: report.daily.map((point) => point.revenue), color: "#16a34a" }],
      };
    }

    if (activeStatTab === "appointment_status") {
      return {
        kind: "pie",
        pieData: report.appointmentStatus.map((item, index) => ({
          name: item.name.replaceAll("_", " "),
          value: item.value,
          color: ["#2563EB", "#F59E0B", "#16A34A", "#DC2626", "#6366F1"][index % 5],
        })),
      };
    }

    if (activeStatTab === "consultation_status") {
      return {
        kind: "pie",
        pieData: report.consultationStatus.map((item, index) => ({
          name: item.name.replaceAll("_", " "),
          value: item.value,
          color: ["#0F766E", "#F97316", "#64748B", "#2563EB"][index % 4],
        })),
      };
    }

    if (activeStatTab === "task_status") {
      return {
        kind: "pie",
        pieData: report.taskStatus.map((item, index) => ({
          name: item.name.replaceAll("_", " "),
          value: item.value,
          color: ["#F59E0B", "#2563EB", "#16A34A"][index % 3],
        })),
      };
    }

    return {
      kind: "bar",
      labels: report.lowStock.map((item) => item.name),
      series: [
        { name: "Qty On Hand", data: report.lowStock.map((item) => Number(item.qty_on_hand ?? 0)), color: "#EF4444" },
        { name: "Reorder Threshold", data: report.lowStock.map((item) => Number(item.reorder_threshold ?? 0)), color: "#94A3B8" },
      ],
    };
  }, [activeStatTab, report]);

  const chartOption = React.useMemo<EChartsOption>(() => {
    const axisLabelStyle = { color: theme.colors.textSecondary, fontSize: 11 };
    const legendTextStyle = { color: theme.colors.text, fontSize: 12, fontWeight: 700 as any };

    if (chartModel.kind === "pie") {
      return {
        animationDuration: 500,
        color: chartModel.pieData.map((item) => item.color),
        tooltip: { trigger: "item" },
        legend: { bottom: 0, left: "center", textStyle: legendTextStyle },
        series: [
          {
            type: "pie",
            radius: ["46%", "72%"],
            center: ["50%", "42%"],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: theme.colors.surface, borderWidth: 4 },
            label: { color: theme.colors.text, formatter: "{b}\n{d}%", fontWeight: 700 },
            data: chartModel.pieData,
          },
        ],
      };
    }

    return {
      animationDuration: 500,
      color: chartModel.series.map((series) => series.color),
      tooltip: { trigger: "axis" },
      legend: { top: 0, left: "center", textStyle: legendTextStyle },
      grid: { left: 14, right: 14, top: 46, bottom: 24, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: chartModel.kind === "bar",
        data: chartModel.labels,
        axisLabel: axisLabelStyle,
        axisLine: { lineStyle: { color: theme.colors.border } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: axisLabelStyle,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: theme.colors.border } },
      },
      series: chartModel.series.map((series) => ({
        name: series.name,
        type: chartModel.kind,
        data: series.data,
        smooth: chartModel.kind === "line",
        symbol: chartModel.kind === "line" ? "circle" : undefined,
        symbolSize: chartModel.kind === "line" ? 8 : undefined,
        lineStyle: chartModel.kind === "line" ? { width: 3, color: series.color } : undefined,
        itemStyle: { color: series.color, borderRadius: chartModel.kind === "bar" ? 8 : 0 },
        areaStyle: chartModel.kind === "line" && chartModel.series.length === 1 ? { opacity: 0.08 } : undefined,
        barMaxWidth: chartModel.kind === "bar" ? 42 : undefined,
      })),
    };
  }, [chartModel, theme.colors.border, theme.colors.surface, theme.colors.text, theme.colors.textSecondary]);

  return (
    <PageShell scrollable={false}>
      <View style={styles.pageCard}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderCopy}>
            <Text style={styles.pageTitle}>Clinic Reports</Text>
            <Text style={styles.pageSubtitle}>
              Operational and financial insights backed by the live clinic workspace.
            </Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={load}>
            <Ionicons name="refresh-outline" size={16} color={theme.colors.textOnPrimary} />
            <Text style={styles.primaryButtonText}>Refresh Summary</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.main}>
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

          <View style={styles.chartsSection}>
            <View style={styles.groupHead}>
              <Text style={styles.groupTitle}>Detailed Charts</Text>
              <Text style={styles.groupNote}>Interactive breakdowns of the same clinic activity</Text>
            </View>

            <View style={styles.statTabsRow}>
              {STAT_TABS.map((tab) => {
                const active = activeStatTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveStatTab(tab.key)}
                    style={[styles.statTab, active ? styles.statTabActive : null]}
                  >
                    <Text style={[styles.statTabText, active ? styles.statTabTextActive : null]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              style={styles.chartCard}
              onLayout={(e) => setChartWidth(Math.max(320, e.nativeEvent.layout.width - 40))}
            >
              <Text style={styles.chartCardTitle}>
                {STAT_TABS.find((x) => x.key === activeStatTab)?.label}
              </Text>

              {loading ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <Text style={styles.feedbackText}>Loading chart data…</Text>
                </View>
              ) : (
                <Animated.View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [
                      {
                        translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
                      },
                    ],
                    opacity: enterAnim,
                    paddingVertical: 4,
                  }}
                >
                  <EChart option={chartOption} width={chartWidth} height={320} />
                </Animated.View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    // Same single continuous bordered card shell used by users.tsx - a
    // pageHeader strip (title + primary action) separated by a divider,
    // with the scrollable body below it, rather than PageShell's own
    // floating title/subtitle header card.
    pageCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      overflow: "hidden",
      ...(Platform.OS === "web" ? ({ boxShadow: "0px 8px 24px rgba(15,23,42,0.05)" } as any) : null),
    },
    pageHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 24,
      paddingHorizontal: 36,
      paddingTop: 30,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderMuted,
    },
    pageHeaderCopy: { flex: 1, minWidth: 260 },
    pageTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.3, color: theme.colors.text },
    pageSubtitle: { marginTop: 6, maxWidth: 640, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
    main: { paddingHorizontal: 36, paddingTop: 26, paddingBottom: 36 },

    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 10,
    },
    primaryButtonText: { color: theme.colors.textOnPrimary, fontWeight: "600", fontSize: 13 },

    feedbackCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceRaised,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    feedbackText: { color: theme.colors.textSecondary, fontWeight: "500", fontSize: 13 },

    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    kpiCard: {
      flexGrow: 1,
      minWidth: 210,
      borderRadius: 14,
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
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontSize: 11,
      fontWeight: "600",
    },
    kpiValue: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: "700",
    },
    kpiLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "500",
      fontSize: 12.5,
    },
    contentGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 20,
    },
    contentCard: {
      flex: 1,
      minWidth: 320,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 18,
      gap: 14,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    sectionSubtitle: {
      color: theme.colors.textSecondary,
      fontWeight: "500",
      fontSize: 12.5,
      lineHeight: 19,
    },
    highlightList: {
      gap: 10,
    },
    highlightRow: {
      flexDirection: "row",
      gap: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderMuted,
      backgroundColor: theme.colors.surfaceRaised,
      padding: 14,
    },
    highlightAccent: {
      width: 4,
      borderRadius: 999,
    },
    highlightTitle: {
      color: theme.colors.muted,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.9,
      textTransform: "uppercase",
    },
    highlightMeta: {
      marginTop: 5,
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    highlightDetail: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontWeight: "500",
      fontSize: 12.5,
      lineHeight: 19,
    },
    snapshotBox: {
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
      padding: 16,
      gap: 8,
    },
    snapshotLead: {
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: "600",
    },
    snapshotText: {
      color: theme.colors.textSecondary,
      fontWeight: "500",
      fontSize: 12.5,
      lineHeight: 19,
    },
    snapshotMetric: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderMuted,
      backgroundColor: theme.colors.surfaceRaised,
      padding: 14,
      gap: 6,
    },
    snapshotMetricLabel: {
      color: theme.colors.muted,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.9,
      textTransform: "uppercase",
    },
    snapshotMetricValue: {
      color: theme.colors.text,
      fontWeight: "600",
      fontSize: 13,
    },
    chartsSection: {
      marginTop: 26,
      gap: 4,
    },
    groupHead: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderMuted,
    },
    groupTitle: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: theme.colors.muted,
    },
    groupNote: { fontSize: 12, color: theme.colors.muted },
    statTabsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      padding: 4,
      marginTop: 14,
      marginBottom: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 10,
      alignSelf: "flex-start",
    },
    statTab: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 7,
    },
    statTabActive: {
      backgroundColor: theme.colors.primary,
    },
    statTabText: {
      fontWeight: "600",
      fontSize: 12.5,
      color: theme.colors.textSecondary,
    },
    statTabTextActive: {
      color: theme.colors.textOnPrimary,
    },
    chartCard: {
      marginTop: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 16,
    },
    chartCardTitle: {
      fontWeight: "600",
      fontSize: 15,
      color: theme.colors.text,
      marginBottom: 12,
    },
    chartLoading: {
      minHeight: 240,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
  });
