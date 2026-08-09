import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
const WEEK_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

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

function buildCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekDay = firstOfMonth.getDay();
  const gridStart = new Date(year, monthIndex, 1 - firstWeekDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      inMonth: date.getMonth() === monthIndex,
    };
  });
}

function formatToolbarDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

function formatTitleDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function statusPalette(status: string) {
  const key = String(status || "").toLowerCase();
  if (key === "completed") return { bg: "rgba(22,163,74,0.12)", border: "rgba(34,197,94,0.34)", text: "#166534" };
  if (key === "cancelled") return { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.28)", text: "#991B1B" };
  if (key === "in_consultation") return { bg: "rgba(56,189,248,0.14)", border: "rgba(14,165,233,0.34)", text: "#0C4A6E" };
  return { bg: "rgba(99,102,241,0.10)", border: "rgba(99,102,241,0.28)", text: "#3730A3" };
}

function statusLabel(value: string) {
  return String(value || "pending").replace(/_/g, " ");
}

function laneIcon(name: string): React.ComponentProps<typeof Ionicons>["name"] {
  if (name === "Room 1") return "medical-outline";
  if (name === "Room 2") return "fitness-outline";
  if (name === "Room 3") return "pulse-outline";
  return "layers-outline";
}

function CalendarPickerModal({
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
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [displayMonth, setDisplayMonth] = React.useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  React.useEffect(() => {
    if (visible) {
      setDisplayMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate, visible]);

  const days = React.useMemo(() => buildCalendarDays(displayMonth), [displayMonth]);
  const historyDates = React.useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - index);
        return startOfDay(date);
      }),
    [],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.dateModalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => {}}>
          <View style={styles.dateModalHeader}>
            <View>
              <Text style={[styles.dateModalTitle, { color: theme.colors.text }]}>Visit History Picker</Text>
              <Text style={[styles.dateModalSubtitle, { color: theme.colors.textSecondary }]}>
                Jump to any day and review older queues quickly.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.iconButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundAlt }]}>
              <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.historyChipWrap}>
            {historyDates.map((date) => {
              const active = sameDay(date, selectedDate);
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.historyChip,
                    {
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primarySoft : theme.colors.backgroundAlt,
                    },
                  ]}
                  onPress={() => {
                    onSelect(date);
                    onClose();
                  }}
                >
                  <Text style={[styles.historyChipDay, { color: active ? theme.colors.primary : theme.colors.text }]}>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                  <Text style={[styles.historyChipDate, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
                    {formatShortDate(date)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.calendarModalHeaderRow}>
            <Text style={[styles.calendarModalTitle, { color: theme.colors.text }]}>{formatMonthTitle(displayMonth)}</Text>
            <View style={styles.calendarNavRow}>
              <TouchableOpacity onPress={() => setDisplayMonth(new Date())}>
                <Text style={[styles.jumpTodayText, { color: theme.colors.primary }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                style={[styles.iconButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundAlt }]}
              >
                <Ionicons name="chevron-back" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                style={[styles.iconButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundAlt }]}
              >
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekHeader}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={[styles.weekDayText, { color: theme.colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map(({ date, inMonth }) => {
              const active = sameDay(date, selectedDate);
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  onPress={() => {
                    onSelect(date);
                    onClose();
                  }}
                  style={[
                    styles.dayCell,
                    !inMonth && styles.dayCellOutside,
                    active && { backgroundColor: theme.colors.primary, borderRadius: 12 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: inMonth ? theme.colors.text : theme.colors.textSecondary },
                      active && { color: theme.colors.textOnPrimary, fontWeight: "700" },
                    ]}
                  >
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

export default function CalendarPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [rows, setRows] = React.useState<AppointmentRow[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<StatusFilter>("all");
  const [selectedDate, setSelectedDate] = React.useState(startOfDay(new Date()));
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      try {
        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);
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
  }, [selectedDate, user?.id]);

  const filteredRows = React.useMemo(() => {
    const base =
      selectedStatus === "all"
        ? rows
        : rows.filter((x) => String(x.status || "").toLowerCase() === selectedStatus);
    return [...base].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [rows, selectedStatus]);

  const lanes = React.useMemo(() => {
    const grouped: Record<string, AppointmentRow[]> = {};
    for (const lane of LANES) grouped[lane] = [];
    filteredRows.forEach((row, index) => grouped[LANES[index % LANES.length]].push(row));
    return grouped;
  }, [filteredRows]);

  const stats = React.useMemo(
    () => ({
      total: rows.length,
      live: rows.filter((row) => String(row.status) === "in_consultation").length,
      done: rows.filter((row) => String(row.status) === "completed").length,
    }),
    [rows],
  );

  const overviewCards = React.useMemo(
    () => [
      { key: "scheduled", label: "Scheduled", value: stats.total, icon: "calendar-clear-outline" as const, tint: "#DBEAFE", iconColor: "#2563EB" },
      { key: "live", label: "In progress", value: stats.live, icon: "pulse-outline" as const, tint: "#DCFCE7", iconColor: "#16A34A" },
      { key: "done", label: "Completed", value: stats.done, icon: "checkmark-circle-outline" as const, tint: "#FEF3C7", iconColor: "#D97706" },
    ],
    [stats.done, stats.live, stats.total],
  );

  const shiftDay = (delta: number) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + delta);
      return startOfDay(next);
    });
  };

  return (
    <>
      <PageShell
        title="Clinic Calendar"
        actions={
          <View style={styles.toolbar}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]} onPress={() => shiftDay(-1)}>
              <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateHeroBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]} onPress={() => setPickerOpen(true)}>
              <Ionicons name="calendar-clear-outline" size={16} color={theme.colors.primary} />
              <View>
                <Text style={[styles.dateHeroTitle, { color: theme.colors.text }]}>{formatToolbarDate(selectedDate)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.todayBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]} onPress={() => setSelectedDate(startOfDay(new Date()))}>
              <Text style={[styles.todayText, { color: theme.colors.text }]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]} onPress={() => shiftDay(1)}>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        }
      >
        <View style={[styles.summaryCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryCopy}>
              <Text style={[styles.dateTitle, { color: theme.colors.text }]}>{formatTitleDate(selectedDate)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.summaryPickerBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => setPickerOpen(true)}
            >
              <Ionicons name="calendar-number-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.summaryPickerText, { color: theme.colors.primary }]}>Open calendar picker</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricRow}>
            {overviewCards.map((card) => (
              <View key={card.key} style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border }]}>
                <View style={styles.metricIconRow}>
                  <View style={[styles.metricIconWrap, { backgroundColor: card.tint }]}>
                    <Ionicons name={card.icon} size={24} color={card.iconColor} />
                  </View>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>{card.label}</Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>{card.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((key) => {
            const active = selectedStatus === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedStatus(key)}
              >
                <Text style={[styles.filterText, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
                  {statusLabel(key)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.boardCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.boardWrap}>
            <View style={[styles.slotRail, { borderRightColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={[styles.headSpacer, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.slotHeaderLabel, { color: theme.colors.textSecondary }]}>Queue</Text>
              </View>
              {Array.from({ length: SLOT_COUNT }).map((_, index) => (
                <View key={index} style={[styles.slotRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.slotText, { color: theme.colors.textSecondary }]}>Slot {index + 1}</Text>
                </View>
              ))}
            </View>

            {LANES.map((lane) => (
              <View key={lane} style={[styles.roomCol, { borderRightColor: theme.colors.border }]}>
                <View style={[styles.roomHead, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }]}>
                  <View style={styles.roomHeadInner}>
                    <View style={styles.roomHeadIcon}>
                      <Ionicons name={laneIcon(lane)} size={14} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.roomTitle, { color: theme.colors.text }]}>{lane}</Text>
                  </View>
                </View>
                <View style={styles.gridBody}>
                  {Array.from({ length: SLOT_COUNT }).map((_, index) => (
                    <View key={index} style={[styles.gridLine, { borderBottomColor: theme.colors.border }]} />
                  ))}
                  <View style={styles.cardsLayer}>
                    {(lanes[lane] || []).slice(0, SLOT_COUNT).map((row, index) => {
                      const tone = statusPalette(row.status);
                      const patient = `${row.patient_first_name || ""} ${row.patient_last_name || ""}`.trim() || "Unknown Patient";
                      return (
                        <View
                          key={row.id}
                          style={[
                            styles.apptCard,
                            {
                              backgroundColor: tone.bg,
                              borderColor: tone.border,
                              top: 8 + index * 56,
                            },
                          ]}
                        >
                          <Text style={[styles.apptTitle, { color: tone.text }]} numberOfLines={1}>
                            {patient}
                          </Text>
                          <Text style={[styles.apptMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {statusLabel(row.type || "consultation")} • {statusLabel(row.status || "pending")}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </PageShell>

      <CalendarPickerModal
        visible={pickerOpen}
        selectedDate={selectedDate}
        onClose={() => setPickerOpen(false)}
        onSelect={(date) => setSelectedDate(startOfDay(date))}
      />
    </>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    actionBtn: {
      height: 40,
      width: 40,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    todayBtn: {
      height: 40,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    todayText: {
      fontWeight: "600",
      fontSize: 12,
    },
    dateHeroBtn: {
      minHeight: 40,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minWidth: 240,
    },
    dateHeroTitle: {
      fontWeight: "700",
      fontSize: 13,
      textTransform: "capitalize",
    },
    summaryCard: {
      borderWidth: 1,
      borderRadius: 22,
      padding: 16,
      gap: 14,
      marginBottom: 12,
    },
    summaryTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    summaryCopy: {
      flex: 1,
      minWidth: 280,
    },
    dateTitle: {
      fontWeight: "700",
      fontSize: 22,
    },
    summaryPickerBtn: {
      minHeight: 42,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    summaryPickerText: {
      fontWeight: "700",
      fontSize: 12,
    },
    metricRow: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
    },
    metricCard: {
      minWidth: 150,
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    metricIconRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
    },
    metricIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    metricValue: {
      fontWeight: "700",
      fontSize: 22,
    },
    metricLabel: {
      fontWeight: "700",
      fontSize: 12,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
    },
    filterText: {
      fontWeight: "600",
      fontSize: 12,
      textTransform: "capitalize",
    },
    boardCard: {
      borderWidth: 1,
      borderRadius: 18,
      overflow: "hidden",
    },
    boardWrap: {
      width: "100%",
      flexDirection: "row",
      alignItems: "stretch",
    },
    slotRail: {
      width: 92,
      borderRightWidth: 1,
    },
    headSpacer: {
      height: 48,
      borderBottomWidth: 1,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    slotHeaderLabel: {
      fontWeight: "600",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    slotRow: {
      height: 58,
      justifyContent: "center",
      paddingHorizontal: 10,
      borderBottomWidth: 1,
    },
    slotText: {
      fontWeight: "700",
      fontSize: 11,
    },
    roomCol: {
      flex: 1,
      minWidth: 0,
      borderRightWidth: 1,
    },
    roomHead: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderBottomWidth: 1,
    },
    roomHeadInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    roomHeadIcon: {
      width: 24,
      height: 24,
      borderRadius: 999,
      backgroundColor: "rgba(37,99,235,0.10)",
      alignItems: "center",
      justifyContent: "center",
    },
    roomTitle: {
      fontWeight: "700",
      fontSize: 12,
    },
    gridBody: {
      position: "relative",
    },
    gridLine: {
      height: 58,
      borderBottomWidth: 1,
    },
    cardsLayer: {
      ...StyleSheet.absoluteFillObject,
      paddingHorizontal: 8,
    },
    apptCard: {
      position: "absolute",
      left: 8,
      right: 8,
      minHeight: 50,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      justifyContent: "center",
    },
    apptTitle: {
      fontWeight: "700",
      fontSize: 12,
    },
    apptMeta: {
      fontWeight: "700",
      fontSize: 10,
      marginTop: 2,
      textTransform: "capitalize",
    },
    modalBackdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },
    dateModalCard: {
      width: "100%",
      maxWidth: 760,
      borderRadius: 22,
      borderWidth: 1,
      padding: 18,
    },
    dateModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "flex-start",
    },
    dateModalTitle: {
      fontWeight: "700",
      fontSize: 20,
    },
    dateModalSubtitle: {
      marginTop: 4,
      fontWeight: "700",
      fontSize: 13,
      lineHeight: 18,
    },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    historyChipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 16,
      marginBottom: 18,
    },
    historyChip: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      minWidth: 88,
    },
    historyChipDay: {
      fontWeight: "700",
      fontSize: 12,
    },
    historyChipDate: {
      marginTop: 2,
      fontWeight: "700",
      fontSize: 11,
    },
    calendarModalHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 12,
    },
    calendarModalTitle: {
      fontWeight: "700",
      fontSize: 18,
    },
    calendarNavRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    jumpTodayText: {
      fontWeight: "600",
      fontSize: 13,
    },
    weekHeader: {
      flexDirection: "row",
      marginBottom: 8,
    },
    weekDayText: {
      flex: 1,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "700",
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: `${100 / 7}%`,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },
    dayCellOutside: {
      opacity: 0.35,
    },
    dayText: {
      fontSize: 15,
      fontWeight: "700",
    },
  });
