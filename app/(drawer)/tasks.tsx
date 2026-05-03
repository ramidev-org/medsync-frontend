import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const TASKS = [
  { title: "Review pending lab results", assignee: "Dr. Amine", status: "High" },
  { title: "Call post-op patients", assignee: "Assistant Lina", status: "Medium" },
  { title: "Approve insurance claims", assignee: "Admin", status: "High" },
  { title: "Refill anesthetics inventory", assignee: "Assistant Yacine", status: "Low" },
];

export default function TasksPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <PageShell title="Smart Task Board" subtitle="Track clinic operations and follow-up actions in one place.">
      <View style={styles.list}>
        {TASKS.map((task) => (
          <View key={task.title} style={styles.row}>
            <View style={styles.left}>
              <Ionicons name="checkbox-outline" size={18} color={theme.colors.primary} />
              <View>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.sub}>{task.assignee}</Text>
              </View>
            </View>
            <Text style={[styles.badge, { color: task.status === "High" ? theme.colors.error : task.status === "Medium" ? theme.colors.warning : theme.colors.success }]}>
              {task.status}
            </Text>
          </View>
        ))}
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    list: { borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, overflow: "hidden" },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    left: { flexDirection: "row", gap: 10, alignItems: "center" },
    title: { fontWeight: "800", color: theme.colors.text },
    sub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "600", fontSize: 12 },
    badge: { fontWeight: "900", fontSize: 12 },
  });
