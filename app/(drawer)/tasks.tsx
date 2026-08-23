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
    <PageShell scrollable={false} contentStyle={styles.shellContent}>
      <View style={styles.pageContent}>
        <View style={styles.pageHeading}>
          <View style={styles.headingCopy}>
            <Text style={styles.pageTitle}>Tasks</Text>
            <Text style={styles.pageSubtitle}>Operations board for clinical and admin coordination.</Text>
          </View>
          <View style={styles.headingActions}>
            <TouchableOpacity accessibilityLabel="Refresh tasks" style={styles.secondaryBtn} onPress={refresh}>
              <Ionicons name="refresh-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setOpen(true)}>
              <Ionicons name="add-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>New Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} caption="All tasks" icon="checkbox-outline" tone="#2563EB" soft="#EEF3FF" theme={theme} />
          <StatCard label="To Do" value={stats.todo} caption="Tasks to start" icon="hourglass-outline" tone="#F59E0B" soft="#FFF5E8" theme={theme} />
          <StatCard label="In Progress" value={stats.inProgress} caption="Tasks in progress" icon="time-outline" tone="#2563EB" soft="#EEF3FF" theme={theme} />
          <StatCard label="Done" value={stats.done} caption="Completed tasks" icon="checkmark-circle-outline" tone="#16A36A" soft="#EAF8F2" theme={theme} />
        </View>

        <View style={styles.toolbar}>
          <View style={styles.filterGroup}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search tasks..."
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.searchInput}
              />
              {!!search && (
                <TouchableOpacity accessibilityLabel="Clear search" onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={17} color={theme.colors.muted} />
                </TouchableOpacity>
              )}
            </View>
            <FilterButton label="Assignee" value={assignee} onPress={cycleAssignee} theme={theme} />
            <FilterButton label="Priority" value={priority === "all" ? "All" : capitalize(priority)} onPress={cyclePriority} theme={theme} />
            <FilterButton label="Due date" value={dueFilter === "all" ? "All" : dueFilter === "with_due" ? "Scheduled" : "Not set"} onPress={cycleDue} theme={theme} />
          </View>
          <View style={styles.viewToggle}>
            <ViewButton active={viewMode === "kanban"} label="Kanban" icon="columns-outline" onPress={() => setViewMode("kanban")} theme={theme} />
            <ViewButton active={viewMode === "list"} label="List" icon="list-outline" onPress={() => setViewMode("list")} theme={theme} />
          </View>
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
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Input label="Title *" value={draft.title} onChangeText={(value) => setDraft((p) => ({ ...p, title: value }))} theme={theme} />
            <Input label="Assignee *" value={draft.assignee} onChangeText={(value) => setDraft((p) => ({ ...p, assignee: value }))} theme={theme} />
            <Input label="Due" value={draft.dueText} onChangeText={(value) => setDraft((p) => ({ ...p, dueText: value }))} theme={theme} />
            <Text style={styles.priorityLabel}>Priority</Text>
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
              <TouchableOpacity style={[styles.modalSave, saving && styles.disabled]} onPress={createTask} disabled={saving}>
                <Text style={styles.modalSaveText}>{saving ? "Saving..." : "Create Task"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
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
        <Ionicons name="ellipsis-vertical" size={19} color={theme.colors.textSecondary} />
      </View>
      <TouchableOpacity onPress={onAdd} style={styles.addTaskLink}>
        <Ionicons name="add-outline" size={19} color={theme.colors.primary} />
        <Text style={styles.addTaskText}>Add task</Text>
      </TouchableOpacity>
      <ScrollView style={styles.columnScroll} contentContainerStyle={styles.columnBody} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {rows.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={24} color={theme.colors.muted} />
            <Text style={styles.emptyText}>No matching tasks</Text>
          </View>
        ) : rows.map((task) => <TaskCard key={task.id} task={task} onMove={onMove} theme={theme} />)}
      </ScrollView>
      <View style={styles.columnFooter}>
        <Text style={styles.columnFooterText}>View all {rows.length} {rows.length === 1 ? "task" : "tasks"}</Text>
        <Ionicons name="chevron-forward" size={17} color={theme.colors.text} />
      </View>
    </View>
  );
}

