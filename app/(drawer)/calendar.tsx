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
type RpcGetAppointmentsResponse = { appointments: AppointmentRow[] };
const STATUS_FILTERS = ["all", "pending", "in_consultation", "completed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const LANES = ["Room 1", "Room 2", "Room 3", "Overflow"];
const SLOT_COUNT = 12;

function statusPalette(status: string, theme: any) {
  const key = String(status || "").toLowerCase();
  if (key === "completed") return { bg: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.36)", text: "#166534" };
  if (key === "cancelled") return { bg: "rgba(220,38,38,0.11)", border: "rgba(220,38,38,0.28)", text: "#991B1B" };
  if (key === "in_consultation") return { bg: "rgba(2,132,199,0.13)", border: "rgba(2,132,199,0.34)", text: "#0C4A6E" };
  return { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.32)", text: "#3730A3" };
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
    const base = selectedStatus === "all" ? rows : rows.filter((x) => String(x.status || "").toLowerCase() === selectedStatus);
    return [...base].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [rows, selectedStatus]);

  const lanes = React.useMemo(() => {
    const grouped: Record<string, AppointmentRow[]> = {};
    for (const lane of LANES) grouped[lane] = [];
    filteredRows.forEach((row, index) => grouped[LANES[index % LANES.length]].push(row));
    return grouped;
  }, [filteredRows]);

  const dateLabel = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(d);
  }, [dayOffset]);

  return (
    <PageShell
      title="Clinic Calendar"
      subtitle="Slot board ordered by first-come queue."
      actions={
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setDayOffset((v) => v - 1)}><Ionicons name="chevron-back" size={16} color={theme.colors.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={() => setDayOffset(0)}><Text style={styles.todayText}>Today</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setDayOffset((v) => v + 1)}><Ionicons name="chevron-forward" size={16} color={theme.colors.text} /></TouchableOpacity>
        </View>
      }
    >
      <Text style={styles.dateTitle}>{dateLabel}</Text>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((k) => {
          const active = selectedStatus === k;
          return (
            <TouchableOpacity key={k} style={[styles.filterChip, { backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.border }]} onPress={() => setSelectedStatus(k)}>
              <Text style={[styles.filterText, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>{k.replace("_", " ")}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView horizontal contentContainerStyle={styles.boardWrap}>
        <View style={styles.slotRail}>
          <View style={styles.headSpacer} />
          {Array.from({ length: SLOT_COUNT }).map((_, idx) => (
            <View key={idx} style={styles.slotRow}>
              <Text style={styles.slotText}>Slot {idx + 1}</Text>
            </View>
          ))}
        </View>

        {LANES.map((lane) => (
          <View key={lane} style={styles.roomCol}>
            <View style={styles.roomHead}>
              <Text style={styles.roomTitle}>{lane}</Text>
            </View>
            <View style={styles.gridBody}>
              {Array.from({ length: SLOT_COUNT }).map((_, idx) => (
                <View key={idx} style={styles.gridLine} />
              ))}
              <View style={styles.cardsLayer}>
                {(lanes[lane] || []).slice(0, SLOT_COUNT).map((row, idx) => {
                  const tone = statusPalette(row.status, theme);
                  const patient = `${row.patient_first_name || ""} ${row.patient_last_name || ""}`.trim() || "Unknown Patient";
                  return (
                    <View key={row.id} style={[styles.apptCard, { backgroundColor: tone.bg, borderColor: tone.border, top: 8 + idx * 56 }]}>
                      <Text style={[styles.apptTitle, { color: tone.text }]} numberOfLines={1}>{patient}</Text>
                      <Text style={styles.apptMeta} numberOfLines={1}>{(row.type || "consultation").replace("_", " ")} • {String(row.status || "pending").replace("_", " ")}</Text>
                    </View>
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

const createStyles = (theme: any) =>
  StyleSheet.create({
    toolbar: { flexDirection: "row", gap: 8 },
    actionBtn: { height: 36, width: 36, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface },
    todayBtn: { height: 36, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface },
    todayText: { color: theme.colors.text, fontWeight: "800", fontSize: 12 },
    dateTitle: { marginBottom: 10, color: theme.colors.text, fontWeight: "900", fontSize: 18 },
    filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 },
    filterChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
    filterText: { fontWeight: "800", fontSize: 12, textTransform: "capitalize" },
    boardWrap: { minWidth: 1040, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, overflow: "hidden", backgroundColor: theme.colors.surface },
    slotRail: { width: 90, borderRightWidth: 1, borderRightColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant },
    headSpacer: { height: 42, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    slotRow: { height: 58, justifyContent: "center", paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    slotText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11 },
    roomCol: { width: 240, borderRightWidth: 1, borderRightColor: theme.colors.border },
    roomHead: { height: 42, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant },
    roomTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
    gridBody: { position: "relative" },
    gridLine: { height: 58, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    cardsLayer: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 8 },
    apptCard: { position: "absolute", left: 8, right: 8, minHeight: 50, borderRadius: 10, borderWidth: 1, padding: 8 },
    apptTitle: { fontWeight: "900", fontSize: 12 },
    apptMeta: { color: "#334155", fontWeight: "700", fontSize: 10, marginTop: 1 },
  });

