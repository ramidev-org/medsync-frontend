import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DatePickerFieldProps = {
  label: string;
  date: Date;
  setDate: (date: Date) => void;
};

type DateRangePickerFieldProps = {
  label?: string;
  startDate: Date;
  endDate: Date;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  onClear?: () => void;
};

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

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateChip(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
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

function presetRange(days: number) {
  const today = startOfDay(new Date());
  const end = new Date(today);
  end.setDate(today.getDate() + days);
  return { start: today, end: endOfDay(end) };
}

const RANGE_PRESETS = [
  { key: "today", label: "Today", getValue: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { key: "tomorrow", label: "Tomorrow", getValue: () => {
    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 1);
    return { start, end: endOfDay(start) };
  } },
  { key: "this_week", label: "This week", getValue: () => presetRange(6) },
  { key: "two_weeks", label: "2 weeks", getValue: () => presetRange(13) },
  { key: "four_weeks", label: "4 weeks", getValue: () => presetRange(27) },
];

export default function DatePickerField({ label, date, setDate }: DatePickerFieldProps) {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dateInputWrapper,
          { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
        ]}
        onPress={() => inputRef.current?.showPicker()}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
        <Text style={[styles.dateText, { color: theme.colors.text }]}>{formatDate(date)}</Text>
      </TouchableOpacity>

      <input
        ref={inputRef}
        type="date"
        value={startOfDay(date).toISOString().split("T")[0]}
        onChange={(e) => setDate(new Date(e.target.value))}
        onWheel={(e) => e.currentTarget.blur()}
        style={styles.hiddenInput}
      />
    </View>
  );
}