function TaskCard({ task, onMove, theme }: { task: TaskRow; onMove: (taskId: string, toStatus: TaskStatus) => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskMainRow}>
        {task.status === "done" ? (
          <View style={styles.doneIcon}><Ionicons name="checkmark" size={13} color="#fff" /></View>
        ) : null}
        <View style={styles.taskCopy}>
          <Text numberOfLines={2} style={styles.taskTitle}>{task.title}</Text>
          <Text numberOfLines={1} style={styles.taskAssignee}>{task.assignee}</Text>
          <View style={styles.taskMetaRow}>
            <View style={styles.dueRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
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
    <ScrollView style={styles.list} contentContainerStyle={styles.listBody}>
      {rows.length === 0 ? <Text style={styles.emptyText}>No matching tasks</Text> : rows.map((task) => (
        <View key={task.id} style={styles.listRow}>
          <View style={[styles.listStatus, { backgroundColor: STATUS_META[task.status].color }]} />
          <View style={styles.listTitleWrap}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskAssignee}>{task.assignee}</Text>
          </View>
          <View style={styles.listDue}><Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} /><Text style={styles.dueText}>{task.dueText || "Not set"}</Text></View>
          <PriorityBadge priority={task.priority} theme={theme} />
          <View style={[styles.listStatusBadge, { backgroundColor: `${STATUS_META[task.status].color}16` }]}><Text style={{ color: STATUS_META[task.status].color, fontWeight: "700", fontSize: 11 }}>{STATUS_META[task.status].label}</Text></View>
          <MoveActions task={task} onMove={onMove} theme={theme} />
        </View>
      ))}
    </ScrollView>
  );
}

