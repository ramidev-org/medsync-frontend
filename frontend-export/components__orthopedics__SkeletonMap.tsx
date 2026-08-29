import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle, Line, Path } from "react-native-svg";
import type { OrthoJoint } from "./types";

const VIEWBOX_W = 100;
const VIEWBOX_H = 200;

type JointDef = { id: OrthoJoint; label: string; short: string; x: number; y: number };

const JOINTS: JointDef[] = [
  { id: "neck", label: "Neck", short: "N", x: 50, y: 24 },
  { id: "shoulder_left", label: "Left shoulder", short: "LS", x: 36, y: 40 },
  { id: "shoulder_right", label: "Right shoulder", short: "RS", x: 64, y: 40 },
  { id: "elbow_left", label: "Left elbow", short: "LE", x: 28, y: 70 },
  { id: "elbow_right", label: "Right elbow", short: "RE", x: 72, y: 70 },
  { id: "wrist_left", label: "Left wrist", short: "LW", x: 22, y: 98 },
  { id: "wrist_right", label: "Right wrist", short: "RW", x: 78, y: 98 },
  { id: "hip_left", label: "Left hip", short: "LH", x: 44, y: 104 },
  { id: "hip_right", label: "Right hip", short: "RH", x: 56, y: 104 },
  { id: "knee_left", label: "Left knee", short: "LK", x: 44, y: 140 },
  { id: "knee_right", label: "Right knee", short: "RK", x: 56, y: 140 },
  { id: "ankle_left", label: "Left ankle", short: "LA", x: 44, y: 178 },
  { id: "ankle_right", label: "Right ankle", short: "RA", x: 56, y: 178 },
];

export function SkeletonMap({
  theme,
  selected,
  onSelect,
}: {
  theme: any;
  selected: OrthoJoint | null;
  onSelect: (next: OrthoJoint) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const current = selected ? JOINTS.find((joint) => joint.id === selected) : null;

  const onTapCanvas = (x: number, y: number) => {
    const hit = JOINTS.reduce<{ id: OrthoJoint; d: number } | null>((best, joint) => {
      const dx = joint.x - x;
      const dy = joint.y - y;
      const d = dx * dx + dy * dy;
      if (!best || d < best.d) return { id: joint.id, d };
      return best;
    }, null);
    if (hit && hit.d <= 13 * 13) onSelect(hit.id);
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.titleRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="bone" size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Skeleton map</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <MaterialCommunityIcons name="check-decagram-outline" size={13} color={theme.colors.textSecondary} />
          <Text style={styles.metaText}>{current?.label ?? "No joint selected"}</Text>
        </View>
      </View>

      <View style={styles.canvasWrap}>
        <Svg width="100%" height={520} viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
          <Path d="M50 8 C42 8 36.5 13.5 36.5 21 C36.5 29 42 34.5 50 34.5 C58 34.5 63.5 29 63.5 21 C63.5 13.5 58 8 50 8 Z" fill={theme.colors.background} stroke={theme.colors.border} strokeWidth={1.2} />
          <Line x1="36" y1="40" x2="64" y2="40" stroke={theme.colors.border} strokeWidth="2" />
          <Line x1="50" y1="34" x2="50" y2="108" stroke={theme.colors.border} strokeWidth="2" />
          <Line x1="36" y1="40" x2="28" y2="70" stroke={theme.colors.border} strokeWidth="2" />
          <Line x1="64" y1="40" x2="72" y2="70" stroke={theme.colors.border} strokeWidth="2" />
          <Line x1="28" y1="70" x2="22" y2="98" stroke={theme.colors.border} strokeWidth="2" />
          <Line x1="72" y1="70" x2="78" y2="98" stroke={theme.colors.border} strokeWidth="2" />
          <Line x1="44" y1="104" x2="44" y2="178" stroke={theme.colors.border} strokeWidth="2" />
          <Line x1="56" y1="104" x2="56" y2="178" stroke={theme.colors.border} strokeWidth="2" />
          <Line x1="44" y1="104" x2="56" y2="104" stroke={theme.colors.border} strokeWidth="2" />

          {JOINTS.map((joint) => {
            const active = selected === joint.id;
            return (
              <Circle
                key={joint.id}
                cx={joint.x}
                cy={joint.y}
                r={joint.id === "neck" ? 4.5 : 4}
                fill={active ? theme.colors.primary : theme.colors.textSecondary}
                stroke={theme.colors.surface}
                strokeWidth={1.8}
              />
            );
          })}
        </Svg>
        <SkeletonPressLayer onTap={onTapCanvas} />
      </View>

      <View style={styles.chipGrid}>
        {JOINTS.map((joint) => {
          const active = selected === joint.id;
          return (
            <Pressable
              key={joint.id}
              onPress={() => onSelect(joint.id)}
              style={[
                styles.jointChip,
                {
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                },
              ]}
            >
              <Text style={[styles.jointChipText, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
                {joint.short}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SkeletonPressLayer({ onTap }: { onTap: (x: number, y: number) => void }) {
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 1, h: 1 });
  return (
    <Pressable
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width || 1, h: e.nativeEvent.layout.height || 1 })}
      onPress={(e) => {
        const x = (e.nativeEvent.locationX / size.w) * VIEWBOX_W;
        const y = (e.nativeEvent.locationY / size.h) * VIEWBOX_H;
        onTap(x, y);
      }}
      style={StyleSheet.absoluteFill}
    />
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    title: { fontWeight: "700", color: theme.colors.text },
    metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      backgroundColor: theme.colors.background,
    },
    metaText: { fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 },
    canvasWrap: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      position: "relative",
    },
    chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    jointChip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
      minWidth: 42,
      alignItems: "center",
    },
    jointChipText: { fontWeight: "700", fontSize: 11 },
  });

