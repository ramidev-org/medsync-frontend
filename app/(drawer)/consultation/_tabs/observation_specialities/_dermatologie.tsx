import React from "react";
import { BlueField, SelectionCard } from "../_ui";
import { StyleSheet, Text, View } from "react-native";

export type DermatologyState = {
  carePath?: string;
  chiefComplaint?: string;
  lesionSite?: string;
  morphology?: string;
  sizeMm?: string;
  color?: string;
  border?: string;
  asymmetry?: string;
  evolution?: string;
  symptoms?: string;
  dermoscopy?: string;
  biopsyDecision?: string;
  differential?: string;
  plan?: string;
};

export function DermatologyTab({
  theme,
  value,
  onChange,
  showTitle = true,
}: {
  theme: any;
  value: DermatologyState;
  onChange: (next: DermatologyState) => void;
  showTitle?: boolean;
}) {
  const styles = createStyles(theme);
  const set = (p: Partial<DermatologyState>) => onChange({ ...value, ...p });
  const careOptions = [
    { key: "topical_care", title: "Soin topique", icon: "medical-bag", description: "Traitement local et apaisement cutane." },
    { key: "systemic_treatment", title: "Systemique", icon: "pill", description: "Prescription orale ou injectable." },
    { key: "biopsy_follow_up", title: "Biopsie / bilan", icon: "microscope", description: "Prelevement ou bilan associe." },
    { key: "skin_monitoring", title: "Surveillance", icon: "image-search-outline", description: "Evolution et controle dermatologique." },
  ] as const;

  return (
    <View style={{ gap: 12 }}>
      {showTitle ? <Text style={styles.title}>DERMATOLOGIE</Text> : null}

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
        <Text style={styles.panelHint}>Selection rapide pour cadrer le traitement sans widgets.</Text>
      </View>

      <BlueField theme={theme} label="Plainte principale" value={value.chiefComplaint ?? ""} onChange={(v: string) => set({ chiefComplaint: v })} multiline minHeight={80} />
      <View style={styles.row}>
        <BlueField theme={theme} label="Site lesionnel" value={value.lesionSite ?? ""} onChange={(v: string) => set({ lesionSite: v })} minHeight={56} />
        <BlueField theme={theme} label="Morphologie" value={value.morphology ?? ""} onChange={(v: string) => set({ morphology: v })} minHeight={56} />
      </View>
      <View style={styles.row}>
        <BlueField theme={theme} label="Taille (mm)" value={value.sizeMm ?? ""} onChange={(v: string) => set({ sizeMm: v })} minHeight={56} />
        <BlueField theme={theme} label="Couleur" value={value.color ?? ""} onChange={(v: string) => set({ color: v })} minHeight={56} />
      </View>
      <View style={styles.row}>
        <BlueField theme={theme} label="Bordure" value={value.border ?? ""} onChange={(v: string) => set({ border: v })} minHeight={56} />
        <BlueField theme={theme} label="Asymetrie" value={value.asymmetry ?? ""} onChange={(v: string) => set({ asymmetry: v })} minHeight={56} />
      </View>
      <BlueField theme={theme} label="Evolution" value={value.evolution ?? ""} onChange={(v: string) => set({ evolution: v })} minHeight={56} />
      <BlueField theme={theme} label="Symptomes associes" value={value.symptoms ?? ""} onChange={(v: string) => set({ symptoms: v })} minHeight={56} />
      <BlueField theme={theme} label="Dermoscopie" value={value.dermoscopy ?? ""} onChange={(v: string) => set({ dermoscopy: v })} multiline minHeight={88} />
      <BlueField theme={theme} label="Decision biopsie / histologie" value={value.biopsyDecision ?? ""} onChange={(v: string) => set({ biopsyDecision: v })} minHeight={56} />
      <BlueField theme={theme} label="Diagnostic differentiel" value={value.differential ?? ""} onChange={(v: string) => set({ differential: v })} multiline minHeight={80} />
      <BlueField theme={theme} label="Plan therapeutique" value={value.plan ?? ""} onChange={(v: string) => set({ plan: v })} multiline minHeight={90} />
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

export default function DermatologyRoute() {
  return null;
}
