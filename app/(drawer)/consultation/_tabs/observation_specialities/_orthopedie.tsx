import React from "react";
import { BlueField } from "../_ui";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LocalMode = "form" | "widgets" | "history";

export type OrthopedicsState = {
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
  const [mode, setMode] = React.useState<LocalMode>("form");

  const romTrend = [45, 52, 58, 62, 68];
  const historyRows = [
    "AINS + glace locale - 23/05/2026",
    "Kinesitherapie 2 seances/semaine - 10/05/2026",
    "Attelle fonctionnelle - 26/04/2026",
  ];

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>ORTHOPEDIE</Text>

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

      {mode === "form" ? (
        <>
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
        </>
      ) : null}

      {mode === "widgets" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>ROM progression (5 controles)</Text>
          <View style={styles.chartRow}>
            {romTrend.map((v, idx) => (
              <View key={`${idx}-${v}`} style={styles.chartCol}>
                <View style={[styles.chartBar, { height: 24 + Math.round(v * 1.2) }]} />
                <Text style={styles.chartVal}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.panelHint}>Widget interactif: ajustez EVA, ROM, et plan de reeducation pour le suivi fonctionnel.</Text>
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
    modeTabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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

export default function OrthopedicsRoute() {
  return null;
}
