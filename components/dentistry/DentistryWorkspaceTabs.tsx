import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type DentistryWorkspaceTool = "odontogram" | "dental-xray-viewer" | "tooth-treatment-panel";

const TABS: Array<{ key: DentistryWorkspaceTool; label: string }> = [
  { key: "odontogram", label: "Odontogram" },
  { key: "dental-xray-viewer", label: "X‑ray viewer" },
  { key: "tooth-treatment-panel", label: "Treatment panel" },
];

export function DentistryWorkspaceTabs({
  theme,
  active,
  onChange,
}: {
  theme: any;
  active: DentistryWorkspaceTool;
  onChange: (next: DentistryWorkspaceTool) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[
              styles.tab,
              {
                borderColor: isActive ? theme.colors.primary : theme.colors.border,
                backgroundColor: isActive ? theme.colors.primarySoft : theme.colors.surface,
              },
            ]}
          >
            <Text style={[styles.label, { color: isActive ? theme.colors.primary : theme.colors.textSecondary }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingBottom: 8,
    },
    tab: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    label: { fontWeight: "900", fontSize: 12 },
  });
