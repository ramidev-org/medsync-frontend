import React, { type ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function WorkspaceHero({
  theme,
  title,
  subtitle,
  badge,
  icon,
}: {
  theme: any;
  title: string;
  subtitle: string;
  badge?: string;
  icon?: ReactNode;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.heroWrap}>
      <LinearGradient
        colors={[`${theme.colors.primary}20`, `${theme.colors.primary}08`, theme.colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {!!badge && (
          <View style={styles.badge}>
            {icon ? <View style={styles.badgeIcon}>{icon}</View> : null}
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );
}

export function WorkspaceSurface({
  theme,
  title,
  subtitle,
  children,
}: {
  theme: any;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.surface}>
      {(!!title || !!subtitle) && (
        <View style={{ marginBottom: 12 }}>
          {!!title && <Text style={styles.surfaceTitle}>{title}</Text>}
          {!!subtitle && <Text style={styles.surfaceSubtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    heroWrap: {
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0px 16px 34px rgba(15,23,42,0.09)",
          } as any)
        : null),
    },
    hero: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      gap: 4,
    },
    badge: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: `${theme.colors.primary}50`,
      backgroundColor: `${theme.colors.primary}16`,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginBottom: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    badgeIcon: { opacity: 0.95 },
    badgeText: {
      color: theme.colors.primary,
      fontWeight: "900",
      fontSize: 11,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    title: { fontSize: 29, fontWeight: "900", color: theme.colors.text, letterSpacing: 0.2 },
    subtitle: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 },

    surface: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      padding: 14,
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0px 10px 26px rgba(15,23,42,0.06)",
          } as any)
        : null),
    },
    surfaceTitle: { fontWeight: "900", color: theme.colors.text, fontSize: 18 },
    surfaceSubtitle: { marginTop: 4, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 },
  });
