import React from "react";
import { View } from "react-native";
import { Dropdown, TextArea, TextField } from "@/components/common/input_fields";

const REGIONS = [
  "Scalp",
  "Face",
  "Neck",
  "Chest",
  "Back",
  "Abdomen",
  "Upper limb",
  "Lower limb",
  "Hands",
  "Feet",
  "Other",
] as const;

export function DermatologyIntakeForm({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: { side: "front" | "back"; region: string; chiefComplaint: string; notes?: string };
  onChange: (next: { side: "front" | "back"; region: string; chiefComplaint: string; notes?: string }) => void;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Dropdown
        label="Body side"
        value={value.side}
        options={["front", "back"]}
        onChange={(side) => onChange({ ...value, side: side as any })}
        prefixIcon="body-outline"
      />
      <Dropdown label="Primary region" value={value.region} options={[...REGIONS]} onChange={(region) => onChange({ ...value, region })} prefixIcon="map-outline" />
      <TextField label="Primary concern" value={value.chiefComplaint} onChangeText={(chiefComplaint) => onChange({ ...value, chiefComplaint })} prefixIcon="chatbubble-ellipses-outline" placeholder="e.g. pruritic rash × 2 weeks" />
      <TextArea label="Exam notes" value={value.notes ?? ""} onChangeText={(notes) => onChange({ ...value, notes })} prefixIcon="document-text-outline" placeholder="Inspection, palpation, distribution..." />
    </View>
  );
}
