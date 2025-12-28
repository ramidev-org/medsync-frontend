import { TopBar } from "@/components/top_bar";
import { chartData } from "@/data/chart_data";
import { useTheme } from "@/theme/theme_provider";
import { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";

/* ================= MAIN COMPONENT ================= */
export default function DashboardPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [selectedTab, setSelectedTab] = useState("RDV - CONS");
  const [chartWidth, setChartWidth] = useState(500); // Default fallback width

  const renderChart = () => {
    const data = chartData[selectedTab];
    if (!data || chartWidth < 100) return null; // Safety check

    const chartConfig = {
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 119, 182, ${opacity})`,
      labelColor: (opacity = 1) => theme.colors.text,
      style: {
        borderRadius: 16,
      },
      propsForLabels: {
        fontSize: 12,
        fontWeight: "600" as "600",
      },
      propsForBackgroundLines: {
        strokeDasharray: "",
        stroke: theme.colors.border,
        strokeWidth: 1,
      },
    };

    try {
      switch (data.type) {
        case "line":
          return (
            <LineChart
              data={{
                labels: data.labels,
                datasets: data.datasets.map((d: any, i: number) => ({
                  ...d,
                  color: (opacity = 1) =>
                    i === 0
                      ? `rgba(0, 119, 182, ${opacity})`
                      : `rgba(0, 180, 216, ${opacity})`,
                })),
                legend: data.datasets.map((d: any) => d.label),
              }}
              width={chartWidth}
              height={280}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
            />
          );
        case "bar":
          return (
            <BarChart
              data={{
                labels: data.labels,
                datasets: data.datasets,
              }}
              width={chartWidth}
              height={280}
              yAxisLabel="€"
              yAxisSuffix=""
              chartConfig={{
                ...chartConfig,
                barPercentage: 0.7,
              }}
              style={styles.chart}
              withInnerLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              fromZero={true}
              showBarTops={false}
            />
          );
        case "pie":
          return (
            <PieChart
              data={data.data}
              width={chartWidth}
              height={280}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute={false}
              hasLegend={true}
              center={[10, 10]}
            />
          );
        default:
          return null;
      }
    } catch (error) {
      console.error("Chart render error:", error);
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: theme.colors.error }}>
            Erreur de chargement du graphique
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <View style={styles.leftColumn}>
            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>
                Bonjour, Dr Docteur DOCTEUR 👋
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Bienvenue sur votre tableau de bord
              </Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatCard
                title="Patients"
                value="877"
                color={theme.colors.chart1}
                theme={theme}
              />
              <StatCard
                title="Consultations"
                value="1,437"
                color={theme.colors.chart2}
                theme={theme}
              />
              <StatCard
                title="RDVs"
                value="1,719"
                color={theme.colors.chart3}
                theme={theme}
              />
              <StatCard
                title="Urgents"
                value="2"
                color={theme.colors.error}
                theme={theme}
              />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {Object.keys(chartData).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor:
                        selectedTab === tab
                          ? theme.colors.primary
                          : theme.colors.surface,
                      borderColor:
                        selectedTab === tab
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: selectedTab === tab ? "#fff" : theme.colors.text,
                      },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart Card */}
            <View
              style={[
                styles.chartCard,
                { backgroundColor: theme.colors.surface },
              ]}
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setChartWidth(width - 48); // Card padding is 24 on each side
              }}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {selectedTab} - Statistiques
              </Text>
              <View style={styles.chartPlaceholder}>{renderChart()}</View>
            </View>
          </View>

          {/* Right Column - Doctor Card */}
          <View style={styles.rightColumn}>
            <View
              style={[
                styles.doctorCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.doctorHeader}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/60" }}
                  style={styles.avatar}
                />
                <View style={styles.doctorInfo}>
                  <Text
                    style={[styles.doctorName, { color: theme.colors.text }]}
                  >
                    Dr Docteur DOCTEUR
                  </Text>
                  <Text
                    style={[styles.doctorRole, { color: theme.colors.muted }]}
                  >
                    Médecin Généraliste
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              <DoctorStat label="N° Ordonnances" value="24" theme={theme} />
              <DoctorStat label="N° Lettres" value="9" theme={theme} />
              <DoctorStat
                label="Objectif Mensuel"
                value="75 / 150"
                theme={theme}
                progress={50}
              />

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Activité Récente
              </Text>

              <View style={styles.activityList}>
                <ActivityItem
                  title="Consultation"
                  time="Il y a 30 min"
                  icon="checkmark-circle"
                  theme={theme}
                />
                <ActivityItem
                  title="RDV Annulé"
                  time="Il y a 2h"
                  icon="close-circle"
                  theme={theme}
                />
                <ActivityItem
                  title="Nouveau Patient"
                  time="Il y a 4h"
                  icon="person-add"
                  theme={theme}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= COMPONENTS ================= */
const StatCard = ({ title, value, color, theme }: any) => {
  const cardStyles = StyleSheet.create({
    statCard: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 14,
      flex: 1,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderLeftColor: color,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    statValue: {
      fontSize: 28,
      fontWeight: "800",
      marginBottom: 4,
      color: theme.colors.text,
    },
    statTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.muted,
    },
  });

  return (
    <View style={cardStyles.statCard}>
      <Text style={cardStyles.statValue}>{value}</Text>
      <Text style={cardStyles.statTitle}>{title}</Text>
    </View>
  );
};

const DoctorStat = ({ label, value, theme, progress }: any) => {
  const statStyles = StyleSheet.create({
    doctorStat: { marginBottom: 16 },
    doctorStatLabel: {
      fontSize: 13,
      marginBottom: 4,
      fontWeight: "600",
      color: theme.colors.muted,
    },
    doctorStatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    doctorStatValue: {
      fontWeight: "700",
      fontSize: 18,
      color: theme.colors.text,
    },
    progressBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: theme.colors.border,
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: theme.colors.success,
    },
  });

  return (
    <View style={statStyles.doctorStat}>
      <Text style={statStyles.doctorStatLabel}>{label}</Text>
      <View style={statStyles.doctorStatRow}>
        <Text style={statStyles.doctorStatValue}>{value}</Text>
        {progress !== undefined && (
          <View style={statStyles.progressBar}>
            <View
              style={[statStyles.progressFill, { width: `${progress}%` }]}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const ActivityItem = ({ title, time, icon, theme }: any) => {
  const Ionicons = require("@expo/vector-icons").Ionicons;

  const activityStyles = StyleSheet.create({
    activityItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.accent,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontWeight: "600",
      fontSize: 14,
      color: theme.colors.text,
    },
    activityTime: {
      fontSize: 12,
      marginTop: 2,
      color: theme.colors.muted,
    },
  });

  return (
    <View style={activityStyles.activityItem}>
      <View style={activityStyles.activityIcon}>
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <View style={activityStyles.activityContent}>
        <Text style={activityStyles.activityTitle}>{title}</Text>
        <Text style={activityStyles.activityTime}>{time}</Text>
      </View>
    </View>
  );
};

/* ================= STYLES ================= */
const getStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
    },
    row: {
      flexDirection: "row",
      gap: 24,
    },
    leftColumn: {
      flex: 2,
      gap: 20,
    },
    rightColumn: {
      flex: 1,
    },

    // Welcome Card
    welcomeCard: {
      backgroundColor: theme.colors.primary,
      padding: 28,
      borderRadius: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    welcomeTitle: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "700",
    },
    welcomeSubtitle: {
      color: "rgba(255, 255, 255, 0.85)",
      marginTop: 6,
      fontSize: 15,
    },

    // Stats Row
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
    },

    // Tabs
    tabs: {
      flexDirection: "row",
      gap: 12,
      flexWrap: "wrap",
    },
    tab: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    tabText: {
      fontWeight: "700",
      fontSize: 13,
    },

    // Chart Card
    chartCard: {
      borderRadius: 16,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden", // Prevent chart from overflowing
    },
    cardTitle: {
      fontWeight: "700",
      fontSize: 18,
      marginBottom: 20,
    },
    chartPlaceholder: {
      alignItems: "center",
      width: "100%", // Ensure container takes full width
      overflow: "hidden", // Prevent overflow
    },
    chart: {
      borderRadius: 12,
      marginVertical: 8,
    },

    // Doctor Card
    doctorCard: {
      padding: 24,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    doctorHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    doctorInfo: {
      flex: 1,
    },
    doctorName: {
      fontWeight: "700",
      fontSize: 16,
    },
    doctorRole: {
      fontSize: 13,
      marginTop: 2,
    },
    divider: {
      height: 1,
      marginVertical: 20,
    },
    sectionTitle: {
      fontWeight: "700",
      fontSize: 15,
      marginBottom: 16,
    },
    activityList: {
      gap: 12,
    },
  });
