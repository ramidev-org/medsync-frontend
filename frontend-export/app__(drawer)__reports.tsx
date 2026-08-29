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

      <View style={styles.chartsSection}>
        <Text style={styles.sectionTitle}>Detailed Charts</Text>
        <Text style={styles.sectionSubtitle}>
          Interactive breakdowns of the same clinic activity - pick a view below.
        </Text>

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
    chartsSection: {
      marginTop: 20,
      gap: 4,
    },
    statTabsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 14,
      marginBottom: 4,
    },
    statTab: {
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    statTabActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    statTabText: {
      fontWeight: "700",
      fontSize: 12,
      color: theme.colors.text,
    },
    statTabTextActive: {
      color: "#fff",
    },
    chartCard: {
      marginTop: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 16,
    },
    chartCardTitle: {
      fontWeight: "700",
      fontSize: 18,
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
