import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfilePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { clinic, isClinicAdmin } = useAppData();
  const router = useRouter();
  const styles = createStyles(theme);

  return (
    <PageShell title="Profile" subtitle="Your identity and role details.">
      <ThemedCard style={styles.card}>
        <View style={styles.row}><Text style={styles.k}>Name</Text><Text style={styles.v}>{user?.fullname || "—"}</Text></View>
        <View style={styles.row}><Text style={styles.k}>Email</Text><Text style={styles.v}>{user?.email || "—"}</Text></View>
        <View style={styles.row}><Text style={styles.k}>Role</Text><Text style={styles.v}>{user?.user_type || "—"}</Text></View>
        <View style={styles.row}><Text style={styles.k}>Clinic</Text><Text style={styles.v}>{clinic?.name ? String(clinic.name) : "—"}</Text></View>
      </ThemedCard>

      <View style={{ height: 12 }} />

      <ThemedCard style={styles.card}>
        <TouchableOpacity style={styles.action} onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.actionText}>Open Clinic Settings</Text>
        </TouchableOpacity>
        {!!isClinicAdmin && (
          <TouchableOpacity style={styles.action} onPress={() => router.push("/users")}>
            <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.actionText}>Manage Team</Text>
          </TouchableOpacity>
        )}
      </ThemedCard>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: { padding: 18, gap: 10 },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    k: { color: theme.colors.textSecondary, fontWeight: "800" },
    v: { color: theme.colors.text, fontWeight: "900" },
    action: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, backgroundColor: theme.colors.surface },
    actionText: { color: theme.colors.text, fontWeight: "800" },
  });
