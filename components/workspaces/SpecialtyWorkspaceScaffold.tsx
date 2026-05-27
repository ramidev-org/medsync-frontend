import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

type StatItem = {
  label: string;
  value: string;
  tone?: "blue" | "green" | "orange";
};

type Props = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  stats: StatItem[];
  children: ReactNode;
  theme: any;
};

export function SpecialtyWorkspaceScaffold({
  title,
  subtitle,
  icon,
  stats,
  children,
  theme,
}: Props) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.heroWrap}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroLeft}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={icon} size={20} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            {stats.map((s, idx) => {
              const tone = s.tone ?? "blue";
              return (
                <View
                  key={`${s.label}-${idx}`}
                  style={[
                    styles.statItem,
                    tone === "green" ? styles.statGreen : tone === "orange" ? styles.statOrange : styles.statBlue,
                  ]}
                >
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.contentCard}>{children}</View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    wrap: {
      gap: 14,
      marginTop: 10,
      marginBottom: 8,
    },
    heroWrap: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      overflow: "hidden",
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0 12px 26px rgba(15,23,42,0.11)",
          } as any)
        : null),
    },
    heroCard: {
      padding: 16,
      gap: 14,
      backgroundColor: theme.colors.surface,
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      flexWrap: "wrap",
    },
    heroLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      flex: 1,
      minWidth: 260,
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: "#EFF6FF",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "900",
    },
    subtitle: {
      marginTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.99 }],
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
    },
    statItem: {
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minWidth: 130,
      flex: 1,
    },
    statBlue: { backgroundColor: "#EFF6FF" },
    statGreen: { backgroundColor: "#ECFDF5" },
    statOrange: { backgroundColor: "#FFF7ED" },
    statValue: {
      color: "#0F172A",
      fontSize: 18,
      fontWeight: "900",
    },
    statLabel: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    contentCard: {
      borderWidth: 0,
      borderRadius: 20,
      backgroundColor: "transparent",
      padding: 0,
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "none",
          } as any)
        : null),
    },
  });
