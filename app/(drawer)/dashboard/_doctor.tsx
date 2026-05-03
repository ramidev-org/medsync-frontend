import { TopBar } from "@/components/top_bar";
import { getCurrentRoleImage } from "@/config/runtime";
import { normalizeSpeciality, specialityLabelFr } from "@/config/speciality";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import {
    FontAwesome5,
    FontAwesome6,
    Ionicons,
    MaterialCommunityIcons,
    MaterialIcons,
} from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import { getDashboardStyles } from "./_styles";

// Mock chart data removed - TODO: Implement real chart data from database
const chartData = {
  "RDV - CONS": {
    type: "line" as const,
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const,
    datasets: [
      { data: [0, 0, 0, 0, 0, 0, 0], strokeWidth: 3, label: "RDV" },
      { data: [0, 0, 0, 0, 0, 0, 0], strokeWidth: 3, label: "Consultations" },
    ],
  },
  "Revenus": {
    type: "bar" as const,
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const,
    datasets: [
      { data: [0, 0, 0, 0, 0, 0, 0], label: "Revenus (€)" },
    ],
  },
  "Répartition": {
    type: "pie" as const,
    data: [
      { name: "Général", population: 0, color: "#FF6384", legendFontColor: "#7F7F7F" },
      { name: "Spécialisé", population: 0, color: "#36A2EB", legendFontColor: "#7F7F7F" },
    ],
  },
} as const;

const ICON_FAMILIES = {
  ion: Ionicons,
  material: MaterialIcons,
  materialCommunity: MaterialCommunityIcons,
  fontAwesome5: FontAwesome5,
  fontAwesome6: FontAwesome6,
} as const;

type IconFamily = keyof typeof ICON_FAMILIES;
type ChartKey = keyof typeof chartData;

