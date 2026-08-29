import { ThemedCard } from "@/components/common/default_card";
import { PageShell } from "@/components/layout/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const items = [
  { title: "Patient export", copy: "Prepare PDF/Excel export for patient lists, invoices, and consultation summaries." },
  { title: "Backup cadence", copy: "Schedule automatic database backups before onboarding real clinics." },
  { title: "Data ownership", copy: "Make clinic data export visible so doctors trust the product before subscribing." },
];

export default function DataSettingsPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <PageShell title="Data & Backup" subtitle="Operational controls for exports, backups, and service readiness.">
      <View style={styles.grid}>
        {items.map((item) => (
          <ThemedCard key={item.title} style={styles.card}>
            <Ionicons name="cloud-done-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.copy}>{item.copy}</Text>
          </ThemedCard>
        ))}
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    card: { padding: 16, flex: 1, minWidth: 230 },
    title: { marginTop: 10, color: theme.colors.text, fontWeight: "700", fontSize: 16 },
    copy: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", lineHeight: 20 },
  });
