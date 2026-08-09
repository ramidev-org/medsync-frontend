import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function PracticeSettingsPage() {
  const { theme } = useTheme();
  const { clinic } = useAppData();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <PageShell title="Practice Profile" subtitle="Solo doctor cabinet details used across documents and daily workflow.">
      <ThemedCard style={styles.card}>
        <Section icon="business-outline" title="Cabinet identity" theme={theme} />
        <Field label="Cabinet name" value={String(clinic?.name || "")} theme={theme} />
        <Field label="Clinic code" value={String(clinic?.clinic_code || "")} theme={theme} />
        <Field label="Address" value={String(clinic?.google_maps_address || clinic?.address || "")} theme={theme} multiline />
      </ThemedCard>

      <ThemedCard style={styles.card}>
        <Section icon="document-text-outline" title="Document header" theme={theme} />
        <Field label="Phone" value={String(clinic?.phone || "")} theme={theme} />
        <Field label="Email" value={String(clinic?.email || "")} theme={theme} />
        <Text style={styles.hint}>Use these values for prescriptions, certificates, invoices, and patient summaries.</Text>
      </ThemedCard>
    </PageShell>
  );
}

function Section({ icon, title, theme }: { icon: any; title: string; theme: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 16 }}>{title}</Text>
    </View>
  );
}

function Field({ label, value, theme, multiline }: { label: string; value: string; theme: any; multiline?: boolean }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "600", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        editable={false}
        multiline={multiline}
        style={{
          minHeight: multiline ? 84 : 44,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 10,
          color: theme.colors.text,
          backgroundColor: theme.colors.background,
          fontWeight: "700",
        }}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: { padding: 16, marginBottom: 12 },
    hint: { marginTop: 10, color: theme.colors.textSecondary, fontWeight: "700" },
  });
