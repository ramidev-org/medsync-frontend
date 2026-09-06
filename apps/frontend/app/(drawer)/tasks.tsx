import { PageShell } from "@/components/layout/page_shell";
import { TaskPriority, TaskRow, TaskStatus, useTasks } from "@/contexts/tasks_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type TaskForm = {
  title: string;
  assignee: string;
  dueText: string;
  priority: TaskPriority;
};

type ViewMode = "kanban" | "list";
type DueFilter = "all" | "with_due" | "no_due";

// Distinct per-status brand colors - meaningfully different states, kept as
// data-driven constants rather than theme tokens (the theme has no
// "in progress" color).
const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "To Do", color: "#F59E0B" },
  in_progress: { label: "In Progress", color: "#2563EB" },
  done: { label: "Done", color: "#16A36A" },
};

export default function TasksPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { tasks, stats, addTask, moveTask, loading, error, refresh } = useTasks();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [assignee, setAssignee] = React.useState("All");
  const [priority, setPriority] = React.useState<"all" | TaskPriority>("all");
  const [dueFilter, setDueFilter] = React.useState<DueFilter>("all");
  const [viewMode, setViewMode] = React.useState<ViewMode>("kanban");
  const [draft, setDraft] = React.useState<TaskForm>({ title: "", assignee: "", dueText: "", priority: "medium" });

  const assignees = React.useMemo(
    () => ["All", ...Array.from(new Set(tasks.map((task) => task.assignee).filter(Boolean))).sort()],
    [tasks],
  );

  const filteredTasks = React.useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query || `${task.title} ${task.assignee} ${task.dueText || ""}`.toLocaleLowerCase().includes(query);
      const matchesAssignee = assignee === "All" || task.assignee === assignee;
      const matchesPriority = priority === "all" || task.priority === priority;
      const matchesDue = dueFilter === "all" || (dueFilter === "with_due" ? Boolean(task.dueText) : !task.dueText);
      return matchesSearch && matchesAssignee && matchesPriority && matchesDue;
    });
  }, [assignee, dueFilter, priority, search, tasks]);

  const filteredGrouped = React.useMemo(
    () => ({
      todo: filteredTasks.filter((task) => task.status === "todo"),
      in_progress: filteredTasks.filter((task) => task.status === "in_progress"),
      done: filteredTasks.filter((task) => task.status === "done"),
    }),
    [filteredTasks],
  );

  const cycleAssignee = () => setAssignee((current) => assignees[(assignees.indexOf(current) + 1) % assignees.length] || "All");
  const cyclePriority = () => {
    const values: ("all" | TaskPriority)[] = ["all", "high", "medium", "low"];
    setPriority((current) => values[(values.indexOf(current) + 1) % values.length]);
  };
  const cycleDue = () => {
    const values: DueFilter[] = ["all", "with_due", "no_due"];
    setDueFilter((current) => values[(values.indexOf(current) + 1) % values.length]);
  };

  const createTask = async () => {
    if (!draft.title.trim() || !draft.assignee.trim()) return;
    setSaving(true);
    try {
      await addTask(draft);
      setOpen(false);
      setDraft({ title: "", assignee: "", dueText: "", priority: "medium" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell scrollable={false}>
      <View style={styles.pageCard}>
        <View style={styles.pageHeader}>
          <View style={styles.headingCopy}>
            <Text style={styles.pageTitle}>Tasks</Text>
            <Text style={styles.pageSubtitle}>Operations board for clinical and admin coordination.</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.tabs}>
              <ViewTab active={viewMode === "kanban"} label="Kanban" onPress={() => setViewMode("kanban")} styles={styles} />
              <ViewTab active={viewMode === "list"} label="List" onPress={() => setViewMode("list")} styles={styles} />
            </View>
            <TouchableOpacity accessibilityLabel="Refresh tasks" style={styles.secondaryBtn} onPress={refresh}>
              <Ionicons name="refresh-outline" size={17} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setOpen(true)}>
              <Ionicons name="add" size={16} color={theme.colors.textOnPrimary} />
              <Text style={styles.primaryButtonText}>New Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <StatCard label="Total" value={stats.total} icon="checkbox-outline" tone={theme.colors.primary} soft={theme.colors.primarySoft} theme={theme} />
            <StatCard label="To Do" value={stats.todo} icon="hourglass-outline" tone={STATUS_META.todo.color} soft="#FFF5E8" theme={theme} />
            <StatCard label="In Progress" value={stats.inProgress} icon="time-outline" tone={STATUS_META.in_progress.color} soft={theme.colors.primarySoft} theme={theme} />
            <StatCard label="Done" value={stats.done} icon="checkmark-circle-outline" tone={STATUS_META.done.color} soft={theme.colors.successSoft} theme={theme} />
          </View>

          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search tasks..."
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.searchInput}
              />
              {!!search && (
                <TouchableOpacity accessibilityLabel="Clear search" onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.muted} />
                </TouchableOpacity>
              )}
            </View>
            <FilterButton label="Assignee" value={assignee} onPress={cycleAssignee} theme={theme} styles={styles} />
            <FilterButton label="Priority" value={priority === "all" ? "All" : capitalize(priority)} onPress={cyclePriority} theme={theme} styles={styles} />
            <FilterButton label="Due date" value={dueFilter === "all" ? "All" : dueFilter === "with_due" ? "Scheduled" : "Not set"} onPress={cycleDue} theme={theme} styles={styles} />
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading live clinic tasks…</Text>
            </View>
          ) : viewMode === "kanban" ? (
            <View style={styles.board}>
              {(["todo", "in_progress", "done"] as TaskStatus[]).map((status) => (
                <TaskColumn
                  key={status}
                  status={status}
                  rows={filteredGrouped[status]}
                  onAdd={() => setOpen(true)}
                  onMove={moveTask}
                  theme={theme}
                />
              ))}
            </View>
          ) : (
            <TaskList rows={filteredTasks} onMove={moveTask} theme={theme} />
          )}
        </ScrollView>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create Task</Text>
                <Text style={styles.modalSubtitle}>Add a task to the clinic task list.</Text>
              </View>
              <TouchableOpacity accessibilityLabel="Close" onPress={() => setOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Input label="Title *" value={draft.title} onChangeText={(value) => setDraft((p) => ({ ...p, title: value }))} theme={theme} />
            <Input label="Assignee *" value={draft.assignee} onChangeText={(value) => setDraft((p) => ({ ...p, assignee: value }))} theme={theme} />
            <Input label="Due" value={draft.dueText} onChangeText={(value) => setDraft((p) => ({ ...p, dueText: value }))} theme={theme} />
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(["high", "medium", "low"] as TaskPriority[]).map((item) => {
                const active = draft.priority === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setDraft((p) => ({ ...p, priority: item }))}
                    style={[styles.priorityBtn, active && styles.priorityBtnActive]}
                  >
                    <Text style={[styles.priorityBtnText, active && styles.priorityBtnTextActive]}>{capitalize(item)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={createTask} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

function ViewTab({ active, label, onPress, styles }: { active: boolean; label: string; onPress: () => void; styles: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TaskColumn({ status, rows, onAdd, onMove, theme }: {
  status: TaskStatus;
  rows: TaskRow[];
  onAdd: () => void;
  onMove: (taskId: string, toStatus: TaskStatus) => void;
  theme: any;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const meta = STATUS_META[status];
  return (
    <View style={[styles.column, { borderTopColor: meta.color }]}>
      <View style={styles.columnHeader}>
        <View style={styles.columnTitleRow}>
          <Text style={styles.columnTitle}>{meta.label}</Text>
          <View style={[styles.countBadge, { backgroundColor: `${meta.color}18` }]}>
            <Text style={[styles.countText, { color: meta.color }]}>{rows.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onAdd} accessibilityLabel="Add task">
          <Ionicons name="add-outline" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.columnScroll} contentContainerStyle={styles.columnBody} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {rows.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={22} color={theme.colors.muted} />
            <Text style={styles.emptyText}>No matching tasks</Text>
          </View>
        ) : rows.map((task) => <TaskCard key={task.id} task={task} onMove={onMove} theme={theme} />)}
      </ScrollView>
    </View>
  );
}

function TaskCard({ task, onMove, theme }: { task: TaskRow; onMove: (taskId: string, toStatus: TaskStatus) => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskMainRow}>
        {task.status === "done" ? (
          <View style={styles.doneIcon}><Ionicons name="checkmark" size={12} color={theme.colors.textOnPrimary} /></View>
        ) : null}
        <View style={styles.taskCopy}>
          <Text numberOfLines={2} style={styles.taskTitle}>{task.title}</Text>
          <Text numberOfLines={1} style={styles.taskAssignee}>{task.assignee}</Text>
          <View style={styles.taskMetaRow}>
            <View style={styles.dueRow}>
              <Ionicons name="calendar-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.dueText}>{task.dueText || "Not set"}</Text>
            </View>
            {task.status !== "done" ? <PriorityBadge priority={task.priority} theme={theme} /> : null}
          </View>
          <MoveActions task={task} onMove={onMove} theme={theme} />
        </View>
      </View>
    </View>
  );
}

function MoveActions({ task, onMove, theme }: { task: TaskRow; onMove: (taskId: string, toStatus: TaskStatus) => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.moveRow}>
      {task.status !== "todo" && <TinyMove label="To Do" icon="arrow-back-outline" onPress={() => onMove(task.id, "todo")} theme={theme} />}
      {task.status !== "in_progress" && <TinyMove label="Progress" icon="play-outline" onPress={() => onMove(task.id, "in_progress")} theme={theme} />}
      {task.status !== "done" && <TinyMove label="Done" icon="checkmark-outline" onPress={() => onMove(task.id, "done")} theme={theme} />}
    </View>
  );
}

function TaskList({ rows, onMove, theme }: { rows: TaskRow[]; onMove: (taskId: string, toStatus: TaskStatus) => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.list}>
      {rows.length === 0 ? (
        <Text style={styles.emptyText}>No matching tasks</Text>
      ) : (
        rows.map((task) => (
          <View key={task.id} style={styles.listRow}>
            <View style={styles.listTitleWrap}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskAssignee}>{task.assignee}</Text>
            </View>
            <View style={styles.listDue}>
              <Ionicons name="calendar-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.dueText}>{task.dueText || "Not set"}</Text>
            </View>
            <PriorityBadge priority={task.priority} theme={theme} />
            <View style={styles.listStatusWrap}>
              <View style={[styles.dot, { backgroundColor: STATUS_META[task.status].color }]} />
              <Text style={styles.listStatusText}>{STATUS_META[task.status].label}</Text>
            </View>
            <MoveActions task={task} onMove={onMove} theme={theme} />
          </View>
        ))
      )}
    </View>
  );
}

