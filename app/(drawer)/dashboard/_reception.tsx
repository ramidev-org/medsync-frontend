import { TopBar } from "@/components/top_bar";
import { UserAvatar } from "@/components/user_avatar";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { useTasks } from "@/contexts/tasks_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getDashboardStyles } from "./_styles";

type VisitStatus = "pending" | "in_consultation" | "completed" | "cancelled";
type AgendaAppointment = {
  id: string;
  scheduled_at: string;
  status: VisitStatus | string;
  type: string;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
};
type RpcGetAppointmentsResponse = { appointments: AgendaAppointment[] };

export default function ReceptionDashboardPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDashboardStyles(theme), [theme]);
  const { user } = useAuth();
  const { clinic, subscription } = useAppData();
  const { recentTasks, loading: tasksLoading } = useTasks();
  const router = useRouter();
  const [counts, setCounts] = useState<any | null>(null);
  const [agenda, setAgenda] = useState<AgendaAppointment[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!user?.id) return;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const [c, agendaRes] = await Promise.all([
          callRpc<any, Record<string, unknown>>("rpc_get_clinic_dashboard_counts", {
            p_requester_id: user.id,
          }),
          callRpc<RpcGetAppointmentsResponse, Record<string, unknown>>("rpc_get_appointments", {
            p_requester_id: user.id,
            p_search: null,
            p_status: null,
            p_doctor_id: null,
            p_start_date: start.toISOString(),
            p_end_date: end.toISOString(),
            p_page: 1,
            p_items_per_page: 80,
          }).catch(() => ({ appointments: [] })),
        ]);

        if (!cancelled) {
          setCounts(c ?? null);
          setAgenda(agendaRes?.appointments ?? []);
        }
      } catch {
        if (!cancelled) {
          setCounts(null);
          setAgenda([]);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const pendingCount = counts?.appointments_pending ?? counts?.pending_appointments ?? counts?.pending_count ?? 0;
  const inConsultCount = agenda.filter((item) => item.status === "in_consultation").length;
  const completedCount = agenda.filter((item) => item.status === "completed").length;
  const cancelledCount = agenda.filter((item) => item.status === "cancelled").length;
  const completionRate = agenda.length ? Math.round((completedCount / agenda.length) * 100) : 0;

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={[styles.welcomeCard, localStyles.heroCard]}>
              <View style={localStyles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeTitle}>Bonjour, {user?.fullname ?? "Assistant"}</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Keep the front desk moving with a clean view of today&apos;s visits, confirmations, and billing follow-up.
                  </Text>
                </View>
                <View style={localStyles.heroBadge}>
                  <Ionicons name="sparkles-outline" size={18} color="#1D4ED8" />
                  <Text style={localStyles.heroBadgeText}>Assistant desk</Text>
                </View>
              </View>

              <View style={localStyles.heroActions}>
                <SoftActionChip theme={theme} icon="add-circle-outline" label="Create visit" onPress={() => router.push("/visits?open_new=1" as any)} />
                <SoftActionChip theme={theme} icon="calendar-outline" label="Open calendar" onPress={() => router.push("/calendar")} />
                <SoftActionChip theme={theme} icon="card-outline" label="Payments" onPress={() => router.push("/payments")} />
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard title="To confirm" value={pendingCount} icon="time-outline" tone="#2563EB" theme={theme} />
              <StatCard title="In consultation" value={inConsultCount} icon="pulse-outline" tone="#0F766E" theme={theme} />
              <StatCard title="Completed" value={completedCount} icon="checkmark-circle-outline" tone="#16A34A" theme={theme} />
              <StatCard title="Cancelled" value={cancelledCount} icon="close-circle-outline" tone="#DC2626" theme={theme} />
            </View>

            <View style={[styles.chartCard, localStyles.sectionCard]}>
              <View style={localStyles.sectionHeader}>
                <View>
                  <Text style={styles.cardTitle}>Today&apos;s agenda</Text>
                  <Text style={localStyles.sectionSub}>{agenda.length} appointments scheduled for the desk today</Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/visits")} style={localStyles.inlineLink}>
                  <Text style={localStyles.inlineLinkText}>Open visits</Text>
                </TouchableOpacity>
              </View>

              <View style={localStyles.agendaList}>
                {agenda.slice(0, 6).map((item, index) => {
                  const patientName = `${item.patient_first_name ?? ""} ${item.patient_last_name ?? ""}`.trim() || "Patient";
                  const status = statusChip(String(item.status), theme);
                  return (
                    <View key={item.id} style={localStyles.agendaRow}>
                      <View style={[localStyles.agendaAvatar, { backgroundColor: avatarTone(index).backgroundColor, borderColor: avatarTone(index).borderColor }]}>
                        <Text style={[localStyles.agendaAvatarText, { color: avatarTone(index).color }]}>{patientName.split(" ").filter(Boolean).slice(0, 2).map((value) => value[0]?.toUpperCase()).join("") || "P"}</Text>
                      </View>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={localStyles.agendaName} numberOfLines={1}>{patientName}</Text>
                        <Text style={localStyles.agendaMeta}>
                          {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.scheduled_at))} • {String(item.type || "consultation").replaceAll("_", " ")}
                        </Text>
                      </View>

                      <View style={[localStyles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
                        <Ionicons name={status.icon as any} size={13} color={status.text} />
                        <Text style={[localStyles.statusText, { color: status.text }]}>{status.label}</Text>
                      </View>
                    </View>
                  );
                })}

                {!agenda.length ? (
                  <Text style={localStyles.emptyText}>No appointments are scheduled for today.</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={[styles.doctorCard, localStyles.profileCard]}>
              <View style={styles.doctorHeader}>
                <UserAvatar name={user?.fullname || "Assistant"} avatarColor={user?.avatarColor} size={98} />
                <View style={styles.doctorInfo}>
                  <Text style={[styles.doctorName, { color: theme.colors.text }]}>{user?.fullname ?? "Assistant"}</Text>
                  <Text style={[styles.doctorRole, { color: theme.colors.muted }]}>Front desk operations</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={localStyles.inlineStats}>
                <MiniStat label="Clinic" value={clinic?.name ? String(clinic.name) : "MyDoctor"} theme={theme} />
                <MiniStat label="Plan" value={(subscription?.tier_plan || clinic?.tier_plan || "basic").toString()} theme={theme} />
              </View>

              <View style={{ marginTop: 14 }}>
                <ProgressCard label="Daily completion" value={`${completionRate}%`} progress={completionRate} theme={theme} />
              </View>
            </View>

            <View style={[styles.doctorCard, localStyles.sectionCard, { marginTop: 14 }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Desk priorities</Text>
              <View style={localStyles.priorityList}>
                <PriorityRow theme={theme} icon="chatbubble-ellipses-outline" title="Pending confirmations" value={String(pendingCount)} hint="Call or message patients" />
                <PriorityRow theme={theme} icon="receipt-outline" title="Payments to record" value={String(completedCount)} hint="After completed consultations" />
                <PriorityRow theme={theme} icon="refresh-outline" title="Cancelled visits" value={String(cancelledCount)} hint="Offer a new slot quickly" />
              </View>
            </View>

            <View style={[styles.doctorCard, localStyles.sectionCard, { marginTop: 14 }]}>
              <View style={localStyles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0 }]}>Recent tasks</Text>
                <TouchableOpacity onPress={() => router.push("/tasks")}>
                  <Text style={localStyles.inlineLinkText}>View all</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.activityList}>
                {!tasksLoading && recentTasks.map((task) => (
                  <ActivityItem
                    key={task.id}
                    title={task.title}
                    time={`${task.dueText || "Not set"} • ${task.status.replace("_", " ")}`}
                    icon={task.status === "done" ? "checkmark-done-outline" : task.status === "in_progress" ? "time-outline" : "clipboard-outline"}
                    theme={theme}
                  />
                ))}
                {!tasksLoading && recentTasks.length === 0 ? (
                  <Text style={localStyles.emptyText}>No recent tasks yet.</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SoftActionChip({ theme, icon, label, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[localStyles.softActionChip, { backgroundColor: theme.colors.surface }]}>
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text style={[localStyles.softActionChipText, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ title, value, icon, tone, theme }: any) {
  return (
    <View style={[localStyles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[localStyles.statIcon, { backgroundColor: `${tone}16`, borderColor: `${tone}24` }]}>
        <Ionicons name={icon} size={22} color={tone} />
      </View>
      <Text style={[localStyles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[localStyles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

function MiniStat({ label, value, theme }: any) {
  return (
    <View style={[localStyles.miniStat, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
      <Text style={[localStyles.miniStatLabel, { color: theme.colors.muted }]}>{label}</Text>
      <Text style={[localStyles.miniStatValue, { color: theme.colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ProgressCard({ label, value, progress, theme }: any) {
  return (
    <View>
      <View style={localStyles.progressTop}>
        <Text style={[localStyles.miniStatLabel, { color: theme.colors.muted }]}>{label}</Text>
        <Text style={[localStyles.miniStatValue, { color: theme.colors.text }]}>{value}</Text>
      </View>
      <View style={[localStyles.progressBar, { backgroundColor: theme.colors.border }]}>
        <View style={[localStyles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: theme.colors.primary }]} />
      </View>
    </View>
  );
}

function PriorityRow({ theme, icon, title, value, hint }: any) {
  return (
    <View style={[localStyles.priorityRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
      <View style={[localStyles.priorityIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[localStyles.priorityTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[localStyles.priorityHint, { color: theme.colors.muted }]}>{hint}</Text>
      </View>
      <Text style={[localStyles.priorityValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function ActivityItem({ title, time, icon, theme }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={[localStyles.activityIcon, { backgroundColor: theme.colors.accent }]}>
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "600", fontSize: 14, color: theme.colors.text }}>{title}</Text>
        <Text style={{ fontSize: 12, marginTop: 2, color: theme.colors.muted }}>{time}</Text>
      </View>
    </View>
  );
}

function avatarTone(index: number) {
  const tones = [
    { backgroundColor: "#EDF5FF", borderColor: "#CCDBF1", color: "#1D4ED8" },
    { backgroundColor: "#EAFBF4", borderColor: "#BCEBD6", color: "#047857" },
    { backgroundColor: "#FFF7ED", borderColor: "#FED7AA", color: "#EA580C" },
    { backgroundColor: "#F3EDFF", borderColor: "#DED2FF", color: "#7C3AED" },
  ];
  return tones[index % tones.length];
}

function statusChip(status: string, theme: any) {
  switch (status) {
    case "pending":
      return { label: "Pending", icon: "time-outline", bg: "rgba(37, 99, 235, 0.10)", border: "rgba(37, 99, 235, 0.18)", text: theme.colors.primary };
    case "in_consultation":
      return { label: "In progress", icon: "pulse-outline", bg: "rgba(15, 118, 110, 0.10)", border: "rgba(15, 118, 110, 0.18)", text: "#0F766E" };
    case "completed":
      return { label: "Done", icon: "checkmark-circle-outline", bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.22)", text: theme.colors.success };
    default:
      return { label: "Cancelled", icon: "close-circle-outline", bg: "rgba(239, 68, 68, 0.10)", border: "rgba(239, 68, 68, 0.18)", text: theme.colors.error };
  }
}

const localStyles = StyleSheet.create({
  heroCard: {
    gap: 18,
  },
  heroTop: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EDF5FF",
  },
  heroBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  softActionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE7F5",
  },
  softActionChipText: {
    fontWeight: "700",
    fontSize: 13,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCard: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  sectionSub: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  inlineLink: {
    paddingVertical: 4,
  },
  inlineLinkText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
  },
  agendaList: {
    gap: 10,
  },
  agendaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE7F5",
    backgroundColor: "#F8FBFF",
  },
  agendaAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  agendaAvatarText: {
    fontSize: 17,
    fontWeight: "700",
  },
  agendaName: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  agendaMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
  },
  inlineStats: {
    flexDirection: "row",
    gap: 10,
  },
  miniStat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  miniStatLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  miniStatValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
  },
  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  progressBar: {
    height: 9,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  priorityList: {
    gap: 10,
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  priorityIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  priorityHint: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },
  priorityValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
});
