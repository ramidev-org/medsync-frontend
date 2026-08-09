import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SubscriptionSettingsPage() {
  const { theme } = useTheme();
  const { clinic, subscription } = useAppData();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <PageShell title="Subscription" subtitle="Plan, limits, renewal, and payment handling for your practice.">
      <ThemedCard style={styles.card}>
        <Row label="Plan" value={subscription.tier_plan || clinic?.tier_plan || "solo"} theme={theme} />
        <Row label="Status" value={subscription.status} theme={theme} />
        <Row label="License" value={subscription.license_id || "-"} theme={theme} />
        <Row label="Expiry" value={subscription.expires_at || "-"} theme={theme} />
        <Row label="Doctors" value={`${subscription.current_doctors ?? 0}/${subscription.max_doctors ?? 1}`} theme={theme} />
        <Row label="Assistants" value={`${subscription.current_assistants ?? 0}/${subscription.max_assistants ?? 0}`} theme={theme} />
      </ThemedCard>

      <ThemedCard style={styles.card}>
        <Text style={styles.title}>Payment workflow</Text>
        <Text style={styles.copy}>For Algeria launch, keep manual bank transfer or cash invoice active first. Add CIB/Edahabia gateway later after pilots validate pricing.</Text>
      </ThemedCard>
    </PageShell>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 8 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: "700", textAlign: "right", flex: 1 }}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: { padding: 16, marginBottom: 12 },
    title: { color: theme.colors.text, fontWeight: "700", fontSize: 16 },
    copy: { marginTop: 8, color: theme.colors.textSecondary, fontWeight: "700", lineHeight: 20 },
  });