function FilterButton({ label, value, onPress, theme }: { label: string; value: string; onPress: () => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity onPress={onPress} style={styles.filterButton}>
      <View style={styles.filterLabelWrap}>
        <Text style={styles.filterLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.filterValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-down-outline" size={15} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

function ViewButton({ active, label, icon, onPress, theme }: { active: boolean; label: string; icon: any; onPress: () => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.viewButton, active && styles.viewButtonActive]}>
      <Ionicons name={icon} size={16} color={active ? "#fff" : theme.colors.textSecondary} />
      <Text style={[styles.viewButtonText, active && styles.viewButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TinyMove({ label, icon, onPress, theme }: { label: string; icon: any; onPress: () => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity onPress={onPress} style={styles.tinyMove}>
      <Ionicons name={icon} size={12} color={theme.colors.textSecondary} />
      <Text style={styles.tinyMoveText}>{label}</Text>
    </TouchableOpacity>
  );
}

function PriorityBadge({ priority, theme }: { priority: TaskPriority; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const color = priority === "high" ? theme.colors.error : priority === "medium" ? "#F59E0B" : theme.colors.success;
  return <View style={[styles.priorityBadge, { borderColor: `${color}66`, backgroundColor: `${color}0D` }]}><Text style={[styles.priorityBadgeText, { color }]}>{priority}</Text></View>;
}

function Input({ label, value, onChangeText, theme }: { label: string; value: string; onChangeText: (value: string) => void; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor={theme.colors.textSecondary} />
    </View>
  );
}

function StatCard({ label, value, caption, icon, tone, soft, theme }: { label: string; value: number; caption: string; icon: any; tone: string; soft: string; theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: soft }]}><Ionicons name={icon} size={27} color={tone} /></View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
        <Text style={styles.statCaption}>{caption}</Text>
      </View>
    </View>
  );
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1).replace("_", " "); }

const shadow = Platform.OS === "web" ? ({ boxShadow: "0 4px 14px rgba(15,23,42,0.055)" } as any) : null;

const createStyles = (theme: any) => StyleSheet.create({
  shellContent: { paddingTop: 26, paddingBottom: 18 },
  pageContent: { flex: 1, minHeight: 0, gap: 16 },
  pageHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  headingCopy: { flex: 1, minWidth: 250 },
  pageTitle: { color: theme.colors.text, fontSize: 28, lineHeight: 34, fontWeight: "700" },
  pageSubtitle: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4 },
  headingActions: { flexDirection: "row", gap: 12 },
  primaryBtn: { height: 46, paddingHorizontal: 18, borderRadius: 10, backgroundColor: theme.colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, ...shadow },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondaryBtn: { width: 48, height: 46, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: `${theme.colors.error}33`, borderRadius: 10, backgroundColor: `${theme.colors.error}10`, padding: 10 },
  errorText: { color: theme.colors.error, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: 205, minHeight: 120, paddingHorizontal: 16, paddingVertical: 20, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.surface, flexDirection: "row", alignItems: "flex-start", gap: 16, ...shadow },
  statIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  statLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "700" },
  statValue: { marginTop: 2, fontSize: 27, lineHeight: 31, fontWeight: "700" },
  statCaption: { color: theme.colors.textSecondary, marginTop: 4, fontSize: 12 },
  toolbar: { minHeight: 66, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  filterGroup: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  searchBox: { height: 40, minWidth: 220, flex: 1, maxWidth: 310, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: theme.colors.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 13, outlineStyle: "none" } as any,
  filterButton: { height: 40, minWidth: 145, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: theme.colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  filterLabelWrap: { minWidth: 0, flex: 1 },
  filterLabel: { marginTop: -11, paddingHorizontal: 3, alignSelf: "flex-start", backgroundColor: theme.colors.surface, color: theme.colors.textSecondary, fontSize: 10 },
  filterValue: { marginTop: 2, color: theme.colors.text, fontSize: 13, fontWeight: "600" },
  viewToggle: { flexDirection: "row", gap: 6 },
  viewButton: { height: 36, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: theme.colors.surface },
  viewButtonActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  viewButtonText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "700" },
  viewButtonTextActive: { color: "#fff" },
  board: { flex: 1, minHeight: 360, flexDirection: "row", gap: 14, flexWrap: "wrap", alignItems: "stretch" },
  column: { flex: 1, minWidth: 285, minHeight: 360, borderWidth: 1, borderTopWidth: 3, borderColor: theme.colors.border, borderRadius: 9, backgroundColor: theme.colors.surface, overflow: "hidden", ...shadow },
  columnHeader: { height: 47, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  columnTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  columnTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "700" },
  countBadge: { width: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  countText: { fontWeight: "700", fontSize: 12 },
  addTaskLink: { height: 40, marginHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 4 },
  addTaskText: { color: theme.colors.primary, fontSize: 13, fontWeight: "600" },
  columnScroll: { flex: 1, minHeight: 0 },
  columnBody: { paddingHorizontal: 12 },
  emptyState: { paddingVertical: 36, alignItems: "center", gap: 8 },
  emptyText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: "600" },
  taskCard: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  taskMainRow: { flexDirection: "row", gap: 10 },
  doneIcon: { marginTop: 1, width: 19, height: 19, borderRadius: 10, backgroundColor: "#16A36A", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#DDF5EA" },
  taskCopy: { flex: 1, minWidth: 0 },
  taskTitle: { color: theme.colors.text, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  taskAssignee: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  taskMetaRow: { marginTop: 7, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dueText: { color: theme.colors.textSecondary, fontSize: 11 },
  priorityBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  priorityBadgeText: { fontSize: 9, lineHeight: 11, fontWeight: "700", textTransform: "uppercase" },
  moveRow: { marginTop: 8, flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 5 },
  tinyMove: { height: 25, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, backgroundColor: theme.colors.surface, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", gap: 3 },
  tinyMoveText: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: "600" },
  columnFooter: { height: 58, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  columnFooterText: { color: theme.colors.primary, fontSize: 12, fontWeight: "600" },
  loadingBox: { flex: 1, minHeight: 300, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: theme.colors.textSecondary, fontWeight: "600" },
  list: { flex: 1, minHeight: 350, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.surface },
  listBody: { padding: 12, gap: 8 },
  listRow: { minHeight: 70, padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  listStatus: { width: 4, height: 40, borderRadius: 2 },
  listTitleWrap: { flex: 1, minWidth: 180 },
  listDue: { minWidth: 100, flexDirection: "row", alignItems: "center", gap: 5 },
  listStatusBadge: { minWidth: 78, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6, alignItems: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.42)", alignItems: "center", justifyContent: "center", padding: 16 },
  modalCard: { width: "100%", maxWidth: 520, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 20, ...shadow },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { color: theme.colors.text, fontWeight: "700", fontSize: 19 },
  modalSubtitle: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 3 },
  modalClose: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: theme.colors.background },
  inputGroup: { marginTop: 14 },
  inputLabel: { color: theme.colors.textSecondary, fontWeight: "600", marginBottom: 6, fontSize: 12 },
  input: { height: 42, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 11, color: theme.colors.text, backgroundColor: theme.colors.background },
  priorityLabel: { marginTop: 14, color: theme.colors.textSecondary, fontWeight: "600", fontSize: 12 },
  priorityRow: { marginTop: 8, flexDirection: "row", gap: 8 },
  priorityBtn: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  priorityBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  priorityBtnText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11 },
  priorityBtnTextActive: { color: theme.colors.primary },
  modalActions: { marginTop: 20, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  modalCancel: { height: 40, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface },
  modalCancelText: { color: theme.colors.text, fontWeight: "600" },
  modalSave: { height: 40, borderRadius: 8, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary },
  modalSaveText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.65 },
});
