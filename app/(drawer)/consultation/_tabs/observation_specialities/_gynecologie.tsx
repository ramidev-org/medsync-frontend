import React from "react";
import { BlueField, SelectionCard } from "../_ui";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type GynecologyState = {
  carePath?: string;
  reason?: string;
  lmpDate?: string;
  cycleDays?: string;
  pregnancyStatus?: string;
  gestationalAgeWeeks?: string;
  gravidityParity?: string;
  redFlags?: string;
  pelvicExam?: string;
  ultrasoundSummary?: string;
  diagnosis?: string;
  planFollowUp?: string;
};

export function GynecologyTab({
  theme,
  onModifyLabel,
  value,
  onChange,
}: {
  theme: any;
  onModifyLabel: () => void;
  value: GynecologyState;
  onChange: (next: GynecologyState) => void;
}) {
  const styles = createStyles(theme);
  const set = (p: Partial<GynecologyState>) => onChange({ ...value, ...p });
  const careOptions = [
    { key: "routine_follow_up", title: "Suivi gyneco", icon: "calendar-heart", description: "Controle gynecologique ou obstetrique." },
    { key: "pregnancy_support", title: "Support grossesse", icon: "baby-face-outline", description: "Supplementation et surveillance." },
    { key: "procedure", title: "Acte gyneco", icon: "needle", description: "Examen ou geste programme." },
    { key: "red_flag_referral", title: "Orientation urgente", icon: "alert-circle-outline", description: "Escalade selon signes d'alerte." },
  ] as const;

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.metaRow}>
        <View style={styles.modeTabs} />
        <TouchableOpacity style={styles.yellowBtn} onPress={onModifyLabel}>
          <Text style={styles.yellowBtnText}>MODIFIER ETIQUETTE</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>GYNECOLOGIE</Text>

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
        <Text style={styles.panelHint}>Selection simple pour guider le parcours gyneco-obstetrique.</Text>
      </View>

      <BlueField theme={theme} label="Motif de consultation" value={value.reason ?? ""} onChange={(v: string) => set({ reason: v })} multiline minHeight={80} />
      <View style={styles.row}>
        <BlueField theme={theme} label="DDR (date)" value={value.lmpDate ?? ""} onChange={(v: string) => set({ lmpDate: v })} minHeight={56} />
        <BlueField theme={theme} label="Cycle (jours)" value={value.cycleDays ?? ""} onChange={(v: string) => set({ cycleDays: v })} minHeight={56} />
      </View>
      <View style={styles.row}>
        <BlueField theme={theme} label="Statut grossesse" value={value.pregnancyStatus ?? ""} onChange={(v: string) => set({ pregnancyStatus: v })} minHeight={56} />
        <BlueField theme={theme} label="Age gestationnel (SA)" value={value.gestationalAgeWeeks ?? ""} onChange={(v: string) => set({ gestationalAgeWeeks: v })} minHeight={56} />
      </View>
      <BlueField theme={theme} label="Gravidite / Parite" value={value.gravidityParity ?? ""} onChange={(v: string) => set({ gravidityParity: v })} minHeight={56} />
      <BlueField theme={theme} label="Signes d'alerte" value={value.redFlags ?? ""} onChange={(v: string) => set({ redFlags: v })} minHeight={56} />
      <BlueField theme={theme} label="Examen pelvien / obstetrical" value={value.pelvicExam ?? ""} onChange={(v: string) => set({ pelvicExam: v })} multiline minHeight={90} />
      <BlueField theme={theme} label="Resume echographie" value={value.ultrasoundSummary ?? ""} onChange={(v: string) => set({ ultrasoundSummary: v })} multiline minHeight={90} />
      <BlueField theme={theme} label="Diagnostic / impression clinique" value={value.diagnosis ?? ""} onChange={(v: string) => set({ diagnosis: v })} multiline minHeight={90} />
      <BlueField theme={theme} label="Plan et suivi" value={value.planFollowUp ?? ""} onChange={(v: string) => set({ planFollowUp: v })} multiline minHeight={90} />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    title: { fontWeight: "900", color: theme.colors.primary },
    row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
    metaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap",
    },
    modeTabs: { flex: 1, minWidth: 230 },
    yellowBtn: {
      backgroundColor: theme.colors.warning,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignSelf: "flex-start",
    },
    yellowBtnText: { fontWeight: "900", color: theme.colors.textOnPrimary, fontSize: 12 },
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

export default function GynecologyRoute() {
  return null;
}
