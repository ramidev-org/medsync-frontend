import React from "react";
import { StyleSheet, View } from "react-native";
import { MotiView } from "moti";
import { useTheme } from "@/theme/theme_provider";

type SkeletonBlockProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: any;
};

/** A single shimmering placeholder block. Pulses opacity in a loop - cheap,
 * cross-platform (web + native), no extra deps beyond moti. */
export function SkeletonBlock({ width = "100%", height = 14, borderRadius = 6, style }: SkeletonBlockProps) {
  const { theme } = useTheme();
  return (
    <MotiView
      style={[{ width, height, borderRadius, backgroundColor: theme.colors.surfaceVariant }, style]}
      from={{ opacity: 0.45 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 750, loop: true, repeatReverse: true }}
    />
  );
}

/** Generic list/table loading placeholder: a few rows shaped like
 * avatar + title + subtitle, used by DataState in place of a bare spinner. */
export function SkeletonListLoader({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.row}>
          <SkeletonBlock width={44} height={44} borderRadius={12} />
          <View style={styles.lines}>
            <SkeletonBlock width={`${45 + ((index * 13) % 35)}%`} height={13} />
            <SkeletonBlock width={`${25 + ((index * 17) % 25)}%`} height={11} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12, paddingHorizontal: 16, gap: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  lines: { flex: 1 },
});
