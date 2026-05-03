import React from "react";
import { View } from "react-native";
import { TextArea, TextField } from "@/components/input_fields";

export function DermatologyAssessmentForm({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: { diagnosis?: string; plan?: string; followUp?: string };
  onChange: (next: { diagnosis?: string; plan?: string; followUp?: string }) => void;
}) {
  return (
    <View style={{ gap: 2 }}>
      <TextField label="Working diagnosis" value={value.diagnosis ?? ""} onChangeText={(diagnosis) => onChange({ ...value, diagnosis })} prefixIcon="medkit-outline" placeholder="e.g. atopic dermatitis" />
      <TextArea label="Plan" value={value.plan ?? ""} onChangeText={(plan) => onChange({ ...value, plan })} prefixIcon="list-outline" rows={4} placeholder="Treatments, counseling, labs, etc." />
      <TextArea label="Follow-up" value={value.followUp ?? ""} onChangeText={(followUp) => onChange({ ...value, followUp })} prefixIcon="calendar-outline" rows={3} placeholder="e.g. 2–4 weeks, red flags..." />
    </View>
  );
}