function FilterButton({ label, value, onPress, theme, styles }: { label: string; value: string; onPress: () => void; theme: any; styles: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.filterButton}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.filterValue}>{value}</Text>
      <Ionicons name="chevron-down-outline" size={13} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

function TinyMove({ label, icon, onPress, theme }: { label: string; icon: any; onPress: () => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity onPress={onPress} style={styles.tinyMove}>
      <Ionicons name={icon} size={11} color={theme.colors.textSecondary} />
      <Text style={styles.tinyMoveText}>{label}</Text>
    </TouchableOpacity>
  );
}

function PriorityBadge({ priority, theme }: { priority: TaskPriority; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const color = priority === "high" ? theme.colors.error : priority === "medium" ? "#F59E0B" : theme.colors.success;
  return (
    <View style={[styles.priorityBadge, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.priorityBadgeText, { color }]}>{priority}</Text>
    </View>
  );
}

function Input({ label, value, onChangeText, theme }: { label: string; value: string; onChangeText: (value: string) => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor={theme.colors.textSecondary} />
    </View>
  );
}

function StatCard({ label, value, icon, tone, soft, theme }: { label: string; value: number; icon: any; tone: string; soft: string; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={20} color={tone} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1).replace("_", " "); }

const createStyles = (theme: any) => StyleSheet.create({
  pageCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    overflow: "hidden",
    ...(Platform.OS === "web" ? ({ boxShadow: "0px 8px 24px rgba(15,23,42,0.05)" } as any) : null),
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 36,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderMuted,
  },
  headingCopy: { flex: 1, minWidth: 250 },
  pageTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.3, color: theme.colors.text },
  pageSubtitle: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },

  headerActions: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  tabs: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 10,
  },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 7 },
  tabActive: { backgroundColor: theme.colors.surface },
  tabText: { fontSize: 12.5, fontWeight: "600", color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.text },

  secondaryBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  primaryButtonText: { color: theme.colors.textOnPrimary, fontWeight: "600", fontSize: 13 },

  body: { flexGrow: 1, paddingHorizontal: 36, paddingTop: 26, paddingBottom: 36, gap: 18 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.errorSoft,
    borderRadius: 12,
    backgroundColor: theme.colors.errorSoft,
    padding: 11,
  },
  errorText: { color: theme.colors.error, fontWeight: "600", fontSize: 13 },

  statsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  statCard: {
    flex: 1,
    minWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  statIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "600" },
  statValue: { marginTop: 3, fontSize: 24, lineHeight: 28, fontWeight: "700", color: theme.colors.text },

  toolbar: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  searchBox: {
    height: 40,
    minWidth: 220,
    flex: 1,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 13, outlineStyle: "none" } as any,
  filterButton: {
    height: 40,
    minWidth: 130,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterLabel: { color: theme.colors.textSecondary, fontSize: 12 },
  filterValue: { flex: 1, color: theme.colors.text, fontSize: 13, fontWeight: "600" },

  board: { flexDirection: "row", gap: 14, flexWrap: "wrap", alignItems: "stretch" },
  column: {
    flex: 1,
    minWidth: 260,
    minHeight: 320,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  columnHeader: {
    height: 46,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderMuted,
  },
  columnTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  columnTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: theme.colors.muted,
  },
  countBadge: { minWidth: 21, height: 21, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  countText: { fontWeight: "600", fontSize: 11.5 },
  columnScroll: { flex: 1, minHeight: 0 },
  columnBody: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
  emptyState: { paddingVertical: 32, alignItems: "center", gap: 8 },
  emptyText: { color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: "500" },

  taskCard: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.colors.borderSubtle },
  taskMainRow: { flexDirection: "row", gap: 10 },
  doneIcon: {
    marginTop: 1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: STATUS_META.done.color,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCopy: { flex: 1, minWidth: 0 },
  taskTitle: { color: theme.colors.text, fontSize: 13.5, fontWeight: "600", lineHeight: 18 },
  taskAssignee: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 },
  taskMetaRow: { marginTop: 7, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dueText: { color: theme.colors.textSecondary, fontSize: 11.5 },
  priorityBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  priorityBadgeText: { fontSize: 10.5, lineHeight: 12, fontWeight: "600", textTransform: "capitalize" },
  moveRow: { marginTop: 8, flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 5 },
  tinyMove: {
    height: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 7,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  tinyMoveText: { color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: "500" },

  loadingBox: { minHeight: 260, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: theme.colors.textSecondary, fontWeight: "500", fontSize: 13 },

  list: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, paddingHorizontal: 16 },
  listRow: {
    minHeight: 60,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  listTitleWrap: { flex: 1, minWidth: 180 },
  listDue: { minWidth: 110, flexDirection: "row", alignItems: "center", gap: 6 },
  listStatusWrap: { width: 110, flexDirection: "row", alignItems: "center", gap: 7 },
  listStatusText: { fontSize: 12.5, color: theme.colors.text },
  dot: { width: 6, height: 6, borderRadius: 3 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.42)", alignItems: "center", justifyContent: "center", padding: 16 },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 22,
    ...(Platform.OS === "web" ? ({ boxShadow: "0px 8px 24px rgba(15,23,42,0.08)" } as any) : null),
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { color: theme.colors.text, fontWeight: "700", fontSize: 18 },
  modalSubtitle: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 },
  modalClose: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  inputGroup: { marginTop: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.muted,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: theme.colors.text,
  },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: theme.colors.surface,
  },
  priorityBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  priorityBtnText: { color: theme.colors.textSecondary, fontWeight: "600", fontSize: 12 },
  priorityBtnTextActive: { color: theme.colors.primary },
  modalActions: { marginTop: 20, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  modalCancel: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  modalCancelText: { color: theme.colors.text, fontWeight: "600", fontSize: 13 },
  disabled: { opacity: 0.65 },
});
