import React from "react";
import { BlueField } from "../_ui";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LocalMode = "form" | "widgets" | "history";

export type CardiologyState = {
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
  const [mode, setMode] = React.useState<LocalMode>("form");

  const bpTrend = [124, 132, 128, 136, 130];
  const maxBp = Math.max(...bpTrend, 140);
  const historyRows = [
    "Anti-hypertenseur ajuste - 26/05/2026",
    "Controle ECG - 14/05/2026",
    "Education regime pauvre en sel - 02/05/2026",
  ];

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.title}>CARDIOLOGIE</Text>

      <View style={styles.modeTabs}>
        {[
          { key: "form", label: "Form" },
          { key: "widgets", label: "Widgets / Chart" },
          { key: "history", label: "History Treatments" },
        ].map((tab) => {
          const active = mode === (tab.key as LocalMode);
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setMode(tab.key as LocalMode)}
              style={[styles.modeBtn, active && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {mode === "form" ? (
        <>
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
        </>
      ) : null}

      {mode === "widgets" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Tension arterielle (5 dernieres mesures)</Text>
          <View style={styles.chartRow}>
            {bpTrend.map((v, idx) => (
              <View key={`${idx}-${v}`} style={styles.chartCol}>
                <View style={[styles.chartBar, { height: Math.max(24, Math.round((v / maxBp) * 120)) }]} />
                <Text style={styles.chartVal}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.panelHint}>Widget interactif: adaptez TA/FC dans le formulaire pour suivre la tendance clinique.</Text>
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

export default function CardiologyRoute() {
  return null;
}
