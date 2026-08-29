import React, { type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View, type ScrollViewProps, type ViewStyle } from "react-native";
import { TopBar } from "@/components/layout/top_bar";
import { PAGE_GUTTER, getWebContainerFill } from "@/theme/layout";
import { useTheme } from "@/theme/theme_provider";

type Props = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentStyle?: ViewStyle;
  refreshControl?: ScrollViewProps["refreshControl"];
  scrollable?: boolean;
  hideTopBar?: boolean;
};

export function PageShell({ title, subtitle, actions, children, contentStyle, refreshControl, scrollable = true, hideTopBar = false }: Props) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      {!hideTopBar ? <TopBar theme={theme} /> : null}

      {scrollable ? (
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
      ) : (
        <View style={[styles.containerStatic, contentStyle]}>
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
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: {
      paddingHorizontal: PAGE_GUTTER,
      paddingTop: 18,
      paddingBottom: 34,
      ...getWebContainerFill(),
    },
    containerStatic: {
      flex: 1,
      paddingHorizontal: PAGE_GUTTER,
      paddingTop: 18,
      paddingBottom: 14,
      ...getWebContainerFill(),
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
    title: { fontSize: 24, fontWeight: "700", color: theme.colors.text },
    subtitle: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 },
    actions: { flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" },
  });
