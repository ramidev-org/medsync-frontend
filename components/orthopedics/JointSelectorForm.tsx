import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Dropdown, TextArea } from "@/components/input_fields";
import type { OrthoJoint } from "./types";

const JOINTS: { id: OrthoJoint; label: string }[] = [
  { id: "neck", label: "Neck" },
  { id: "shoulder_left", label: "Left shoulder" },
  { id: "shoulder_right", label: "Right shoulder" },
  { id: "elbow_left", label: "Left elbow" },
  { id: "elbow_right", label: "Right elbow" },
  { id: "wrist_left", label: "Left wrist" },
  { id: "wrist_right", label: "Right wrist" },
  { id: "hip_left", label: "Left hip" },
  { id: "hip_right", label: "Right hip" },
  { id: "knee_left", label: "Left knee" },
  { id: "knee_right", label: "Right knee" },
  { id: "ankle_left", label: "Left ankle" },
  { id: "ankle_right", label: "Right ankle" },
];

export function JointSelectorForm({
  theme,
  selected,
  note,
  onSelect,
  onChangeNote,
}: {
  theme: any;
  selected: OrthoJoint;
  note: string;
  onSelect: (next: OrthoJoint) => void;
  onChangeNote: (next: string) => void;
}) {
  const selectedLabel = JOINTS.find((j) => j.id === selected)?.label ?? JOINTS[0]!.label;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border }}>
            <MaterialCommunityIcons name="flask-outline" size={16} color={theme.colors.primary} />
          </View>
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>Joint selection</Text>
        </View>
        <Dropdown
          label="Joint"
          value={selectedLabel}
          options={JOINTS.map((j) => j.label)}
          onChange={(label) => {
            const picked = JOINTS.find((j) => j.label === label)?.id ?? selected;
            onSelect(picked);
          }}
          prefixIcon="walk-outline"
        />
        <TextArea label="Exam note" value={note} onChangeText={onChangeNote} prefixIcon="document-text-outline" rows={3} placeholder="Inspection, palpation, swelling, instability..." />
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ fontWeight: "900", color: theme.colors.text }}>Quick pick</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {JOINTS.map((j) => {
            const active = j.id === selected;
            return (
              <Pressable
                key={j.id}
                onPress={() => onSelect(j.id)}
                style={{
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontWeight: "900", fontSize: 12, color: active ? theme.colors.primary : theme.colors.textSecondary }}>{j.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
