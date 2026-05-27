import { PageShell } from "@/components/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  subtitle: string;
  onPress: () => void | Promise<void>;
  danger?: boolean;
  theme: any;
};

function ActionRow({ icon, label, subtitle, onPress, danger = false, theme }: RowProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? "rgba(220,38,38,0.10)" : "#EFF6FF" }]}>
        <Ionicons name={icon} size={18} color={danger ? theme.colors.error : "#1D4ED8"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: danger ? theme.colors.error : theme.colors.text }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { clinic, isClinicAdmin, subscription } = useAppData();
  const router = useRouter();

  const expiresAtLabel = React.useMemo(() => {
    const iso = subscription?.expires_at;
    if (!iso) return "-";
    try {
      return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
    } catch {
      return String(iso);
    }
  }, [subscription?.expires_at]);

  return (
    <PageShell scrollable={false} contentStyle={{ flex: 1, paddingTop: 14 }}>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 14 }}>
        <View style={[styles.heroCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.brandPill}>
            <Ionicons name="settings-outline" size={15} color="#1D4ED8" />
            <Text style={styles.brandText}>MedSync</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>Settings workspace</Text>
          <Text style={[styles.heroSub, { color: theme.colors.textSecondary }]}>Configure clinic, subscription, security, and account controls.</Text>
        </View>

        <View style={styles.statGrid}>
          <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text style={styles.statLabel}>Plan</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{subscription?.tier_plan || clinic?.tier_plan || "basic"}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{subscription?.status || "missing"}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text style={styles.statLabel}>Expiry</Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{expiresAtLabel}</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account & Clinic</Text>
          <ActionRow icon="person-circle-outline" label="Profile" subtitle={`Current role: ${String(user?.user_type ?? "assistant")}${isClinicAdmin ? " (admin)" : ""}`} onPress={() => router.push("/profile")} theme={theme} />
          <ActionRow icon="business-outline" label="Practice Settings" subtitle="Identity, address, and cabinet profile" onPress={() => router.push("/settings-practice")} theme={theme} />
          {!!isClinicAdmin && <ActionRow icon="people-outline" label="Clinic Staff" subtitle="Manage users and invites" onPress={() => router.push("/users")} theme={theme} />}
        </View>

        <View style={[styles.sectionCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Platform Settings</Text>
          <ActionRow icon="receipt-outline" label="Subscription Settings" subtitle="Plan limits, status, and renewal details" onPress={() => router.push("/settings-subscription")} theme={theme} />
          <ActionRow icon="cloud-outline" label="Data & Backup Settings" subtitle="Export and backup controls" onPress={() => router.push("/settings-data")} theme={theme} />
          <ActionRow icon="shield-checkmark-outline" label="Security Settings" subtitle="Password and session security policies" onPress={() => router.push("/settings-security")} theme={theme} />
          <ActionRow icon="notifications-outline" label="Notifications Page" subtitle="Open full notifications list" onPress={() => router.push("/notifications")} theme={theme} />
        </View>

        <View style={[styles.sectionCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Session</Text>
          <ActionRow icon="log-out-outline" label="Sign Out" subtitle="End current session on this device" onPress={logout} danger theme={theme} />
        </View>
      </ScrollView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  brandPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  brandText: { color: "#1D4ED8", fontWeight: "800", fontSize: 12 },
  heroTitle: { fontWeight: "900", fontSize: 26, letterSpacing: -0.3 },
  heroSub: { fontWeight: "700", fontSize: 13 },
  statGrid: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  statCard: { flexGrow: 1, minWidth: 180, borderWidth: 1, borderRadius: 16, padding: 12 },
  statLabel: { color: "#64748B", fontWeight: "800", fontSize: 12 },
  statValue: { marginTop: 4, fontWeight: "900", fontSize: 15 },
  sectionCard: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 8 },
  sectionTitle: { fontWeight: "900", fontSize: 16, marginBottom: 2 },
  row: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontWeight: "900" },
  rowSub: { marginTop: 2, fontWeight: "700", fontSize: 12 },
});

