import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { Animated, Easing, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";

type StatTab =
  | "patient_flow"
  | "vitals_trend"
  | "bp_control"
  | "hba1c_glucose"
  | "lab_critical"
  | "diagnosis_status"
  | "treatment_response";

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
  const [pointHint, setPointHint] = React.useState<string>("");
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

  const baseChartConfig = React.useMemo(
    () => ({
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(37,99,235,${opacity})`,
      labelColor: () => theme.colors.text,
      propsForBackgroundLines: { stroke: theme.colors.border, strokeWidth: 1 },
    }),
    [theme.colors]
  );

  const hoverSeries = React.useMemo(() => {
    if (activeTab === "patient_flow") {
      return {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        series: [
          { name: "Visits", data: [12, 18, 15, 22, 20, 11, 9] },
          { name: "Consultations", data: [9, 14, 12, 17, 16, 8, 7] },
        ],
      };
    }
    if (activeTab === "vitals_trend") {
      return {
        labels: ["D1", "D2", "D3", "D4", "D5", "D6", "D7"],
        series: [
          { name: "Temp °C", data: [37.1, 37.0, 37.4, 37.2, 36.9, 37.3, 37.1] },
          { name: "SpO2 %", data: [96, 95, 94, 97, 98, 96, 97] },
        ],
      };
    }
    if (activeTab === "bp_control") {
      return {
        labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
        series: [
          { name: "Systolic", data: [138, 136, 134, 132, 130, 128] },
          { name: "Diastolic", data: [88, 86, 84, 83, 82, 80] },
        ],
      };
    }
    if (activeTab === "hba1c_glucose") {
      return {
        labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
        series: [
          { name: "HbA1c %", data: [8.6, 8.2, 7.9, 7.5, 7.2, 6.9] },
          { name: "Glucose g/L", data: [1.9, 1.8, 1.7, 1.5, 1.4, 1.3] },
        ],
      };
    }
    if (activeTab === "lab_critical") {
      return {
        labels: ["Troponin", "K+", "CRP", "Creat", "Hb"],
        series: [{ name: "Critical", data: [4, 7, 3, 5, 2] }],
      };
    }
    if (activeTab === "treatment_response") {
      return {
        labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
        series: [{ name: "Response /10", data: [3, 4, 5, 6, 7, 8] }],
      };
    }
    return null;
  }, [activeTab]);

  const activePoint = React.useMemo(() => {
    if (!hoverSeries?.labels?.length) return null;
    const safeIndex = Math.max(0, Math.min(hoverSeries.labels.length - 1, selectedPointIndex));
    return {
      index: safeIndex,
      label: hoverSeries.labels[safeIndex],
      values: hoverSeries.series.map((series) => ({
        name: series.name,
        value: series.data[safeIndex],
      })),
    };
  }, [hoverSeries, selectedPointIndex]);

  const renderTabChart = () => {
    if (activeTab === "patient_flow") {
      return (
        <LineChart
          data={{
            labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
            datasets: [
              { data: [12, 18, 15, 22, 20, 11, 9], strokeWidth: 3, color: (o = 1) => `rgba(37,99,235,${o})` },
              { data: [9, 14, 12, 17, 16, 8, 7], strokeWidth: 3, color: (o = 1) => `rgba(6,182,212,${o})` },
            ],
            legend: ["Visits", "Consultations"],
          }}
          width={chartWidth}
          height={290}
          chartConfig={baseChartConfig}
          bezier
        />
      );
    }

    if (activeTab === "vitals_trend") {
      return (
        <LineChart
          data={{
            labels: ["D1", "D2", "D3", "D4", "D5", "D6", "D7"],
            datasets: [
              { data: [37.1, 37.0, 37.4, 37.2, 36.9, 37.3, 37.1], strokeWidth: 3, color: (o = 1) => `rgba(245,158,11,${o})` },
              { data: [96, 95, 94, 97, 98, 96, 97], strokeWidth: 3, color: (o = 1) => `rgba(6,182,212,${o})` },
            ],
            legend: ["Temp °C", "SpO2 %"],
          }}
          width={chartWidth}
          height={290}
          chartConfig={baseChartConfig}
          bezier
        />
      );
    }

    if (activeTab === "bp_control") {
      return (
        <LineChart
          data={{
            labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
            datasets: [
              { data: [138, 136, 134, 132, 130, 128], strokeWidth: 3, color: (o = 1) => `rgba(239,68,68,${o})` },
              { data: [88, 86, 84, 83, 82, 80], strokeWidth: 3, color: (o = 1) => `rgba(37,99,235,${o})` },
            ],
            legend: ["Systolic", "Diastolic"],
          }}
          width={chartWidth}
          height={290}
          chartConfig={baseChartConfig}
          bezier
        />
      );
    }

    if (activeTab === "hba1c_glucose") {
      return (
        <LineChart
          data={{
            labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
            datasets: [
              { data: [8.6, 8.2, 7.9, 7.5, 7.2, 6.9], strokeWidth: 3, color: (o = 1) => `rgba(124,58,237,${o})` },
              { data: [1.9, 1.8, 1.7, 1.5, 1.4, 1.3], strokeWidth: 3, color: (o = 1) => `rgba(245,158,11,${o})` },
            ],
            legend: ["HbA1c %", "Fasting Glucose g/L"],
          }}
          width={chartWidth}
          height={290}
          chartConfig={baseChartConfig}
          bezier
        />
      );
    }

    if (activeTab === "lab_critical") {
      return (
        <BarChart
          data={{ labels: ["Troponin", "K+", "CRP", "Creat", "Hb"], datasets: [{ data: [4, 7, 3, 5, 2] }] }}
          width={chartWidth}
          height={290}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{ ...baseChartConfig, color: (o = 1) => `rgba(239,68,68,${o})`, barPercentage: 0.55 }}
          fromZero
          showBarTops={false}
        />
      );
    }

    if (activeTab === "diagnosis_status") {
      return (
        <PieChart
          data={[
            { name: "Confirmed", population: 58, color: "#16A34A", legendFontColor: theme.colors.text, legendFontSize: 12 },
            { name: "Suspected", population: 27, color: "#F59E0B", legendFontColor: theme.colors.text, legendFontSize: 12 },
            { name: "Ruled Out", population: 15, color: "#64748B", legendFontColor: theme.colors.text, legendFontSize: 12 },
          ]}
          width={chartWidth}
          height={290}
          chartConfig={baseChartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          hasLegend
        />
      );
    }

    return (
      <LineChart
        data={{
          labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
          datasets: [{ data: [3, 4, 5, 6, 7, 8], strokeWidth: 3, color: (o = 1) => `rgba(16,185,129,${o})` }],
          legend: ["Response Score /10"],
        }}
        width={chartWidth}
        height={290}
        chartConfig={baseChartConfig}
        bezier
      />
    );
  };

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
            {renderTabChart()}
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
                  Détail: {activePoint.label}
                </Text>
                {activePoint.values.map((item) => (
                  <Text key={item.name} style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>
                    {item.name}: {item.value}
                  </Text>
                ))}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {hoverSeries?.labels.map((label, index) => {
                  const active = index === activePoint.index;
                  return (
                    <TouchableOpacity
                      key={`${activeTab}-${label}-${index}`}
                      onPress={() => {
                        setSelectedPointIndex(index);
                        const values = hoverSeries.series.map((series) => `${series.name} ${series.data[index]}`).join(" | ");
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
