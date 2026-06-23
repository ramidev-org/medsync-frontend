import { TopBar } from "@/components/top_bar";
import { EChart } from "@/components/charts/echart";
import { UserAvatar } from "@/components/user_avatar";
import { normalizeSpeciality, specialityLabelFr } from "@/config/speciality";
import { useAuth } from "@/contexts/auth_context";
import { TaskPriority, TaskStatus, useTasks } from "@/contexts/tasks_context";
import { getClinicAnalytics } from "@/services/analytics.services";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getDashboardStyles } from "./_styles";

const ICON_FAMILIES = {
  ion: Ionicons,
  material: MaterialIcons,
  materialCommunity: MaterialCommunityIcons,
  fontAwesome5: FontAwesome5,
  fontAwesome6: FontAwesome6,
} as const;

type IconFamily = keyof typeof ICON_FAMILIES;

export default function DoctorDashboardPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDashboardStyles(theme), [theme]);
  const { user } = useAuth();
  const router = useRouter();
  const { recentTasks, loading: tasksLoading } = useTasks();
  const [counts, setCounts] = useState<any | null>(null);
  const [chartWidth, setChartWidth] = useState(420);
  const chartAnim = useMemo(() => new Animated.Value(0), []);
  const [flowLabels, setFlowLabels] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  const [visitsData, setVisitsData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [consultationsData, setConsultationsData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const chartOption = useMemo(
    () => ({
      animationDuration: 500,
      color: ["#2563eb", "#06b6d4"],
      tooltip: { trigger: "axis" },
      legend: {
        top: 0,
        left: "center",
        textStyle: { color: theme.colors.text, fontSize: 12, fontWeight: 700 as any },
      },
      grid: {
        left: 14,
        right: 14,
        top: 42,
        bottom: 18,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: flowLabels,
        axisLabel: { color: theme.colors.textSecondary, fontSize: 11 },
        axisLine: { lineStyle: { color: theme.colors.border } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: theme.colors.textSecondary, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: theme.colors.border } },
      },
      series: [
        {
          name: "Visits",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          data: visitsData,
          lineStyle: { width: 3, color: "#2563eb" },
          itemStyle: { color: "#2563eb" },
        },
        {
          name: "Consultations",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          data: consultationsData,
          lineStyle: { width: 3, color: "#06b6d4" },
          itemStyle: { color: "#06b6d4" },
        },
      ],
    }),
    [consultationsData, flowLabels, theme.colors.border, theme.colors.text, theme.colors.textSecondary, visitsData],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!user?.id) return;
        const c = await callRpc<any, Record<string, unknown>>("rpc_get_clinic_dashboard_counts", {
          p_requester_id: user.id,
        });
        const analytics = await getClinicAnalytics({
          requesterId: user.id,
          startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }).catch(() => null);
        if (!cancelled) setCounts(c ?? null);
        if (!cancelled && analytics?.daily?.length) {
          setFlowLabels(analytics.daily.map((item) => item.label));
          setVisitsData(analytics.daily.map((item) => item.appointments));
          setConsultationsData(analytics.daily.map((item) => item.consultations));
        }
      } catch {
        if (!cancelled) setCounts(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [chartAnim]);

  const doctorSpecialityKey = useMemo(() => normalizeSpeciality((user as any)?.doctorProfile?.speciality), [user]);

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

            <View style={styles.statsRow}>
              <StatCard title="Patients" value={String(counts?.patients ?? 0)} icon="personal-injury" color="#8b5cf6" iconFamily="material" theme={theme} />
              <StatCard title="Appointments" value={String(counts?.appointments_total ?? 0)} icon="eye" color="#f59e0b" iconFamily="fontAwesome5" theme={theme} />
              <StatCard title="Completed visits" value={String(counts?.appointments_completed ?? 0)} icon="check-decagram" color="#16a34a" iconFamily="materialCommunity" theme={theme} />
            </View>

            <Animated.View
              style={[
                styles.chartCard,
                {
                  backgroundColor: theme.colors.surface,
                  minHeight: 330,
                  transform: [{ translateY: chartAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                  opacity: chartAnim,
                },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Patient Flow</Text>
                <TouchableOpacity onPress={() => router.push("/statistiques")} style={{ paddingVertical: 4 }}>
                  <Text style={{ color: theme.colors.primary, fontWeight: "900", fontSize: 12, textDecorationLine: "underline" }}>View more data</Text>
                </TouchableOpacity>
              </View>
              <View
                onLayout={(e) => setChartWidth(Math.max(320, e.nativeEvent.layout.width - 24))}
                style={{ alignItems: "center", justifyContent: "center", position: "relative" }}
              >
                <EChart option={chartOption as any} width={chartWidth} height={250} />
              </View>
            </Animated.View>
          </View>

          <View style={styles.rightColumn}>
            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.doctorHeader}>
                <UserAvatar name={user?.fullname || "Doctor"} avatarColor={user?.avatarColor} size={98} />
                <View style={styles.doctorInfo}>
                  <Text style={[styles.doctorName, { color: theme.colors.text }]}>Dr {user?.fullname}</Text>
                  <Text style={[styles.doctorRole, { color: theme.colors.muted }]}>{specialityLabelFr(doctorSpecialityKey)}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={{ flexDirection: "row", gap: 18, marginBottom: 10 }}>
                <DoctorInlineStat label="N° Ordonnances" value="24" theme={theme} />
                <DoctorInlineStat label="N° Lettres" value="9" theme={theme} />
              </View>
            </View>

            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface, minHeight: 330, marginTop: 12 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Taches recentes</Text>
                <TouchableOpacity onPress={() => router.push("/tasks")}>
                  <Text style={{ color: theme.colors.primary, fontWeight: "900", fontSize: 12 }}>View all tasks</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.activityList}>
                {!tasksLoading && recentTasks.map((task) => (
                  <ActivityItem
                    key={task.id}
                    title={task.title}
                    time={`${task.dueText || "Not set"} - ${taskStatusLabel(task.status)}`}
                    icon={taskIcon(task.status)}
                    priority={task.priority}
                    theme={theme}
                  />
                ))}
                {!tasksLoading && recentTasks.length === 0 ? (
                  <Text style={{ color: theme.colors.muted, fontWeight: "700" }}>
                    No recent tasks yet.
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconFamily?: IconFamily;
  color: string;
  theme: { colors: { surface: string; border: string; text: string; textSecondary: string } };
}

const StatCard = ({ title, value, icon, iconFamily = "ion", color, theme }: StatCardProps) => {
  const IconComponent = ICON_FAMILIES[iconFamily];
  const cardStyles = StyleSheet.create({
    statCard: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 16,
      flex: 1,
      minWidth: 180,
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
    textColumn: { flex: 1, minWidth: 0 },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: color,
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: { fontSize: 28, fontWeight: "800", marginBottom: 2, color: theme.colors.text },
    statTitle: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary },
  });
  return (
    <View style={cardStyles.statCard}>
      <View style={cardStyles.contentRow}>
        <View style={cardStyles.iconContainer}>
          <IconComponent name={icon as any} size={28} color="#fff" />
        </View>
        <View style={cardStyles.textColumn}>
          <Text style={cardStyles.statValue}>{value}</Text>
          <Text style={cardStyles.statTitle} numberOfLines={2}>{title}</Text>
        </View>
      </View>
    </View>
  );
};

const DoctorStat = ({ label, value, theme, progress }: any) => {
  const statStyles = StyleSheet.create({
    doctorStat: { marginBottom: 16 },
    doctorStatLabel: { fontSize: 13, marginBottom: 4, fontWeight: "600", color: theme.colors.muted },
    doctorStatRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    doctorStatValue: { fontWeight: "700", fontSize: 18, color: theme.colors.text },
    progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: theme.colors.border },
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

const DoctorInlineStat = ({ label, value, theme }: any) => (
  <View style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 10, backgroundColor: theme.colors.background }}>
    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.muted }}>{label}</Text>
    <Text style={{ marginTop: 4, fontSize: 18, fontWeight: "400", color: theme.colors.text }}>{value}</Text>
  </View>
);

function taskStatusLabel(status: TaskStatus) {
  if (status === "in_progress") return "in progress";
  if (status === "done") return "done";
  return "to do";
}
function taskIcon(status: TaskStatus) {
  if (status === "in_progress") return "time-outline";
  if (status === "done") return "checkmark-done-outline";
  return "clipboard-outline";
}
function priorityColor(priority: TaskPriority, theme: any) {
  if (priority === "high") return theme.colors.error;
  if (priority === "medium") return theme.colors.warning;
  return theme.colors.success;
}
const ActivityItem = ({ title, time, icon, priority = "medium", theme }: any) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: `${priorityColor(priority, theme)}18` }}>
      <Ionicons name={icon} size={16} color={priorityColor(priority, theme)} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: "600", fontSize: 14, color: theme.colors.text }}>{title}</Text>
      <Text style={{ fontSize: 12, marginTop: 2, color: theme.colors.muted }}>{time}</Text>
    </View>
  </View>
);