export function DateRangePickerField({
  label = "Période",
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onClear,
}: DateRangePickerFieldProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startOfDay(startDate));
  const [draftEnd, setDraftEnd] = useState(endOfDay(endDate));
  const [displayMonth, setDisplayMonth] = useState(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
  const [selectionStep, setSelectionStep] = useState<"start" | "end">("start");

  useEffect(() => {
    if (!open) {
      setDraftStart(startOfDay(startDate));
      setDraftEnd(endOfDay(endDate));
      setDisplayMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
      setSelectionStep("start");
    }
  }, [startDate, endDate, open]);

  const days = useMemo(() => buildCalendarDays(displayMonth), [displayMonth]);

  const selectDay = (date: Date) => {
    const normalized = startOfDay(date);
    if (selectionStep === "start") {
      setDraftStart(normalized);
      if (normalized.getTime() > startOfDay(draftEnd).getTime()) {
        setDraftEnd(endOfDay(normalized));
      }
      setSelectionStep("end");
      return;
    }

    if (normalized.getTime() < draftStart.getTime()) {
      setDraftStart(normalized);
      setDraftEnd(endOfDay(draftStart));
    } else {
      setDraftEnd(endOfDay(normalized));
    }
    setSelectionStep("start");
  };

  const applyPreset = (start: Date, end: Date) => {
    setDraftStart(startOfDay(start));
    setDraftEnd(endOfDay(end));
    setDisplayMonth(new Date(start.getFullYear(), start.getMonth(), 1));
    setSelectionStep("start");
  };

  const applyRange = () => {
    setStartDate(startOfDay(draftStart));
    setEndDate(endOfDay(draftEnd));
    setOpen(false);
  };

  return (
    <>
      <View style={styles.rangeFieldWrap}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.rangeTrigger,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => setOpen(true)}
        >
          <Ionicons name="calendar-clear-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.rangeTriggerText, { color: theme.colors.text }]}>
            {`${formatDate(startDate)} - ${formatDate(endDate)}`}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]} onPress={() => setOpen(false)}>
          <Pressable
            onPress={() => {}}
            style={[styles.rangeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <View style={[styles.topChipsRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={[styles.topChip, styles.topChipActive, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                <Ionicons name="calendar-outline" size={15} color={theme.colors.textSecondary} />
                <Text style={[styles.topChipText, { color: theme.colors.text }]}>{formatDateChip(draftStart)}</Text>
              </View>
              <View style={[styles.topChipDivider, { backgroundColor: theme.colors.border }]} />
              <View style={[styles.topChip, styles.topChipActive, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                <Ionicons name="calendar-outline" size={15} color={theme.colors.textSecondary} />
                <Text style={[styles.topChipText, { color: theme.colors.text }]}>{formatDateChip(draftEnd)}</Text>
              </View>
            </View>

            <View style={styles.rangeBody}>
              <View style={[styles.presetsColumn, { borderRightColor: theme.colors.border }]}>
                {RANGE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.key}
                    style={styles.presetBtn}
                    onPress={() => {
                      const value = preset.getValue();
                      applyPreset(value.start, value.end);
                    }}
                  >
                    <Text style={[styles.presetText, { color: theme.colors.text }]}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.calendarColumn}>
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarTitle, { color: theme.colors.text }]}>{formatMonthTitle(displayMonth)}</Text>

                  <View style={styles.calendarHeaderRight}>
                    <TouchableOpacity onPress={() => setDisplayMonth(new Date())}>
                      <Text style={[styles.todayText, { color: theme.colors.text }]}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                      style={styles.navBtn}
                    >
                      <Ionicons name="chevron-back" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                      style={styles.navBtn}
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
                    const isStart = sameDay(date, draftStart);
                    const isEnd = sameDay(date, draftEnd);
                    const currentTime = startOfDay(date).getTime();
                    const inRange = currentTime >= draftStart.getTime() && currentTime <= startOfDay(draftEnd).getTime();

                    return (
                      <TouchableOpacity
                        key={date.toISOString()}
                        onPress={() => selectDay(date)}
                        style={[
                          styles.dayCell,
                          !inMonth && styles.dayCellOutside,
                          inRange && { backgroundColor: theme.colors.primarySoft },
                          (isStart || isEnd) && { backgroundColor: theme.colors.primary, borderRadius: 10 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: inMonth ? theme.colors.text : theme.colors.textSecondary },
                            inRange && { color: theme.colors.primary },
                            (isStart || isEnd) && { color: theme.colors.textOnPrimary, fontWeight: "600" },
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={[styles.rangeFooter, { backgroundColor: theme.colors.surfaceVariant }]}>
              {onClear ? (
                <TouchableOpacity
                  style={[styles.footerGhostBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                  onPress={() => {
                    onClear();
                    setDraftStart(startOfDay(new Date()));
                    setDraftEnd(endOfDay(new Date()));
                    setDisplayMonth(new Date());
                    setSelectionStep("start");
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.footerGhostBtnText, { color: theme.colors.textSecondary }]}>Clear</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.footerGhostBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                onPress={() => setOpen(false)}
              >
                <Text style={[styles.footerGhostBtnText, { color: theme.colors.textSecondary }]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerBtn, { backgroundColor: theme.colors.primary }]} onPress={applyRange}>
                <Text style={styles.footerBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 42,
  },
  dateText: {
    flex: 1,
    fontWeight: "700",
  },
  rangeFieldWrap: {
    minWidth: 260,
    flex: 1,
  },
  rangeTrigger: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rangeTriggerText: {
    flex: 1,
    fontWeight: "700",
    fontSize: 13,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  rangeCard: {
    width: "100%",
    maxWidth: 760,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  topChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  topChip: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topChipActive: {
    minWidth: 120,
  },
  topChipText: {
    fontWeight: "600",
  },
  topChipDivider: {
    width: 1,
    alignSelf: "stretch",
  },
  rangeBody: {
    flexDirection: "row",
    minHeight: 350,
  },
  presetsColumn: {
    width: 190,
    borderRightWidth: 1,
    paddingVertical: 12,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  presetText: {
    fontSize: 14,
    fontWeight: "500",
  },
  calendarColumn: {
    flex: 1,
    padding: 18,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  calendarHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  todayText: {
    fontSize: 14,
    fontWeight: "700",
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  dayCellOutside: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
  },
  rangeFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerGhostBtn: {
    minWidth: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  footerGhostBtnText: {
    fontWeight: "600",
  },
  footerBtn: {
    minWidth: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  footerBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
