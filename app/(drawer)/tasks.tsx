import { PageShell } from "@/components/page_shell";
import { TaskPriority, TaskStatus, useTasks } from "@/contexts/tasks_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type TaskForm = {
  title: string;
  assignee: string;
  dueText: string;
  priority: TaskPriority;
};

export default function TasksPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { stats, grouped, addTask, moveTask } = useTasks();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<TaskForm>({
    title: "",
    assignee: "",
    dueText: "",
    priority: "medium",
  });

  const createTask = () => {
    if (!draft.title.trim() || !draft.assignee.trim()) return;
    addTask(draft);
    setOpen(false);
    setDraft({ title: "", assignee: "", dueText: "", priority: "medium" });
  };

  return (
    <PageShell
      title="Task Workflow"
      subtitle="Operations board for clinical and admin coordination."
      actions={
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setOpen(true)}>
          <Ionicons name="add-outline" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>New Task</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
        <Text style={styles.noticeText}>Tasks are shared with the dashboard for the solo doctor daily workflow.</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total" value={String(stats.total)} tone={theme.colors.primary} theme={theme} />
        <StatCard label="To Do" value={String(stats.todo)} tone={theme.colors.warning} theme={theme} />
        <StatCard label="In Progress" value={String(stats.inProgress)} tone={theme.colors.info} theme={theme} />
        <StatCard label="Done" value={String(stats.done)} tone={theme.colors.success} theme={theme} />
      </View>

      <View style={styles.board}>
        <TaskColumn
          title="To Do"
          icon="clipboard-outline"
          rows={grouped.todo}
          onMove={moveTask}
          theme={theme}
        />
        <TaskColumn
          title="In Progress"
          icon="time-outline"
          rows={grouped.in_progress}
          onMove={moveTask}
          theme={theme}
        />
        <TaskColumn
          title="Done"
          icon="checkmark-done-outline"
          rows={grouped.done}
          onMove={moveTask}
          theme={theme}
        />
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Task</Text>
            <Input label="Title *" value={draft.title} onChangeText={(value) => setDraft((p) => ({ ...p, title: value }))} theme={theme} />
            <Input label="Assignee *" value={draft.assignee} onChangeText={(value) => setDraft((p) => ({ ...p, assignee: value }))} theme={theme} />
            <Input label="Due" value={draft.dueText} onChangeText={(value) => setDraft((p) => ({ ...p, dueText: value }))} theme={theme} />

            <Text style={styles.priorityLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(["high", "medium", "low"] as TaskPriority[]).map((priority) => {
                const active = draft.priority === priority;
                return (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => setDraft((p) => ({ ...p, priority }))}
                    style={[
                      styles.priorityBtn,
                      {
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        backgroundColor: active ? theme.colors.primarySoft : theme.colors.background,
                      },
                    ]}
                  >
                    <Text style={[styles.priorityBtnText, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
                      {priority.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={createTask}>
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

function TaskColumn({
  title,
  icon,
  rows,
  onMove,
  theme,
}: {
  title: string;
  icon: any;
  rows: ReturnType<typeof useTasks>["tasks"];
  onMove: (taskId: string, toStatus: TaskStatus) => void;
  theme: any;
}) {
  return (
    <View style={{ flex: 1, minWidth: 260, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingHorizontal: 10, paddingVertical: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name={icon} size={15} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{title}</Text>
        </View>
        <Text style={{ color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 }}>{rows.length}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 10, gap: 8, maxHeight: 440 }}>
        {rows.length === 0 && <Text style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>No tasks</Text>}
        {rows.map((task) => (
          <View key={task.id} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.background, padding: 10 }}>
            <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{task.title}</Text>
            <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", marginTop: 2 }}>{task.assignee}</Text>
            <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", marginTop: 1, fontSize: 12 }}>{task.dueText || "Not set"}</Text>
            <View style={{ marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <PriorityBadge priority={task.priority} theme={theme} />
              <View style={{ flexDirection: "row", gap: 6 }}>
                {task.status !== "todo" && (
                  <TinyMove label="To Do" onPress={() => onMove(task.id, "todo")} theme={theme} />
                )}
                {task.status !== "in_progress" && (
                  <TinyMove label="Progress" onPress={() => onMove(task.id, "in_progress")} theme={theme} />
                )}
                {task.status !== "done" && (
                  <TinyMove label="Done" onPress={() => onMove(task.id, "done")} theme={theme} />
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function TinyMove({ label, onPress, theme }: { label: string; onPress: () => void; theme: any }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.colors.surface }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800", fontSize: 11 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function PriorityBadge({ priority, theme }: { priority: TaskPriority; theme: any }) {
  const color =
    priority === "high" ? theme.colors.error : priority === "medium" ? theme.colors.warning : theme.colors.success;
  return (
    <View style={{ borderWidth: 1, borderColor: color, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ color, fontWeight: "900", fontSize: 11, textTransform: "uppercase" }}>{priority}</Text>
    </View>
  );
}

function Input({
  label,
  value,
  onChangeText,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: any;
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={{
          height: 42,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          paddingHorizontal: 10,
          color: theme.colors.text,
          backgroundColor: theme.colors.background,
          fontWeight: "700",
        }}
      />
    </View>
  );
}

function StatCard({ label, value, tone, theme }: { label: string; value: string; tone: string; theme: any }) {
  return (
    <View style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface, padding: 10 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11 }}>{label}</Text>
      <Text style={{ color: tone, fontWeight: "900", fontSize: 20, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
    },
    primaryBtnText: { color: "#fff", fontWeight: "900" },
    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      padding: 10,
      marginBottom: 10,
    },
    noticeText: { color: theme.colors.textSecondary, fontWeight: "700" },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
    board: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    modalCard: {
      width: "100%",
      maxWidth: 520,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 14,
    },
    modalTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 17 },
    priorityLabel: { marginTop: 12, color: theme.colors.textSecondary, fontWeight: "800" },
    priorityRow: { marginTop: 8, flexDirection: "row", gap: 8 },
    priorityBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    priorityBtnText: { fontWeight: "900", fontSize: 12, textTransform: "capitalize" },
    modalActions: { marginTop: 16, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
    modalCancel: {
      height: 38,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background,
    },
    modalCancelText: { color: theme.colors.text, fontWeight: "800" },
    modalSave: {
      height: 38,
      borderRadius: 10,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    modalSaveText: { color: "#fff", fontWeight: "900" },
  });