export default function DoctorDashboardPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDashboardStyles(theme), [theme]);

  const { user } = useAuth();
  const { clinic, subscription } = useAppData();
  const [counts, setCounts] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!user?.id) return;
        const c = await callRpc<any, Record<string, unknown>>(
          "rpc_get_clinic_dashboard_counts",
          { p_requester_id: user.id },
        );
        if (!cancelled) setCounts(c ?? null);
      } catch {
        if (!cancelled) setCounts(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const [selectedTab, setSelectedTab] = useState<ChartKey>("RDV - CONS");
  const [chartWidth, setChartWidth] = useState(500);

  const doctorSpecialityKey = useMemo(
    () => normalizeSpeciality((user as any)?.doctorProfile?.speciality),
    [user],
  );

  const renderChart = () => {
    const data = chartData[selectedTab];
    if (!data || chartWidth < 100) return null;

    const chartConfig = {
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 119, 182, ${opacity})`,
      labelColor: (opacity = 1) => theme.colors.text,
      style: { borderRadius: 16 },
      propsForLabels: { fontSize: 12, fontWeight: "600" as "600" },
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
                labels: [...data.labels],
                datasets: data.datasets.map((d: any, i: number) => ({
                  ...d,
                  data: [...d.data],
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
            />
          );

        case "bar":
          return (
            <BarChart
              data={{
                labels: [...data.labels],
                datasets: data.datasets.map((d: any) => ({
                  ...d,
                  data: [...d.data],
                })),
              }}
              width={chartWidth}
              height={280}
              yAxisLabel="€"
              yAxisSuffix=""
              chartConfig={{ ...chartConfig, barPercentage: 0.7 }}
              style={styles.chart}
              fromZero
              showBarTops={false}
            />
          );

        case "pie":
          return (
            <PieChart
              data={data.data.map((item: any) => ({ ...item }))}
              width={chartWidth}
              height={280}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              hasLegend
            />
          );

        default:
          return null;
      }
    } catch (error) {
      console.error("Chart render error:", error);
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: theme.colors.error }}>Erreur de chargement du graphique</Text>
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
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Bonjour, Dr {user?.fullname} 👋</Text>
              <Text style={styles.welcomeSubtitle}>Bienvenue sur votre tableau de bord</Text>
            </View>

            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, padding: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 10 }]}>
                Clinique & Abonnement
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontWeight: "800" }}>
                {clinic?.name ? String(clinic.name) : "—"} •{" "}
                {(subscription?.tier_plan || clinic?.tier_plan || "basic").toString()} •{" "}
                {subscription?.status || "missing"}
              </Text>
              {!!subscription?.expires_at && (
                <Text style={{ marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800" }}>
                  Expiration: {String(subscription.expires_at)}
                </Text>
              )}
            </View>

            <View style={styles.statsRow}>
              <StatCard
                title="Patients"
                value={String(counts?.patients ?? counts?.patients_count ?? 0)}
                percentage=""
                icon="personal-injury"
                color="#8b5cf6"
                iconFamily="material"
                theme={theme}
              />
              <StatCard
                title="Appointments"
                value={String(
                  counts?.appointments_total ?? counts?.appointments ?? counts?.appointments_count ?? 0,
                )}
                percentage=""
                icon="eye"
                color="#f59e0b"
                iconFamily="fontAwesome5"
                theme={theme}
              />
              <StatCard
                title="Pending"
                value={String(
                  counts?.appointments_pending ?? counts?.pending_appointments ?? counts?.pending_count ?? 0,
                )}
                percentage=""
                icon="calendar-check"
                color="#06b6d4"
                iconFamily="fontAwesome5"
                theme={theme}
              />
              <StatCard
                title="Payments (paid)"
                value={String(counts?.payments_paid ?? counts?.paid_payments ?? counts?.paid_count ?? 0)}
                percentage=""
                icon="truck-medical"
                color="#ef4444"
                iconFamily="fontAwesome6"
                theme={theme}
              />
            </View>

            <View style={styles.tabs}>
              {(Object.keys(chartData) as ChartKey[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor:
                        selectedTab === tab ? theme.colors.primary : theme.colors.surface,
                      borderColor: selectedTab === tab ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: selectedTab === tab ? "#fff" : theme.colors.text },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setChartWidth(width - 48);
              }}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {selectedTab} - Statistiques
              </Text>
              <View style={styles.chartPlaceholder}>{renderChart()}</View>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.doctorHeader}>
                <Image source={{ uri: getCurrentRoleImage() }} style={styles.avatar} />
                <View style={styles.doctorInfo}>
                  <Text style={[styles.doctorName, { color: theme.colors.text }]}>
                    Dr {user?.fullname}
                  </Text>
                  <Text style={[styles.doctorRole, { color: theme.colors.muted }]}>
                    {specialityLabelFr(doctorSpecialityKey)}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <DoctorStat label="N° Ordonnances" value="24" theme={theme} />
              <DoctorStat label="N° Lettres" value="9" theme={theme} />
              <DoctorStat label="Objectif Mensuel" value="75 / 150" theme={theme} progress={50} />
            </View>

            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface, marginTop: 16 }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Activité Récente</Text>
              <View style={styles.activityList}>
                <ActivityItem title="Consultation" time="Il y a 32 min" icon="eye" theme={theme} />
                <ActivityItem title="RDV Annulé" time="Il y a 1 h" icon="checkmark-circle" theme={theme} />
                <ActivityItem title="Nouveau Patient" time="Il y a 6 h" icon="calendar" theme={theme} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Components (same as your original) ---------- */

interface StatCardProps {
  title: string;
  value: string | number;
  percentage: string;
  icon: string;
  iconFamily?: IconFamily;
  color: string;
  theme: {
    colors: { surface: string; border: string; text: string; textSecondary: string };
  };
}

const StatCard = ({
  title,
  value,
  percentage,
  icon,
  iconFamily = "ion",
  color,
  theme,
}: StatCardProps) => {
  const IconComponent = ICON_FAMILIES[iconFamily];

  const cardStyles = StyleSheet.create({
    statCard: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 16,
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      position: "relative",
      overflow: "hidden",
    },
    contentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    textColumn: { flexDirection: "column" },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: color,
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: { fontSize: 32, fontWeight: "800", marginBottom: 4, color: theme.colors.text },
    statTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    percentageBadge: {
      position: "absolute",
      top: 16,
      right: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: color + "20",
    },
    percentageText: { fontSize: 12, fontWeight: "700", color: color },
  });

  return (
    <View style={cardStyles.statCard}>
      <View style={cardStyles.contentRow}>
        <View style={cardStyles.iconContainer}>
          <IconComponent name={icon as any} size={32} color="#fff" />
        </View>
        <View style={cardStyles.textColumn}>
          <Text style={cardStyles.statValue}>{value}</Text>
          <Text style={cardStyles.statTitle}>{title}</Text>
        </View>
      </View>
      <View style={cardStyles.percentageBadge}>
        <Text style={cardStyles.percentageText}>{percentage}</Text>
      </View>
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
    doctorStatRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    doctorStatValue: { fontWeight: "700", fontSize: 18, color: theme.colors.text },
    progressBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: theme.colors.border,
    },
    progressFill: { height: "100%", borderRadius: 4, backgroundColor: theme.colors.success },
  });

  return (
    <View style={statStyles.doctorStat}>
      <Text style={statStyles.doctorStatLabel}>{label}</Text>
      <View style={statStyles.doctorStatRow}>
        <Text style={statStyles.doctorStatValue}>{value}</Text>
        {progress !== undefined && (
          <View style={statStyles.progressBar}>
            <View style={[statStyles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </View>
    </View>
  );
};

const ActivityItem = ({ title, time, icon, theme }: any) => {
  const Ion = require("@expo/vector-icons").Ionicons;

  const activityStyles = StyleSheet.create({
    activityItem: { flexDirection: "row", alignItems: "center", gap: 12 },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.accent,
    },
    activityContent: { flex: 1 },
    activityTitle: { fontWeight: "600", fontSize: 14, color: theme.colors.text },
    activityTime: { fontSize: 12, marginTop: 2, color: theme.colors.muted },
  });

  return (
    <View style={activityStyles.activityItem}>
      <View style={activityStyles.activityIcon}>
        <Ion name={icon} size={16} color={theme.colors.primary} />
      </View>
      <View style={activityStyles.activityContent}>
        <Text style={activityStyles.activityTitle}>{title}</Text>
        <Text style={activityStyles.activityTime}>{time}</Text>
      </View>
    </View>
  );
};
