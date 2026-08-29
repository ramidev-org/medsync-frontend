import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { type OdontogramState, type ProcedureKey } from "@/components/dentistry/odontogram";
import { BlueField, SelectionCard } from "../_ui";

export type DentistryState = {
  visitIntent?: string;
  activeProcedure?: ProcedureKey;
  selectedTeeth?: string[];
  odontogram?: OdontogramState;
  xrays?: string[];
  treatedArea?: string;
  painLevel?: string;
  chairsideNotes?: string;
};

export function DentistryTab({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: DentistryState;
  onChange: (next: DentistryState) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const set = (p: Partial<DentistryState>) => onChange({ ...value, ...p });

  const intentOptions = [
    { key: "preventive_care", icon: "toothbrush", title: "Soin preventif", description: "Detartrage, hygiene et prevention." },
    { key: "restorative_care", icon: "tooth-outline", title: "Soin restaurateur", description: "Obturation, reparation ou reconstruction." },
    { key: "pain_management", icon: "emoticon-sad-outline", title: "Gestion douleur", description: "Urgence, soulagement et temporisation." },
    { key: "prosthetic_follow_up", icon: "hammer-wrench", title: "Prothese / controle", description: "Ajustement et prochaine seance." },
  ] as const;

  return (
    <ScrollView contentContainerStyle={{ gap: 12 }}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>Dentistry</Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Selection du traitement</Text>
        <View style={styles.cardGrid}>
          {intentOptions.map((option) => (
            <SelectionCard
              key={option.key}
              theme={theme}
              icon={option.icon}
              title={option.title}
              description={option.description}
              active={value.visitIntent === option.key}
              onPress={() => set({ visitIntent: option.key })}
            />
          ))}
        </View>
        <Text style={styles.panelHint}>Les widgets de dents sont retires ici pour une saisie plus simple et rapide.</Text>
      </View>

      <View style={styles.row}>
        <BlueField
          theme={theme}
          label="Zone / dent concernee"
          value={value.treatedArea ?? ""}
          onChange={(next: string) => set({ treatedArea: next })}
          minHeight={56}
        />
        <BlueField
          theme={theme}
          label="Douleur / sensibilite"
          value={value.painLevel ?? ""}
          onChange={(next: string) => set({ painLevel: next })}
          minHeight={56}
        />
      </View>
      <BlueField
        theme={theme}
        label="Procedure principale"
        value={value.activeProcedure ?? ""}
        onChange={(next: string) => set({ activeProcedure: next as ProcedureKey })}
        minHeight={56}
      />
      <BlueField
        theme={theme}
        label="Notes cliniques au fauteuil"
        value={value.chairsideNotes ?? ""}
        onChange={(next: string) => set({ chairsideNotes: next })}
        multiline
        minHeight={96}
      />
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    title: { fontWeight: "700" },
    row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
    panel: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      padding: 12,
      gap: 10,
    },
    panelTitle: { fontWeight: "700", color: theme.colors.text },
    panelHint: { fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 },
    cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  });

export default function DentistryRoute() {
  return null;
}
