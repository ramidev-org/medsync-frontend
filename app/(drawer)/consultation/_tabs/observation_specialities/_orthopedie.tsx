import React from "react";
import { BlueField, SelectionCard } from "../_ui";
import { StyleSheet, Text, View } from "react-native";

export type OrthopedicsState = {
  carePath?: string;
  mechanism?: string;
  painSite?: string;
  painScale?: string;
  rangeOfMotion?: string;
  neurovascular?: string;
  imagingSummary?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  rehabPlan?: string;
};

export function OrthopedicsTab({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: OrthopedicsState;
  onChange: (next: OrthopedicsState) => void;
}) {
  const styles = createStyles(theme);
  const set = (p: Partial<OrthopedicsState>) => onChange({ ...value, ...p });
  const careOptions = [
    { key: "pain_control", title: "Controle douleur", icon: "arm-flex", description: "Antalgie et confort fonctionnel." },
    { key: "immobilization", title: "Immobilisation", icon: "bandage", description: "Attelle, orthese ou support." },
    { key: "rehab", title: "Reeducation", icon: "run-fast", description: "Kine et reprise progressive." },
    { key: "procedure", title: "Acte ortho", icon: "bone", description: "Infiltration ou geste cible." },
  ] as const;

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>ORTHOPEDIE</Text>

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
        <Text style={styles.panelHint}>Choix rapide sans widgets pour l'axe de prise en charge.</Text>
      </View>

      <BlueField theme={theme} label="Mecanisme (trauma / douleur chronique)" value={value.mechanism ?? ""} onChange={(v: string) => set({ mechanism: v })} minHeight={56} />
      <View style={styles.row}>
        <BlueField theme={theme} label="Site de la douleur" value={value.painSite ?? ""} onChange={(v: string) => set({ painSite: v })} minHeight={56} />
        <BlueField theme={theme} label="EVA douleur (0-10)" value={value.painScale ?? ""} onChange={(v: string) => set({ painScale: v })} minHeight={56} />
      </View>
      <BlueField theme={theme} label="Amplitude articulaire (ROM)" value={value.rangeOfMotion ?? ""} onChange={(v: string) => set({ rangeOfMotion: v })} minHeight={56} />
      <BlueField theme={theme} label="Statut neurovasculaire distal" value={value.neurovascular ?? ""} onChange={(v: string) => set({ neurovascular: v })} minHeight={56} />
      <BlueField theme={theme} label="Resume imagerie (RX/IRM/echo)" value={value.imagingSummary ?? ""} onChange={(v: string) => set({ imagingSummary: v })} multiline minHeight={88} />
      <BlueField theme={theme} label="Diagnostic orthopedique" value={value.diagnosis ?? ""} onChange={(v: string) => set({ diagnosis: v })} multiline minHeight={88} />
      <BlueField theme={theme} label="Plan de traitement" value={value.treatmentPlan ?? ""} onChange={(v: string) => set({ treatmentPlan: v })} multiline minHeight={88} />
      <BlueField theme={theme} label="Plan de reeducation / suivi" value={value.rehabPlan ?? ""} onChange={(v: string) => set({ rehabPlan: v })} multiline minHeight={88} />
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

export default function OrthopedicsRoute() {
  return null;
}
