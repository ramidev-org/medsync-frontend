import { EChart } from "@/components/charts/echart";
import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import type { EChartsOption } from "echarts";
import React from "react";
import { Animated, Easing, ScrollView, Text, TouchableOpacity, View } from "react-native";

type StatTab =
  | "patient_flow"
  | "vitals_trend"
  | "bp_control"
  | "hba1c_glucose"
  | "lab_critical"
  | "diagnosis_status"
  | "treatment_response";

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
  { key: "vitals_trend", label: "Vitals Trend" },
  { key: "bp_control", label: "BP Control" },
  { key: "hba1c_glucose", label: "HbA1c/Glucose" },
  { key: "lab_critical", label: "Critical Labs" },
  { key: "diagnosis_status", label: "Diagnosis Status" },
  { key: "treatment_response", label: "Treatment Response" },
];

export default function StatistiquesPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = React.useState<StatTab>("patient_flow");
  const [chartWidth, setChartWidth] = React.useState(600);
  const [pointHint, setPointHint] = React.useState("");
  const [selectedPointIndex, setSelectedPointIndex] = React.useState(0);
  const enterAnim = React.useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    setPointHint("");
    setSelectedPointIndex(0);
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, enterAnim]);

  const chartModel = React.useMemo<ChartModel>(() => {
    if (activeTab === "patient_flow") {
      return {
        kind: "line",
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        series: [
          { name: "Visits", data: [12, 18, 15, 22, 20, 11, 9], color: "#2563eb" },
          { name: "Consultations", data: [9, 14, 12, 17, 16, 8, 7], color: "#06b6d4" },
        ],
      };
    }

    if (activeTab === "vitals_trend") {
      return {
        kind: "line",
        labels: ["D1", "D2", "D3", "D4", "D5", "D6", "D7"],
        series: [
          { name: "Temp C", data: [37.1, 37.0, 37.4, 37.2, 36.9, 37.3, 37.1], color: "#f59e0b" },
          { name: "SpO2 %", data: [96, 95, 94, 97, 98, 96, 97], color: "#06b6d4" },
        ],
      };
    }

    if (activeTab === "bp_control") {
      return {
        kind: "line",
        labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
        series: [
          { name: "Systolic", data: [138, 136, 134, 132, 130, 128], color: "#ef4444" },
          { name: "Diastolic", data: [88, 86, 84, 83, 82, 80], color: "#2563eb" },
        ],
      };
    }

    if (activeTab === "hba1c_glucose") {
      return {
        kind: "line",
        labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
        series: [
          { name: "HbA1c %", data: [8.6, 8.2, 7.9, 7.5, 7.2, 6.9], color: "#7c3aed" },
          { name: "Fasting Glucose g/L", data: [1.9, 1.8, 1.7, 1.5, 1.4, 1.3], color: "#f59e0b" },
        ],
      };
    }

    if (activeTab === "lab_critical") {
      return {
        kind: "bar",
        labels: ["Troponin", "K+", "CRP", "Creat", "Hb"],
        series: [{ name: "Critical", data: [4, 7, 3, 5, 2], color: "#ef4444" }],
      };
    }

    if (activeTab === "diagnosis_status") {
      return {
        kind: "pie",
        pieData: [
          { name: "Confirmed", value: 58, color: "#16A34A" },
          { name: "Suspected", value: 27, color: "#F59E0B" },
          { name: "Ruled Out", value: 15, color: "#64748B" },
        ],
      };
    }

    return {
      kind: "line",
      labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
      series: [{ name: "Response Score /10", data: [3, 4, 5, 6, 7, 8], color: "#10b981" }],
    };
  }, [activeTab]);

  const activePoint = React.useMemo(() => {
    if (chartModel.kind === "pie" || !chartModel.labels.length) return null;
    const safeIndex = Math.max(0, Math.min(chartModel.labels.length - 1, selectedPointIndex));
    return {
      index: safeIndex,
      label: chartModel.labels[safeIndex],
      values: chartModel.series.map((series) => ({
        name: series.name,
        value: series.data[safeIndex],
      })),
    };
  }, [chartModel, selectedPointIndex]);

  const chartOption = React.useMemo<EChartsOption>(() => {
    const axisLabelStyle = { color: theme.colors.textSecondary, fontSize: 11 };
    const legendTextStyle = { color: theme.colors.text, fontSize: 12, fontWeight: 700 as any };

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
        lineStyle: chartModel.kind === "line" ? { width: 3, color: series.color } : undefined,
        itemStyle: { color: series.color, borderRadius: chartModel.kind === "bar" ? 8 : 0 },
        areaStyle: chartModel.kind === "line" && chartModel.series.length === 1 ? { opacity: 0.08 } : undefined,
        barMaxWidth: chartModel.kind === "bar" ? 42 : undefined,
      })),
    };
  }, [chartModel, theme.colors.border, theme.colors.surface, theme.colors.text, theme.colors.textSecondary]);

  return (
    <PageShell scrollable={false} contentStyle={{ flex: 1, paddingTop: 14 }}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, backgroundColor: theme.colors.surface, padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: theme.colors.text }}>Statistiques</Text>
          <Text style={{ marginTop: 4, fontWeight: "700", color: theme.colors.textSecondary }}>Medical chart previews with mock data.</Text>
        </View>

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
                <Text style={{ fontWeight: "900", fontSize: 12, color: active ? "#fff" : theme.colors.text }}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, backgroundColor: theme.colors.surface, padding: 16 }} onLayout={(e) => setChartWidth(Math.max(320, e.nativeEvent.layout.width - 40))}>
          <Text style={{ fontWeight: "900", fontSize: 18, color: theme.colors.text, marginBottom: 12 }}>
            {TABS.find((x) => x.key === activeTab)?.label}
          </Text>
          <Animated.View
            style={{
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              opacity: enterAnim,
              paddingVertical: 4,
            }}
          >
            <EChart option={chartOption} width={chartWidth} height={320} />
            {pointHint ? (
              <View style={{ marginTop: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: theme.colors.primarySoft }}>
                <Text style={{ color: theme.colors.primary, fontWeight: "800", fontSize: 12 }}>{pointHint}</Text>
              </View>
            ) : null}
          </Animated.View>

          {activePoint ? (
            <>
              <View
                style={{
                  marginTop: 14,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 16,
                  backgroundColor: theme.colors.background,
                  padding: 14,
                  gap: 8,
                }}
              >
                <Text style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>
                  Detail: {activePoint.label}
                </Text>
                {activePoint.values.map((item) => (
                  <Text key={item.name} style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>
                    {item.name}: {item.value}
                  </Text>
                ))}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {chartModel.kind !== "pie" &&
                  chartModel.labels.map((label, index) => {
                    const active = index === activePoint.index;
                    return (
                      <TouchableOpacity
                        key={`${activeTab}-${label}-${index}`}
                        onPress={() => {
                          setSelectedPointIndex(index);
                          const values = chartModel.series.map((series) => `${series.name} ${series.data[index]}`).join(" | ");
                          setPointHint(`${label}: ${values}`);
                        }}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                        }}
                      >
                        <Text style={{ fontWeight: "800", fontSize: 12, color: active ? theme.colors.primary : theme.colors.text }}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </PageShell>
  );
}

