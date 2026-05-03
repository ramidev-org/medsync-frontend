import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { OdontogramState, PROCEDURES, ToothId, ToothSurface } from "./odontogram";

const procedureLabel = (key?: string) => PROCEDURES.find((p) => p.key === key)?.label ?? (key ? key : "-");

export function TreatmentHistoryPanel({
  theme,
  odontogram,
  selected,
}: {
  theme: any;
  odontogram: OdontogramState;
  selected?: { tooth?: ToothId; surface?: ToothSurface };
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const tooth = selected?.tooth;
  const surface = selected?.surface;

  const toothChart = tooth ? odontogram[tooth] : undefined;
  const currentProcedure = tooth && surface ? toothChart?.[surface]?.procedure : undefined;
  const history =
    tooth && surface
      ? toothChart?.[surface]?.history ?? []
      : tooth
        ? Object.values(toothChart ?? {}).flatMap((s) => s?.history ?? [])
        : [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Treatment history</Text>
      <Text style={styles.subtitle}>
        {tooth && surface ? `Tooth ${tooth} · Surface ${surface}` : tooth ? `Tooth ${tooth} · All surfaces` : "Select a tooth"}
      </Text>

      {tooth && surface ? (
        <View style={styles.currentRow}>
          <Text style={styles.currentLabel}>Current:</Text>
          <Text style={styles.currentValue}>{procedureLabel(currentProcedure)}</Text>
        </View>
      ) : null}

      {history.length === 0 ? (
        <Text style={styles.empty}>No treatments recorded yet.</Text>
      ) : (
        <ScrollView style={{ maxHeight: 160 }} contentContainerStyle={{ gap: 8 }}>
          {[...history]
            .slice()
            .sort((a, b) => (a.at < b.at ? 1 : -1))
            .map((h) => (
            <View key={h.id} style={styles.itemRow}>
              <Text style={styles.itemAt}>{new Date(h.at).toLocaleString()}</Text>
              <Text style={styles.itemProc}>
                {procedureLabel(h.procedure)}
                {h.note ? ` · ${h.note}` : ""}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      padding: 12,
      gap: 8,
    },
    title: { fontWeight: "900", color: theme.colors.primary },
    subtitle: { fontWeight: "800", opacity: 0.7 },
    currentRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    currentLabel: { fontWeight: "900", opacity: 0.75 },
    currentValue: { fontWeight: "900" },
    empty: { fontWeight: "800", opacity: 0.6, paddingTop: 6 },
    itemRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.surfaceVariant,
      gap: 2,
    },
    itemAt: { fontWeight: "900", fontSize: 12, opacity: 0.8 },
    itemProc: { fontWeight: "900", fontSize: 12 },
  });
