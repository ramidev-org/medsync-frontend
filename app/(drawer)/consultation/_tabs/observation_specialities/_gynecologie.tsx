import React from "react";
import { BlueField } from "../_ui";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LocalMode = "form" | "widgets" | "history";

export type GynecologyState = {
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
  const [mode, setMode] = React.useState<LocalMode>("form");

  const gaTrend = [8, 12, 16, 20, 24];
  const historyRows = [
    "Supplementation fer + folates - 20/05/2026",
    "Suivi echographique planifie - 05/05/2026",
    "Education signes d'alerte - 21/04/2026",
  ];

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.metaRow}>
        <View style={styles.modeTabs}>
          {[
            { key: "form", label: "Form" },
            { key: "widgets", label: "Widgets / Chart" },
            { key: "history", label: "History Treatments" },
          ].map((tab) => {
            const active = mode === (tab.key as LocalMode);
            return (
              <TouchableOpacity key={tab.key} onPress={() => setMode(tab.key as LocalMode)} style={[styles.modeBtn, active && styles.modeBtnActive]}>
                <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.yellowBtn} onPress={onModifyLabel}>
          <Text style={styles.yellowBtnText}>MODIFIER ETIQUETTE</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>GYNECOLOGIE</Text>

      {mode === "form" ? (
        <>
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
        </>
      ) : null}

      {mode === "widgets" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Age gestationnel (SA) - progression</Text>
          <View style={styles.chartRow}>
            {gaTrend.map((v, idx) => (
              <View key={`${idx}-${v}`} style={styles.chartCol}>
                <View style={[styles.chartBar, { height: 22 + Math.round(v * 3.5) }]} />
                <Text style={styles.chartVal}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.panelHint}>Widget interactif: adaptez statut grossesse, SA, et red flags pour prioriser le suivi.</Text>
        </View>
      ) : null}

      {mode === "history" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Historique des traitements</Text>
          {historyRows.map((row) => (
            <View key={row} style={styles.historyItem}>
              <Text style={styles.historyText}>{row}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
    modeTabs: { flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1, minWidth: 230 },
    modeBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    modeBtnActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    modeBtnText: { fontSize: 12, fontWeight: "800", color: theme.colors.textSecondary },
    modeBtnTextActive: { color: theme.colors.primary },
    yellowBtn: {
      backgroundColor: "#F5B301",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignSelf: "flex-start",
    },
    yellowBtnText: { fontWeight: "900", color: "#fff", fontSize: 12 },
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
    chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, minHeight: 140 },
    chartCol: { alignItems: "center", gap: 4 },
    chartBar: { width: 22, borderRadius: 8, backgroundColor: theme.colors.primary },
    chartVal: { fontSize: 11, fontWeight: "800", color: theme.colors.textSecondary },
    historyItem: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 10,
      backgroundColor: theme.colors.background,
    },
    historyText: { fontWeight: "700", color: theme.colors.text },
  });

export default function GynecologyRoute() {
  return null;
}
