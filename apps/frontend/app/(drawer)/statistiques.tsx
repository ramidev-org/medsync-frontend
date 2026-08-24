import { EChart } from "@/components/charts/echart";
import { PageShell } from "@/components/layout/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { getClinicAnalytics } from "@/services/analytics.services";
import { useTheme } from "@/theme/theme_provider";
import type { EChartsOption } from "echarts";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

const TABS: { key: StatTab; label: string }[] = [
  { key: "patient_flow", label: "Patient Flow" },
  { key: "revenue", label: "Revenue Trend" },
  { key: "appointment_status", label: "Appointment Status" },
  { key: "consultation_status", label: "Consultation Status" },
  { key: "task_status", label: "Task Board" },
  { key: "stock_alerts", label: "Stock Alerts" },
];

export default function StatistiquesPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<StatTab>("patient_flow");
  const [chartWidth, setChartWidth] = React.useState(600);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [analytics, setAnalytics] = React.useState<Awaited<
    ReturnType<typeof getClinicAnalytics>
  > | null>(null);
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
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setError(err instanceof Error ? err.message : "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, enterAnim]);

  const chartModel = React.useMemo<ChartModel>(() => {
    if (!analytics) {
      return { kind: "line", labels: [], series: [] };
    }

    if (activeTab === "patient_flow") {
      return {
        kind: "line",
        labels: analytics.daily.map((point) => point.label),
        series: [
          {
            name: "Appointments",
            data: analytics.daily.map((point) => point.appointments),
            color: "#2563eb",
          },
          {
            name: "Consultations",
            data: analytics.daily.map((point) => point.consultations),
            color: "#06b6d4",
          },
        ],
      };
    }

    if (activeTab === "revenue") {
      return {
        kind: "bar",
        labels: analytics.daily.map((point) => point.label),
        series: [
          {
            name: "Revenue",
            data: analytics.daily.map((point) => point.revenue),
            color: "#16a34a",
          },
        ],
      };
    }

    if (activeTab === "appointment_status") {
      return {
        kind: "pie",
        pieData: analytics.appointmentStatus.map((item, index) => ({
          name: item.name.replaceAll("_", " "),
          value: item.value,
          color: ["#2563EB", "#F59E0B", "#16A34A", "#DC2626", "#6366F1"][index % 5],
        })),
      };
    }

    if (activeTab === "consultation_status") {
      return {
        kind: "pie",
        pieData: analytics.consultationStatus.map((item, index) => ({
          name: item.name.replaceAll("_", " "),
          value: item.value,
          color: ["#0F766E", "#F97316", "#64748B", "#2563EB"][index % 4],
        })),
      };
    }

    if (activeTab === "task_status") {
      return {
        kind: "pie",
        pieData: analytics.taskStatus.map((item, index) => ({
          name: item.name.replaceAll("_", " "),
          value: item.value,
          color: ["#F59E0B", "#2563EB", "#16A34A"][index % 3],
        })),
      };
    }

    return {
      kind: "bar",
      labels: analytics.lowStock.map((item) => item.name),
      series: [
        {
          name: "Qty On Hand",
          data: analytics.lowStock.map((item) => Number(item.qty_on_hand ?? 0)),
          color: "#EF4444",
        },
        {
          name: "Reorder Threshold",
          data: analytics.lowStock.map((item) => Number(item.reorder_threshold ?? 0)),
          color: "#94A3B8",
        },
      ],
    };
  }, [activeTab, analytics]);

  const chartOption = React.useMemo<EChartsOption>(() => {
    const axisLabelStyle = { color: theme.colors.textSecondary, fontSize: 11 };
    const legendTextStyle = {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: 700 as any,
    };

    if (chartModel.kind === "pie") {
      return {
        animationDuration: 500,
        color: chartModel.pieData.map((item) => item.color),
        tooltip: { trigger: "item" },
        legend: {
          bottom: 0,
          left: "center",
          textStyle: legendTextStyle,
        },
        series: [
          {
            type: "pie",
            radius: ["46%", "72%"],
            center: ["50%", "42%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderColor: theme.colors.surface,
              borderWidth: 4,
            },
            label: {
              color: theme.colors.text,
              formatter: "{b}\n{d}%",
              fontWeight: 700,
            },
            data: chartModel.pieData,
          },
        ],
      };
    }

    return {
      animationDuration: 500,
      color: chartModel.series.map((series) => series.color),
      tooltip: { trigger: "axis" },
      legend: {
        top: 0,
        left: "center",
        textStyle: legendTextStyle,
      },
      grid: {
        left: 14,
        right: 14,
        top: 46,
        bottom: 24,
        containLabel: true,
      },
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
        lineStyle:
          chartModel.kind === "line" ? { width: 3, color: series.color } : undefined,
        itemStyle: {
          color: series.color,
          borderRadius: chartModel.kind === "bar" ? 8 : 0,
        },
        areaStyle:
          chartModel.kind === "line" && chartModel.series.length === 1
            ? { opacity: 0.08 }
            : undefined,
        barMaxWidth: chartModel.kind === "bar" ? 42 : undefined,
      })),
    };
  }, [
    chartModel,
    theme.colors.border,
    theme.colors.surface,
    theme.colors.text,
    theme.colors.textSecondary,
  ]);

  return (
    <PageShell scrollable={false} contentStyle={{ flex: 1, paddingTop: 14 }}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: theme.colors.text }}>
            Statistics
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontWeight: "700",
              color: theme.colors.textSecondary,
            }}
          >
            Live operational charts generated from appointments, consultations, tasks,
            payments, and stock data.
          </Text>
        </View>

        {error ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: `${theme.colors.error}33`,
              borderRadius: 16,
              backgroundColor: `${theme.colors.error}10`,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ color: theme.colors.error, fontWeight: "600" }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 12,
                    color: active ? "#fff" : theme.colors.text,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={load}
            style={{
              paddingVertical: 9,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 12, color: theme.colors.text }}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            padding: 16,
          }}
          onLayout={(e) => setChartWidth(Math.max(320, e.nativeEvent.layout.width - 40))}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 18,
              color: theme.colors.text,
              marginBottom: 12,
            }}
          >
            {TABS.find((x) => x.key === activeTab)?.label}
          </Text>

          {loading ? (
            <View
              style={{
                minHeight: 240,
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={{ color: theme.colors.textSecondary, fontWeight: "600" }}>
                Loading chart data…
              </Text>
            </View>
          ) : (
            <Animated.View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [
                  {
                    translateY: enterAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
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
      </ScrollView>
    </PageShell>
  );
}
