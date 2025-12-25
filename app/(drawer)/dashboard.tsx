import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BarChart,
  LineChart,
  PieChart,
} from "react-native-chart-kit";

/* ================= MOCK DATA ================= */
const chartData: any = {
  "RDV - CONS": {
    type: "line",
    labels: ["01", "02", "03", "04", "05", "06", "07"],
    datasets: [
      {
        data: [20, 25, 30, 28, 35, 40, 38],
        color: (opacity = 1) => `rgba(59,130,246, ${opacity})`,
        strokeWidth: 2,
        label: "RDV",
      },
      {
        data: [15, 18, 22, 20, 25, 30, 28],
        color: (opacity = 1) => `rgba(245,158,11, ${opacity})`,
        strokeWidth: 2,
        label: "Consultations",
      },
    ],
  },
  "EFFICACITÉ RDV": {
    type: "line",
    labels: ["01", "02", "03", "04", "05", "06", "07"],
    datasets: [
      {
        data: [0.8, 0.9, 0.75, 0.85, 0.9, 0.95, 0.88],
        color: (opacity = 1) => `rgba(139,92,246, ${opacity})`,
        strokeWidth: 2,
        label: "Efficacité",
      },
    ],
  },
  REVENU: {
    type: "bar",
    labels: ["01", "02", "03", "04", "05", "06", "07"],
    datasets: [
      {
        data: [1500, 2000, 1800, 2200, 2100, 2500, 2300],
      },
    ],
  },
  MALADIES: {
    type: "pie",
    data: [
      { name: "Grippe", population: 5, color: "#8b5cf6", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Covid", population: 2, color: "#f59e0b", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Diabète", population: 7, color: "#3b82f6", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Hypertension", population: 4, color: "#ef4444", legendFontColor: "#000", legendFontSize: 12 },
    ],
  },
  SYMPTÔMES: {
    type: "pie",
    data: [
      { name: "Fièvre", population: 6, color: "#8b5cf6", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Toux", population: 4, color: "#f59e0b", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Maux de tête", population: 8, color: "#3b82f6", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Fatigue", population: 5, color: "#ef4444", legendFontColor: "#000", legendFontSize: 12 },
    ],
  },
  MÉDICAMENTS: {
    type: "pie",
    data: [
      { name: "Paracétamol", population: 20, color: "#8b5cf6", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Ibuprofène", population: 15, color: "#f59e0b", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Antibiotiques", population: 10, color: "#3b82f6", legendFontColor: "#000", legendFontSize: 12 },
    ],
  },
  BILANS: {
    type: "pie",
    data: [
      { name: "Sanguin", population: 12, color: "#8b5cf6", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Urinaire", population: 8, color: "#f59e0b", legendFontColor: "#000", legendFontSize: 12 },
      { name: "Radio", population: 5, color: "#3b82f6", legendFontColor: "#000", legendFontSize: 12 },
    ],
  },
};

/* ================= MAIN COMPONENT ================= */
export default function DashboardPage() {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState("RDV - CONS");

  const renderChart = () => {
    const data = chartData[selectedTab];
    const screenWidth = Dimensions.get("window").width * 0.55;

    if (!data) return null;

    switch (data.type) {
      case "line":
        return (
          <LineChart
            data={{
              labels: data.labels,
              datasets: data.datasets,
            }}
            width={screenWidth}
            height={300}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#fff",
              },
            }}
            style={{ borderRadius: 12 }}
          />
        );
      case "bar":
        return (
          <BarChart
            data={{
              labels: data.labels,
              datasets: data.datasets,
            }}
            width={screenWidth}
            height={300}
            yAxisLabel=""        // <-- REQUIRED
            yAxisSuffix=""       // <-- REQUIRED
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59,130,246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
            }}
            style={{ borderRadius: 12 }}
          />)

      case "pie":
        return (
          <PieChart
            data={data.data}
            width={screenWidth}
            height={300}
            chartConfig={{
              color: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          {/* ================= LEFT COLUMN ================= */}
          <View style={styles.leftColumn}>
            {/* Welcome */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>
                Bonjour : Dr Docteur DOCTEUR 👋
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Bienvenue sur votre tableau de bord
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard title="Patients" value="877" color="#8b5cf6" />
              <StatCard title="Consultations" value="1437" color="#f59e0b" />
              <StatCard title="RDVs" value="1719" color="#3b82f6" />
              <StatCard title="Urgents" value="2" color="#ef4444" />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {Object.keys(chartData).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={[
                    styles.tab,
                    selectedTab === tab && { backgroundColor: "#0369a1" },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab && { color: "#fff" },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>{selectedTab} Statistiques</Text>
              <View style={styles.chartPlaceholder}>{renderChart()}</View>
            </View>
          </View>

          {/* ================= RIGHT COLUMN ================= */}
          <View style={styles.rightColumn}>
            <View style={styles.doctorCard}>
              <Image
                source={{ uri: "https://i.imgur.com/6VBx3io.png" }}
                style={styles.avatar}
              />

              <Text style={styles.doctorName}>Dr Docteur DOCTEUR</Text>
              <Text style={styles.doctorRole}>Médecin</Text>

              <View style={styles.divider} />

              <DoctorStat label="N° Ordonnances" value="24" />
              <DoctorStat label="N° Lettres" value="9" />
              <DoctorStat label="Objectif Mensuel" value="1 / 150" />

              <View style={styles.divider} />

              <Text style={styles.cardTitle}>Activité / Type</Text>

              <View style={styles.donutPlaceholder}>
                <Text style={{ color: "#94a3b8" }}>
                  🍩 Donut Chart (mock)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= COMPONENTS ================= */
const StatCard = ({ title, value, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const DoctorStat = ({ label, value }: any) => (
  <View style={styles.doctorStat}>
    <Text style={styles.doctorStatValue}>{value}</Text>
    <Text style={styles.doctorStatLabel}>{label}</Text>
  </View>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  page: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  row: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
  leftColumn: { flex: 2, gap: 20 },
  rightColumn: { flex: 1 },
  welcomeCard: { backgroundColor: "#0ea5e9", padding: 24, borderRadius: 14 },
  welcomeTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  welcomeSubtitle: { color: "#e0f2fe", marginTop: 6 },
  statsRow: { flexDirection: "row", gap: 16 },
  statCard: { backgroundColor: "#fff", padding: 18, borderRadius: 14, width: "23%", borderLeftWidth: 6 },
  statValue: { fontSize: 24, fontWeight: "700" },
  statTitle: { color: "#64748b", marginTop: 4 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tab: { backgroundColor: "#e0f2fe", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabText: { color: "#0369a1", fontSize: 14, fontWeight: "600" },
  chartCard: { backgroundColor: "#fff", borderRadius: 14, padding: 20 },
  cardTitle: { fontWeight: "700", marginBottom: 12 },
  chartPlaceholder: { height: 350, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  doctorCard: { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", position: "sticky", top: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  doctorName: { fontWeight: "700", fontSize: 16 },
  doctorRole: { color: "#64748b", marginBottom: 12 },
  divider: { height: 1, backgroundColor: "#e2e8f0", width: "100%", marginVertical: 14 },
  doctorStat: { alignItems: "center", marginBottom: 10 },
  doctorStatValue: { fontWeight: "700", fontSize: 16 },
  doctorStatLabel: { fontSize: 12, color: "#64748b" },
  donutPlaceholder: { height: 260, width: "100%", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center", marginTop: 10 },
});
