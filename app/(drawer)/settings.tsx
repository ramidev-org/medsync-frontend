import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SettingsPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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
    <PageShell title="Settings" subtitle="Clinic operations, billing, integrations, and security controls">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <ThemedCard style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <View>
              <Text style={styles.summaryTitle}>{clinic?.name ? String(clinic.name) : "Clinic not configured"}</Text>
              <Text style={styles.summarySub}>Current role: {String(user?.user_type ?? "assistant").toUpperCase()}</Text>
            </View>
            {!!isClinicAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>
          <View style={{ marginTop: 12, gap: 8 }}>
            <KeyVal label="Plan" value={subscription?.tier_plan || clinic?.tier_plan || "basic"} theme={theme} />
            <KeyVal label="Subscription Status" value={subscription?.status || "missing"} theme={theme} />
            <KeyVal label="Renewal / Expiry" value={expiresAtLabel} theme={theme} />
            <KeyVal
              label="Team Capacity"
              value={`${subscription?.current_doctors ?? 0}/${subscription?.max_doctors ?? "-"} doctors, ${subscription?.current_assistants ?? 0}/${subscription?.max_assistants ?? "-"} assistants`}
              theme={theme}
            />
          </View>
        </ThemedCard>

        <ThemedCard style={styles.section}>
          <SectionTitle title="Workspace" theme={theme} />
          <ActionRow icon="person-circle-outline" label="Profile & Personal Info" subtitle="Edit your profile details and role fields" onPress={() => router.push("/profile")} theme={theme} />
          <ActionRow icon="people-outline" label="Team Directory" subtitle="Manage clinic users, invites, and permissions" onPress={() => router.push("/users")} theme={theme} />
          <ActionRow icon="chatbubbles-outline" label="Internal Chats" subtitle="Staff communication and handoff workflow" onPress={() => router.push("/chats")} theme={theme} />
        </ThemedCard>

        <ThemedCard style={styles.section}>
          <SectionTitle title="Operations" theme={theme} />
          <ActionRow icon="calendar-outline" label="Appointments & Visits" subtitle="Schedule flow, statuses, and consultation links" onPress={() => router.push("/visits")} theme={theme} />
          <ActionRow icon="cube-outline" label="Inventory" subtitle="Stock levels, thresholds, and consumption tracking" onPress={() => router.push("/inventory")} theme={theme} />
          <ActionRow icon="medical-outline" label="Services & Pricing" subtitle="Catalog, pricing matrix, active availability" onPress={() => router.push("/services")} theme={theme} />
          <ActionRow icon="card-outline" label="Billing & Payments" subtitle="Invoices, payment tracking, and collections" onPress={() => router.push("/payments")} theme={theme} />
        </ThemedCard>

        <ThemedCard style={styles.section}>
          <SectionTitle title="Integrations" theme={theme} />
          <ActionRow icon="scan-outline" label="Imaging Tools" subtitle="OHIF and specialty tools routing by clinic" onPress={() => router.push("/imaging-tools")} theme={theme} />
          <ActionRow icon="cloud-outline" label="Data Connections" subtitle="API endpoints, service health, and sync status" onPress={() => {}} theme={theme} />
          <ActionRow icon="shield-checkmark-outline" label="Audit Trail" subtitle="Operational logs and safety checks" onPress={() => {}} theme={theme} />
        </ThemedCard>

        <ThemedCard style={styles.section}>
          <SectionTitle title="Security & Access" theme={theme} />
          <ActionRow icon="lock-closed-outline" label="Password & Session Policy" subtitle="Session behavior and account security baseline" onPress={() => {}} theme={theme} />
          <ActionRow icon="notifications-outline" label="Notification Controls" subtitle="Configure alerts and signal priorities" onPress={() => router.push("/notifications")} theme={theme} />
          <ActionRow icon="log-out-outline" label="Sign Out" subtitle="End current session on this device" onPress={logout} theme={theme} danger />
        </ThemedCard>
      </ScrollView>
    </PageShell>
  );
}

function SectionTitle({ title, theme }: { title: string; theme: any }) {
  return <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>{title}</Text>;
}

function KeyVal({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800" }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: "900", maxWidth: "58%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  subtitle,
  onPress,
  theme,
  danger = false,
}: {
  icon: any;
  label: string;
  subtitle: string;
  onPress: () => void | Promise<void>;
  theme: any;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: danger ? "rgba(220,38,38,0.10)" : theme.colors.primarySoft }}>
        <Ionicons name={icon} size={18} color={danger ? theme.colors.error : theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? theme.colors.error : theme.colors.text, fontWeight: "900" }}>{label}</Text>
        <Text style={{ marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700" }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    summaryCard: { padding: 16 },
    summaryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
    summaryTitle: { fontSize: 18, fontWeight: "900", color: theme.colors.text },
    summarySub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700" },
    adminBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    adminBadgeText: { color: theme.colors.primary, fontWeight: "900", fontSize: 11 },
    section: { padding: 16 },
  });

