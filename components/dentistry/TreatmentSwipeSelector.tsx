import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type TreatmentSwipeOption<T extends string> = {
  key: T;
  label: string;
  tag?: string;
  shortLabel?: string;
  description?: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accentColor: string;
};

export function TreatmentSwipeSelector<T extends string>({
  theme,
  options,
  value,
  onChange,
}: {
  theme: any;
  options: TreatmentSwipeOption<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.shell}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>Treatment</Text>
        <Text style={styles.title}>Choose the treatment</Text>
      </View>

      <View style={styles.grid}>
        {options.map((option) => {
          const active = option.key === value;

          return (
            <TouchableOpacity
              key={option.key}
              activeOpacity={0.92}
              onPress={() => onChange(option.key)}
              style={[
                styles.card,
                active && styles.cardActive,
                {
                  borderColor: active ? option.accentColor : theme.colors.border,
                  backgroundColor: active
                    ? `${option.accentColor}10`
                    : theme.colors.surface,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconHalo,
                    {
                      backgroundColor: `${option.accentColor}16`,
                      borderColor: `${option.accentColor}2B`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={30}
                    color={option.accentColor}
                  />
                </View>

                {option.tag ? (
                  <View
                    style={[
                      styles.tagPill,
                      { borderColor: `${option.accentColor}24` },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: option.accentColor }]}>
                      {option.tag}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.cardLabel}>
                {option.shortLabel ?? option.label}
              </Text>

              {!!option.description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {option.description}
                </Text>
              ) : null}

              {active ? (
                <View
                  style={[
                    styles.selectedPill,
                    { backgroundColor: option.accentColor },
                  ]}
                >
                  <Text style={styles.selectedPillText}>Selected</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    shell: {
      gap: 12,
    },
    headerRow: {
      gap: 4,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.colors.primary,
    },
    title: {
      fontSize: 18,
      fontWeight: "900",
      color: theme.colors.text,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      flexGrow: 1,
      flexBasis: 220,
      minHeight: 156,
      borderRadius: 20,
      borderWidth: 1.5,
      padding: 14,
      gap: 10,
      backgroundColor: theme.colors.surface,
    },
    cardActive: {
      shadowColor: "#0f172a",
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
    },
    iconHalo: {
      width: 58,
      height: 58,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    tagPill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: theme.colors.background,
    },
    tagText: {
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    cardLabel: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "900",
      color: theme.colors.text,
    },
    cardDescription: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700",
      color: theme.colors.textSecondary,
    },
    selectedPill: {
      alignSelf: "flex-start",
      marginTop: "auto",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    selectedPillText: {
      color: theme.colors.textOnPrimary,
      fontWeight: "900",
      fontSize: 12,
    },
  });
