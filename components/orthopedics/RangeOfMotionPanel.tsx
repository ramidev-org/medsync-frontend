import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { OrthoJoint, RangeOfMotion } from "./types";

const JOINT_LABEL: Record<OrthoJoint, string> = {
  neck: "Neck",
  shoulder_left: "Left shoulder",
  shoulder_right: "Right shoulder",
  elbow_left: "Left elbow",
  elbow_right: "Right elbow",
  wrist_left: "Left wrist",
  wrist_right: "Right wrist",
  hip_left: "Left hip",
  hip_right: "Right hip",
  knee_left: "Left knee",
  knee_right: "Right knee",
  ankle_left: "Left ankle",
  ankle_right: "Right ankle",
};

function toNum(v: string): number | null {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function normalRangesForJoint(joint: OrthoJoint) {
  if (joint.includes("knee")) return "Knee typical: flexion 130 deg, extension 0 deg";
  if (joint.includes("shoulder")) return "Shoulder typical: flexion 180 deg, abduction 180 deg";
  if (joint.includes("elbow")) return "Elbow typical: flexion 145 deg, extension 0 deg";
  if (joint.includes("hip")) return "Hip typical: flexion 120 deg, extension 20 deg";
  if (joint.includes("ankle")) return "Ankle typical: flexion 50 deg, extension 20 deg";
  return "Use clinic protocol for normal values.";
}

export function RangeOfMotionPanel({
  theme,
  joint,
  value,
  onChange,
}: {
  theme: any;
  joint: OrthoJoint;
  value: RangeOfMotion | null;
  onChange: (next: RangeOfMotion) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const v = value ?? { joint };
  const normalHint = normalRangesForJoint(joint);

  const set = (p: Partial<RangeOfMotion>) => onChange({ ...v, ...p, joint });

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.titleRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="ruler-square-compass" size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Range of motion</Text>
      </View>

      <View style={styles.metaChip}>
        <MaterialCommunityIcons name="arm-flex-outline" size={13} color={theme.colors.textSecondary} />
        <Text style={styles.metaText}>{JOINT_LABEL[joint]}</Text>
      </View>

      <View style={styles.grid}>
        <Field theme={theme} label="Flexion (deg)" value={v.flexionDeg} onChange={(n) => set({ flexionDeg: n })} />
        <Field theme={theme} label="Extension (deg)" value={v.extensionDeg} onChange={(n) => set({ extensionDeg: n })} />
        <Field theme={theme} label="Abduction (deg)" value={v.abductionDeg} onChange={(n) => set({ abductionDeg: n })} />
        <Field theme={theme} label="Adduction (deg)" value={v.adductionDeg} onChange={(n) => set({ adductionDeg: n })} />
      </View>

      <View style={styles.hintCard}>
        <MaterialCommunityIcons name="information-outline" size={14} color={theme.colors.textSecondary} />
        <Text style={styles.hintText}>{normalHint}</Text>
      </View>

      <View>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={v.note ?? ""}
          onChangeText={(t) => set({ note: t })}
          placeholder="Optional..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { minHeight: 84 }]}
          multiline
        />
      </View>
    </View>
  );
}

function Field({
  theme,
  label,
  value,
  onChange,
}: {
  theme: any;
  label: string;
  value?: number | null;
  onChange: (next: number | null) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={{ flex: 1, minWidth: 180 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value === null || value === undefined ? "" : String(value)}
        onChangeText={(t) => onChange(toNum(t))}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
      />
    </View>
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
    title: { fontWeight: "900", color: theme.colors.text },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      backgroundColor: theme.colors.background,
    },
    metaText: { fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    label: { fontWeight: "800", color: theme.colors.textSecondary, marginTop: 6 },
    input: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontWeight: "800",
      color: theme.colors.text,
    },
    hintCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: theme.colors.background,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    hintText: { fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 },
  });

