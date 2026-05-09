import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AppointmentRow = {
  id: string;
  scheduled_at: string;
  status: string;
  type: string;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  doctor_name?: string | null;
};

type RpcGetAppointmentsResponse = {
  appointments: AppointmentRow[];
};

const HOURS = Array.from({ length: 12 }, (_, index) => index + 7);
const ROOMS = ["Room 1", "Room 2", "Room 3", "Overflow"];
const STATUS_FILTERS = ["all", "pending", "in_consultation", "completed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const toHourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

function statusPalette(status: string, theme: any) {
  const key = String(status || "").toLowerCase();
  if (key === "completed") {
    return { bg: "rgba(22, 163, 74, 0.12)", border: "rgba(22, 163, 74, 0.36)", text: "#166534" };
  }
  if (key === "cancelled") {
    return { bg: "rgba(220, 38, 38, 0.11)", border: "rgba(220, 38, 38, 0.28)", text: "#991B1B" };
  }
  if (key === "in_consultation") {
    return { bg: "rgba(2, 132, 199, 0.13)", border: "rgba(2, 132, 199, 0.34)", text: "#0C4A6E" };
  }
  return { bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.32)", text: "#3730A3" };
}

export default function CalendarPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [rows, setRows] = React.useState<AppointmentRow[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<StatusFilter>("all");
  const [dayOffset, setDayOffset] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() + dayOffset);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const res = await callRpc<RpcGetAppointmentsResponse, Record<string, unknown>>("rpc_get_appointments", {
          p_requester_id: user.id,
          p_search: null,
          p_status: null,
          p_doctor_id: null,
          p_start_date: start.toISOString(),
          p_end_date: end.toISOString(),
          p_page: 1,
          p_items_per_page: 180,
        });
        if (!cancelled) setRows(res?.appointments ?? []);
      } catch {
        if (!cancelled) setRows([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [dayOffset, user?.id]);

  const filteredRows = React.useMemo(() => {
    if (selectedStatus === "all") return rows;
    return rows.filter((item) => String(item.status || "").toLowerCase() === selectedStatus);
  }, [rows, selectedStatus]);

  const stats = React.useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((row) => String(row.status || "").toLowerCase() === "pending").length;
    const active = rows.filter((row) => String(row.status || "").toLowerCase() === "in_consultation").length;
    const completed = rows.filter((row) => String(row.status || "").toLowerCase() === "completed").length;
    return { total, pending, active, completed };
  }, [rows]);

  const lanes = React.useMemo(() => {
    const grouped: Record<string, AppointmentRow[]> = {};
    for (const room of ROOMS) grouped[room] = [];
    filteredRows.forEach((row, index) => grouped[ROOMS[index % ROOMS.length]].push(row));
    return grouped;
  }, [filteredRows]);

  const currentDateLabel = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
  }, [dayOffset]);

  return (
    <PageShell
      title="Clinic Calendar"
      subtitle="Modern scheduling board with color-coded treatment flow."
      actions={
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setDayOffset((prev) => prev - 1)}>
            <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={() => setDayOffset(0)}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setDayOffset((prev) => prev + 1)}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      }
    >
      <Text style={styles.dateTitle}>{currentDateLabel}</Text>

      <View style={styles.kpiRow}>
        <StatCard label="Total" value={stats.total} color={theme.colors.primary} theme={theme} />
        <StatCard label="Pending" value={stats.pending} color="#6366F1" theme={theme} />
        <StatCard label="In Consultation" value={stats.active} color="#0284C7" theme={theme} />
        <StatCard label="Completed" value={stats.completed} color="#16A34A" theme={theme} />
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((filterKey) => {
          const active = selectedStatus === filterKey;
          return (
            <TouchableOpacity
              key={filterKey}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedStatus(filterKey)}
            >
              <Text style={[styles.filterText, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
                {filterKey.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        {["pending", "in_consultation", "completed", "cancelled"].map((statusKey) => {
          const tone = statusPalette(statusKey, theme);
          return (
            <View key={statusKey} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: tone.bg, borderColor: tone.border }]} />
              <Text style={styles.legendText}>{statusKey.replace("_", " ")}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView horizontal contentContainerStyle={styles.boardWrap}>
        <View style={styles.timeRail}>
          <View style={styles.headSpacer} />
          {HOURS.map((hour) => (
            <View key={hour} style={styles.hourRow}>
              <Text style={styles.hourText}>{toHourLabel(hour)}</Text>
            </View>
          ))}
        </View>

        {ROOMS.map((room) => (
          <View key={room} style={styles.roomCol}>
            <View style={styles.roomHead}>
              <Text style={styles.roomTitle}>{room}</Text>
            </View>
            <View style={styles.gridBody}>
              {HOURS.map((hour) => (
                <View key={hour} style={styles.gridLine} />
              ))}
              <View style={styles.cardsLayer}>
                {(lanes[room] || []).slice(0, 6).map((appointment, index) => {
                  const tone = statusPalette(appointment.status, theme);
                  const patientName = `${appointment.patient_first_name || ""} ${appointment.patient_last_name || ""}`.trim() || "Unknown Patient";
                  return (
                    <TouchableOpacity
                      key={appointment.id}
                      style={[
                        styles.apptCard,
                        {
                          backgroundColor: tone.bg,
                          borderColor: tone.border,
                          top: 10 + index * 54,
                        },
                      ]}
                    >
                      <Text style={[styles.apptTitle, { color: tone.text }]} numberOfLines={1}>
                        {patientName}
                      </Text>
                      <Text style={styles.apptMeta} numberOfLines={1}>
                        {appointment.doctor_name ? `Dr. ${appointment.doctor_name}` : "Doctor TBD"}
                      </Text>
                      <Text style={styles.apptMeta} numberOfLines={1}>
                        {(appointment.type || "consultation").replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </PageShell>
  );
}

function StatCard({ label, value, color, theme }: { label: string; value: number; color: string; theme: any }) {
  return (
    <View style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface, padding: 10 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11 }}>{label}</Text>
      <Text style={{ marginTop: 4, color, fontWeight: "900", fontSize: 20 }}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    toolbar: { flexDirection: "row", gap: 8 },
    actionBtn: {
      height: 36,
      width: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    todayBtn: {
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    todayText: { color: theme.colors.text, fontWeight: "800", fontSize: 12 },
    dateTitle: { marginBottom: 10, color: theme.colors.text, fontWeight: "900", fontSize: 18 },
    kpiRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
    filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
    filterText: { fontWeight: "800", fontSize: 12, textTransform: "capitalize" },
    legendRow: { flexDirection: "row", gap: 14, marginBottom: 12, flexWrap: "wrap" },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 12, height: 12, borderRadius: 999, borderWidth: 1 },
    legendText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },

    boardWrap: {
      minWidth: 1040,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
    },
    timeRail: { width: 76, borderRightWidth: 1, borderRightColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant },
    headSpacer: { height: 42, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    hourRow: { height: 58, justifyContent: "center", paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    hourText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11 },

    roomCol: { width: 240, borderRightWidth: 1, borderRightColor: theme.colors.border },
    roomHead: { height: 42, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant },
    roomTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
    gridBody: { position: "relative" },
    gridLine: { height: 58, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    cardsLayer: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 8 },
    apptCard: {
      position: "absolute",
      left: 8,
      right: 8,
      minHeight: 50,
      borderRadius: 10,
      borderWidth: 1,
      padding: 8,
    },
    apptTitle: { fontWeight: "900", fontSize: 12 },
    apptMeta: { color: "#334155", fontWeight: "700", fontSize: 10, marginTop: 1 },
  });

