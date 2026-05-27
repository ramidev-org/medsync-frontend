import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
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
          <View style={{ alignItems: "center", justifyContent: "center" }}>{renderTabChart()}</View>
        </View>
      </ScrollView>
    </PageShell>
  );
}

