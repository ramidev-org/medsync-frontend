import { PageShell } from "@/components/layout/page_shell";
import { Avatar } from "@/components/common/patient_avatar";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

type AppointmentRow = {
  id: string;
  scheduled_at: string;
  status: string;
  type: string;
  doctor_id?: string | null;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  doctor_name?: string | null;
};

type RpcGetAppointmentsResponse = { appointments: AppointmentRow[] };

type StatusFilter = "all" | "scheduled" | "pending" | "in_consultation" | "completed" | "cancelled";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "pending", label: "Pending" },
  { key: "in_consultation", label: "In Consultation" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const ROOMS = ["Room 1", "Room 2", "Room 3", "Overflow"];
const ROOM_ICONS: React.ComponentProps<typeof Ionicons>["name"][] = [
  "flower-outline",
  "heart-outline",
  "pulse-outline",
  "layers-outline",
];
const START_HOUR = 8;
const END_HOUR = 18;
const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 54;
const TIME_WIDTH = 76;
const ROOM_WIDTH = 246;
const BOARD_WIDTH = TIME_WIDTH + ROOM_WIDTH * ROOMS.length;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function sameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatLongDate(date: Date) {
  const value = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function patientName(row: AppointmentRow) {
  return `${row.patient_first_name ?? ""} ${row.patient_last_name ?? ""}`.trim() || "Unknown Patient";
}

function normalizedStatus(status: string) {
  const value = String(status || "pending").toLowerCase();
  return value === "confirmed" ? "scheduled" : value;
}

function statusLabel(status: string) {
  const key = normalizedStatus(status);
  if (key === "in_consultation") return "In Consultation";
  if (key === "no_show") return "No Show";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function statusPalette(status: string) {
  const key = normalizedStatus(status);
  if (key === "pending") return { accent: "#F59E0B", bg: "#FFF8EA", text: "#B76600" };
  if (key === "in_consultation") return { accent: "#7C3AED", bg: "#F5F0FF", text: "#6D28D9" };
  if (key === "completed") return { accent: "#20B486", bg: "#ECFBF5", text: "#087D5C" };
  if (key === "cancelled") return { accent: "#F0445E", bg: "#FFF0F2", text: "#C72D45" };
  if (key === "no_show") return { accent: "#8585A3", bg: "#F3F3F8", text: "#62627A" };
  return { accent: "#2F73F6", bg: "#EEF5FF", text: "#1D5FD1" };
}

function stableRoomIndex(row: AppointmentRow) {
  const seed = String(row.doctor_id || row.doctor_name || row.id);
  const total = seed.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return total % ROOMS.length;
}

function matchesFilter(row: AppointmentRow, filter: StatusFilter) {
  return filter === "all" || normalizedStatus(row.status) === filter;
}

function CalendarPicker({
  visible,
  selectedDate,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}) {
  const { theme } = useTheme();
  const [month, setMonth] = React.useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  React.useEffect(() => {
    if (visible) setMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate, visible]);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.pickerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => {}}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity style={[styles.smallIconButton, { borderColor: theme.colors.border }]} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
              <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
            <TouchableOpacity style={[styles.smallIconButton, { borderColor: theme.colors.border }]} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.weekRow}>
            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => (
              <Text key={day} style={[styles.weekLabel, { color: theme.colors.textSecondary }]}>{day}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {days.map((date) => {
              const active = sameDay(date, selectedDate);
              const inMonth = date.getMonth() === month.getMonth();
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[styles.dayCell, active && { backgroundColor: theme.colors.primary }]}
                  onPress={() => {
                    onSelect(startOfDay(date));
                    onClose();
                  }}
                >
                  <Text style={[styles.dayText, { color: inMonth ? theme.colors.text : theme.colors.textSecondary }, active && { color: theme.colors.textOnPrimary }]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Metric({
  icon,
  value,
  label,
  color,
  tint,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: number;
  label: string;
  color: string;
  tint: string;
  last?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.metric, !last && { borderRightColor: theme.colors.border, borderRightWidth: 1 }]}>
      <View style={[styles.metricIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View>
        <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.metricLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.metricCaption, { color: theme.colors.textSecondary }]}>Appointments</Text>
      </View>
    </View>
  );
}

export default function CalendarPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [rows, setRows] = React.useState<AppointmentRow[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<StatusFilter>("all");
  const [selectedDate, setSelectedDate] = React.useState(startOfDay(new Date()));
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError("");
      try {
        const response = await callRpc<RpcGetAppointmentsResponse, Record<string, unknown>>(
          "rpc_get_appointments",
          {
            p_requester_id: user.id,
            p_search: null,
            p_status: null,
            p_doctor_id: null,
            p_start_date: startOfDay(selectedDate).toISOString(),
            p_end_date: endOfDay(selectedDate).toISOString(),
            p_page: 1,
            p_items_per_page: 180,
          },
        );
        if (!cancelled) setRows(response?.appointments ?? []);
      } catch (requestError) {
        if (!cancelled) {
          setRows([]);
          setError(requestError instanceof Error ? requestError.message : "Unable to load appointments.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, user?.id]);

  const filteredRows = React.useMemo(
    () => rows.filter((row) => matchesFilter(row, selectedStatus)),
    [rows, selectedStatus],
  );

  const visibleRows = React.useMemo(
    () =>
      filteredRows.filter((row) => {
        const hour = new Date(row.scheduled_at).getHours();
        return hour >= START_HOUR && hour < END_HOUR;
      }),
    [filteredRows],
  );

  const stats = React.useMemo(() => {
    const completed = rows.filter((row) => normalizedStatus(row.status) === "completed").length;
    return {
      scheduled: rows.filter((row) => !["completed", "cancelled"].includes(normalizedStatus(row.status))).length,
      progress: rows.filter((row) => normalizedStatus(row.status) === "in_consultation").length,
      completed,
      percent: rows.length ? Math.round((completed / rows.length) * 100) : 0,
    };
  }, [rows]);

  const waitingRows = React.useMemo(
    () =>
      rows
        .filter((row) => ["pending", "in_consultation"].includes(normalizedStatus(row.status)))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 4),
    [rows],
  );

  const shiftDay = (days: number) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + days);
      return startOfDay(next);
    });
  };

  const sideBySide = width >= 1180;

  return (
    <>
      <PageShell
        title="Clinic Calendar"
        subtitle="Manage appointments and room schedule."
        actions={
          <View style={styles.toolbar}>
            <TouchableOpacity style={[styles.navButton, { borderColor: theme.colors.border }]} onPress={() => shiftDay(-1)}>
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={[styles.dateButton, { borderColor: theme.colors.border }]}>
              <TouchableOpacity style={styles.datePickerTarget} onPress={() => setPickerOpen(true)}>
                <Ionicons name="calendar-clear-outline" size={20} color={theme.colors.text} />
                <Text style={[styles.dateButtonText, { color: theme.colors.text }]} numberOfLines={1}>{formatLongDate(selectedDate)}</Text>
              </TouchableOpacity>
              <View style={[styles.dateDivider, { backgroundColor: theme.colors.border }]} />
              <TouchableOpacity style={styles.nextDayTarget} onPress={() => shiftDay(1)}>
                <Ionicons name="chevron-forward" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.todayButton, { borderColor: theme.colors.border }]} onPress={() => setSelectedDate(startOfDay(new Date()))}>
              <Text style={[styles.todayButtonText, { color: theme.colors.text }]}>Today</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsScroll}>
          <View style={[styles.metricsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Metric icon="calendar-clear-outline" value={stats.scheduled} label="Scheduled" color="#2F73F6" tint="#EEF4FF" />
            <Metric icon="time-outline" value={stats.progress} label="In progress" color="#7C3AED" tint="#F4EEFF" />
            <Metric icon="checkmark-circle-outline" value={stats.completed} label="Completed" color="#1BAE7A" tint="#EAF9F3" last />
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((filter) => {
            const active = selectedStatus === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedStatus(filter.key)}
              >
                <Text style={[styles.filterText, { color: active ? theme.colors.textOnPrimary : theme.colors.text }]}>{filter.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.mainRow, !sideBySide && styles.mainRowStacked]}>
          <View style={styles.boardRegion}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={[styles.board, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <View style={[styles.timeColumn, { borderRightColor: theme.colors.border }]}>
                  <View style={[styles.timeHeader, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.timeHeaderText, { color: theme.colors.textSecondary }]}>TIME</Text>
                  </View>
                  {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => {
                    const hour = START_HOUR + index;
                    return (
                      <View key={hour} style={[styles.timeSlot, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[styles.timeMain, { color: theme.colors.text }]}>{hour > 12 ? hour - 12 : hour}:00</Text>
                        <Text style={[styles.timePeriod, { color: theme.colors.textSecondary }]}>{hour >= 12 ? "PM" : "AM"}</Text>
                      </View>
                    );
                  })}
                </View>

                {ROOMS.map((room, roomIndex) => (
                  <View key={room} style={[styles.roomColumn, { borderRightColor: theme.colors.border }]}>
                    <View style={[styles.roomHeader, { borderBottomColor: theme.colors.border }]}>
                      <Ionicons name={ROOM_ICONS[roomIndex]} size={20} color={theme.colors.primary} />
                      <Text style={[styles.roomName, { color: theme.colors.text }]}>{room}</Text>
                    </View>
                    <View style={styles.roomBody}>
                      {Array.from({ length: END_HOUR - START_HOUR }, (_, index) => (
                        <View key={index} style={[styles.gridSlot, { borderBottomColor: theme.colors.border }]} />
                      ))}
                      {visibleRows
                        .filter((row) => stableRoomIndex(row) === roomIndex)
                        .map((row) => {
                          const date = new Date(row.scheduled_at);
                          const minutesFromStart = (date.getHours() - START_HOUR) * 60 + date.getMinutes();
                          const top = (minutesFromStart / 60) * ROW_HEIGHT + 7;
                          const tone = statusPalette(row.status);
                          return (
                            <View key={row.id} style={[styles.appointmentCard, { top, backgroundColor: tone.bg, borderLeftColor: tone.accent }]}>
                              <Text style={[styles.appointmentName, { color: theme.colors.text }]} numberOfLines={1}>{patientName(row)}</Text>
                              <Text style={[styles.appointmentTime, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                {formatTime(date)} - {formatTime(addMinutes(date, 30))}
                              </Text>
                              <View style={styles.appointmentStatusRow}>
                                <View style={[styles.statusDot, { backgroundColor: tone.accent }]} />
                                <Text style={[styles.appointmentStatus, { color: tone.text }]} numberOfLines={1}>{statusLabel(row.status)}</Text>
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  </View>
                ))}

                {loading ? (
                  <View style={styles.boardLoading}>
                    <ActivityIndicator color={theme.colors.primary} />
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.legend, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              {["scheduled", "pending", "in_consultation", "completed", "cancelled", "no_show"].map((status) => {
                const tone = statusPalette(status);
                return (
                  <View key={status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: tone.accent }]} />
                    <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>{statusLabel(status)}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <View style={[styles.overviewCard, !sideBySide && styles.overviewCardStacked, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.overviewTitle, { color: theme.colors.text }]}>Today Overview</Text>
            <View style={styles.progressRow}>
              <View style={[styles.progressRing, { borderColor: stats.percent ? theme.colors.primary : theme.colors.border }]}>
                <Ionicons name="calendar-clear-outline" size={21} color={theme.colors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.progressValue, { color: theme.colors.primary }]}>{stats.percent}%</Text>
                <Text style={[styles.progressCount, { color: theme.colors.text }]}>{stats.completed} / {rows.length}</Text>
                <Text style={[styles.progressCaption, { color: theme.colors.textSecondary }]}>appointments completed</Text>
              </View>
            </View>

            <View style={[styles.overviewDivider, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.waitingTitle, { color: theme.colors.text }]}>Waiting List</Text>
            <Text style={[styles.waitingSubtitle, { color: theme.colors.textSecondary }]}>Patients waiting or in consultation</Text>

            <View style={styles.waitingList}>
              {waitingRows.length ? waitingRows.map((row) => {
                const date = new Date(row.scheduled_at);
                const tone = statusPalette(row.status);
                return (
                  <View key={row.id} style={[styles.waitingItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Avatar firstName={row.patient_first_name} lastName={row.patient_last_name} size={40} />
                    <View style={styles.waitingCopy}>
                      <Text style={[styles.waitingName, { color: theme.colors.text }]} numberOfLines={1}>{patientName(row)}</Text>
                      <Text style={[styles.waitingTime, { color: theme.colors.textSecondary }]}>{formatTime(date)}</Text>
                      <View style={styles.waitingStatusRow}>
                        <View style={[styles.statusDot, { backgroundColor: tone.accent }]} />
                        <Text style={[styles.waitingStatus, { color: tone.text }]}>{statusLabel(row.status)}</Text>
                      </View>
                    </View>
                  </View>
                );
              }) : (
                <View style={styles.emptyWaiting}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.success} />
                  <Text style={[styles.emptyWaitingText, { color: theme.colors.textSecondary }]}>No patients waiting</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </PageShell>

      <CalendarPicker
        visible={pickerOpen}
        selectedDate={selectedDate}
        onClose={() => setPickerOpen(false)}
        onSelect={setSelectedDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  navButton: { width: 52, height: 48, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dateButton: { minWidth: 360, maxWidth: 540, height: 48, borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", paddingLeft: 18 },
  datePickerTarget: { flex: 1, minWidth: 0, height: "100%", flexDirection: "row", alignItems: "center", gap: 14 },
  dateButtonText: { flex: 1, fontSize: 14, fontWeight: "700", textAlign: "center" },
  dateDivider: { width: 1, height: 28 },
  nextDayTarget: { width: 52, height: "100%", alignItems: "center", justifyContent: "center" },
  todayButton: { height: 48, minWidth: 92, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  todayButtonText: { fontSize: 14, fontWeight: "700" },
  metricsScroll: { minWidth: "100%", paddingBottom: 16 },
  metricsCard: { minWidth: 650, flex: 1, borderWidth: 1, borderRadius: 16, flexDirection: "row", overflow: "hidden" },
  metric: { flex: 1, minWidth: 190, minHeight: 106, flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 26, paddingVertical: 18 },
  metricIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 25, fontWeight: "700", lineHeight: 28 },
  metricLabel: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  metricCaption: { fontSize: 12, fontWeight: "500", marginTop: 3 },
  filters: { gap: 8, paddingBottom: 14 },
  filterButton: { minHeight: 38, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  filterText: { fontSize: 12, fontWeight: "700" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF3F2", borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: "#B42318", fontSize: 12, fontWeight: "600" },
  mainRow: { flexDirection: "row", alignItems: "flex-start", gap: 18 },
  mainRowStacked: { flexDirection: "column" },
  boardRegion: { flex: 1, minWidth: 0, width: "100%" },
  board: { width: BOARD_WIDTH, height: HEADER_HEIGHT + (END_HOUR - START_HOUR) * ROW_HEIGHT, borderWidth: 1, borderRadius: 14, overflow: "hidden", flexDirection: "row" },
  timeColumn: { width: TIME_WIDTH, borderRightWidth: 1 },
  timeHeader: { height: HEADER_HEIGHT, borderBottomWidth: 1, alignItems: "center", justifyContent: "center" },
  timeHeaderText: { fontSize: 10, fontWeight: "700" },
  timeSlot: { height: ROW_HEIGHT, borderBottomWidth: 1, alignItems: "center", justifyContent: "flex-start", paddingTop: 10 },
  timeMain: { fontSize: 11, fontWeight: "700" },
  timePeriod: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  roomColumn: { width: ROOM_WIDTH, borderRightWidth: 1 },
  roomHeader: { height: HEADER_HEIGHT, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  roomName: { fontSize: 12, fontWeight: "700" },
  roomBody: { height: (END_HOUR - START_HOUR) * ROW_HEIGHT, position: "relative" },
  gridSlot: { height: ROW_HEIGHT, borderBottomWidth: 1, borderStyle: "dashed" },
  appointmentCard: { position: "absolute", left: 10, right: 10, height: 62, borderLeftWidth: 3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  appointmentName: { fontSize: 11, fontWeight: "700" },
  appointmentTime: { fontSize: 10, fontWeight: "600", marginTop: 3 },
  appointmentStatusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  appointmentStatus: { fontSize: 9, fontWeight: "700" },
  boardLoading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.65)" },
  legend: { minWidth: BOARD_WIDTH, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, flexDirection: "row", alignItems: "center", gap: 22, paddingHorizontal: 18, paddingVertical: 13 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: "600" },
  overviewCard: { width: 272, minHeight: 620, borderWidth: 1, borderRadius: 14, padding: 20 },
  overviewCardStacked: { width: "100%", minHeight: 0 },
  overviewTitle: { fontSize: 16, fontWeight: "700" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 18, paddingVertical: 24 },
  progressRing: { width: 70, height: 70, borderRadius: 35, borderWidth: 7, alignItems: "center", justifyContent: "center" },
  progressValue: { fontSize: 24, fontWeight: "700" },
  progressCount: { fontSize: 12, fontWeight: "700", marginTop: 3 },
  progressCaption: { fontSize: 10, fontWeight: "500", marginTop: 3 },
  overviewDivider: { height: 1, marginBottom: 22 },
  waitingTitle: { fontSize: 13, fontWeight: "700" },
  waitingSubtitle: { fontSize: 10, fontWeight: "500", marginTop: 5, marginBottom: 14 },
  waitingList: { gap: 10 },
  waitingItem: { borderRadius: 12, padding: 11, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  waitingCopy: { flex: 1, minWidth: 0 },
  waitingName: { fontSize: 11, fontWeight: "700" },
  waitingTime: { fontSize: 10, fontWeight: "600", marginTop: 3 },
  waitingStatusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  waitingStatus: { fontSize: 9, fontWeight: "700" },
  emptyWaiting: { alignItems: "center", gap: 8, paddingVertical: 28 },
  emptyWaitingText: { fontSize: 11, fontWeight: "600" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  pickerCard: { width: "100%", maxWidth: 460, borderWidth: 1, borderRadius: 18, padding: 18 },
  pickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  pickerTitle: { fontSize: 17, fontWeight: "700" },
  smallIconButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekLabel: { width: `${100 / 7}%`, textAlign: "center", fontSize: 10, fontWeight: "700" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: `${100 / 7}%`, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  dayText: { fontSize: 13, fontWeight: "700" },
});
