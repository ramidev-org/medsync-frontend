import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type WorkspaceTabDef<T extends string> = { key: T; label: string; icon?: React.ReactNode };

export function WorkspaceTabs<T extends string>({
  theme,
  tabs,
  active,
  onChange,
}: {
  theme: any;
  tabs: WorkspaceTabDef<T>[];
  active: T;
  onChange: (next: T) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[
              styles.tab,
              {
                borderColor: isActive ? theme.colors.primary : theme.colors.border,
                backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
              },
            ]}
          >
            <View style={styles.tabInner}>
              {t.icon ? <View style={styles.icon}>{t.icon}</View> : null}
              <Text style={[styles.label, { color: isActive ? "#fff" : theme.colors.textSecondary }]}>{t.label}</Text>
            </View>
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
      paddingBottom: 10,
    },
    tab: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0px 4px 14px rgba(15,23,42,0.07)",
          } as any)
        : null),
    },
    tabInner: { flexDirection: "row", alignItems: "center", gap: 8 },
    icon: { opacity: 0.95 },
    label: { fontWeight: "900", fontSize: 12, letterSpacing: 0.2 },
  });
