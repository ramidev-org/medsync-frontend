import { ThemedCard } from "@/components/common/default_card";
import { PageShell } from "@/components/layout/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const checks = [
  "Use a strong password and avoid shared clinic accounts.",
  "Keep medical edits traceable with audit events before production.",
  "Review inactive staff access from Team Directory when using assistants.",
  "Export and store backup copies according to your clinic policy.",
];

export default function SecuritySettingsPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <PageShell title="Security" subtitle="Session policy and production safety checklist.">
      <ThemedCard style={styles.card}>
        {checks.map((check) => (
          <View key={check} style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.text}>{check}</Text>
          </View>
        ))}
      </ThemedCard>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: { padding: 16, gap: 12 },
    row: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    text: { flex: 1, color: theme.colors.text, fontWeight: "600", lineHeight: 20 },
  });
