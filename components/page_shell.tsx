import React, { type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View, type ScrollViewProps, type ViewStyle } from "react-native";
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";

type Props = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentStyle?: ViewStyle;
  refreshControl?: ScrollViewProps["refreshControl"];
};

export function PageShell({ title, subtitle, actions, children, contentStyle, refreshControl }: Props) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <ScrollView
        contentContainerStyle={[styles.container, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {(!!title || !!subtitle || !!actions) && (
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              {!!title && <Text style={styles.title}>{title}</Text>}
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {!!actions && <View style={styles.actions}>{actions}</View>}
          </View>
          </View>
        )}

        {children}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 34,
      ...(Platform.OS === "web"
        ? ({
            maxWidth: 1280,
            width: "100%",
            alignSelf: "center",
          } as any)
        : null),
    },
    headerCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 14,
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0px 8px 24px rgba(15,23,42,0.05)",
          } as any)
        : null),
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    title: { fontSize: 24, fontWeight: "900", color: theme.colors.text },
    subtitle: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 },
    actions: { flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" },
  });
