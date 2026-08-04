import React from "react";
import { BlueField, SelectionCard } from "../_ui";
import { StyleSheet, Text, View } from "react-native";

export type CardiologyState = {
  carePath?: string;
  chestPain?: string;
  dyspnea?: string;
  palpitations?: string;
  syncope?: string;
  edema?: string;
  riskFactors?: string;
  bloodPressure?: string;
  heartRate?: string;
  ecgSummary?: string;
  echoSummary?: string;
  troponin?: string;
  assessmentPlan?: string;
};

export function CardiologyTab({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: CardiologyState;
  onChange: (next: CardiologyState) => void;
}) {
  const styles = createStyles(theme);
  const set = (p: Partial<CardiologyState>) => onChange({ ...value, ...p });
  const careOptions = [
    { key: "hemodynamic_follow_up", title: "Suivi hemodynamique", icon: "heart-pulse", description: "TA, FC et surveillance clinique." },
    { key: "therapy_adjustment", title: "Ajustement therapie", icon: "pill-multiple", description: "Traitement cardiovasculaire a adapter." },
    { key: "cardiac_workup", title: "Bilan cardiaque", icon: "heart-cog", description: "ECG, echo ou bilan complementaire." },
    { key: "urgent_referral", title: "Orientation rapide", icon: "ambulance", description: "Avis specialise ou prise en charge urgente." },
  ] as const;

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>CARDIOLOGIE</Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Orientation du traitement</Text>
        <View style={styles.cardGrid}>
          {careOptions.map((option) => (
            <SelectionCard
              key={option.key}
              theme={theme}
              icon={option.icon}
              title={option.title}
              description={option.description}
              active={value.carePath === option.key}
              onPress={() => set({ carePath: option.key })}
            />
          ))}
        </View>
        <Text style={styles.panelHint}>Selection rapide sans widgets pour cadrer le plan cardio.</Text>
      </View>

      <View style={styles.row}>
        <BlueField theme={theme} label="Douleur thoracique" value={value.chestPain ?? ""} onChange={(v: string) => set({ chestPain: v })} minHeight={56} />
        <BlueField theme={theme} label="Dyspnee" value={value.dyspnea ?? ""} onChange={(v: string) => set({ dyspnea: v })} minHeight={56} />
      </View>
      <View style={styles.row}>
        <BlueField theme={theme} label="Palpitations" value={value.palpitations ?? ""} onChange={(v: string) => set({ palpitations: v })} minHeight={56} />
        <BlueField theme={theme} label="Syncope" value={value.syncope ?? ""} onChange={(v: string) => set({ syncope: v })} minHeight={56} />
      </View>
      <View style={styles.row}>
        <BlueField theme={theme} label="Oedemes" value={value.edema ?? ""} onChange={(v: string) => set({ edema: v })} minHeight={56} />
        <BlueField theme={theme} label="Facteurs de risque CV" value={value.riskFactors ?? ""} onChange={(v: string) => set({ riskFactors: v })} minHeight={56} />
      </View>
      <View style={styles.row}>
        <BlueField theme={theme} label="TA" value={value.bloodPressure ?? ""} onChange={(v: string) => set({ bloodPressure: v })} minHeight={56} />
        <BlueField theme={theme} label="Frequence cardiaque" value={value.heartRate ?? ""} onChange={(v: string) => set({ heartRate: v })} minHeight={56} />
      </View>
      <BlueField theme={theme} label="Resume ECG" value={value.ecgSummary ?? ""} onChange={(v: string) => set({ ecgSummary: v })} multiline minHeight={88} />
      <BlueField theme={theme} label="Resume echographie cardiaque" value={value.echoSummary ?? ""} onChange={(v: string) => set({ echoSummary: v })} multiline minHeight={88} />
      <BlueField theme={theme} label="Troponine / biomarqueurs" value={value.troponin ?? ""} onChange={(v: string) => set({ troponin: v })} minHeight={56} />
      <BlueField theme={theme} label="Evaluation et plan" value={value.assessmentPlan ?? ""} onChange={(v: string) => set({ assessmentPlan: v })} multiline minHeight={100} />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    title: { fontWeight: "900", color: theme.colors.primary },
    row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
    panel: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      padding: 12,
      gap: 10,
    },
    panelTitle: { fontWeight: "900", color: theme.colors.text },
    panelHint: { fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 },
    cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  });

export default function CardiologyRoute() {
  return null;
}
