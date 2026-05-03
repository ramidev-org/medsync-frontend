import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { OdontogramState, ProcedureKey, ToothSurface, clearSurface, upsertProcedure } from "./odontogram";
import { ProcedurePicker } from "./ProcedurePicker";
import { TreatmentHistoryPanel } from "./TreatmentHistoryPanel";

const ALL_SURFACES: ToothSurface[] = ["B", "L", "M", "D", "O"];

function applyProcedureToTooth({
  odontogram,
  tooth,
  procedure,
  nowIso,
}: {
  odontogram: OdontogramState;
  tooth: string;
  procedure: ProcedureKey;
  nowIso: string;
}): OdontogramState {
  if (procedure === "healthy") {
    let next = odontogram;
    for (const s of ALL_SURFACES) next = clearSurface({ odontogram: next, tooth, surface: s });
    return next;
  }

  let next = odontogram;
  for (const s of ALL_SURFACES) next = upsertProcedure({ odontogram: next, tooth, surface: s, procedure, nowIso });
  return next;
}

export function ToothTreatmentPanel({
  theme,
  selectedTeeth,
  activeProcedure,
  onChangeActiveProcedure,
  odontogram,
  onChangeOdontogram,
}: {
  theme: any;
  selectedTeeth: string[];
  activeProcedure: ProcedureKey;
  onChangeActiveProcedure: (next: ProcedureKey) => void;
  odontogram: OdontogramState;
  onChangeOdontogram: (next: OdontogramState) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const primaryTooth = selectedTeeth[0];

  const applyToSelection = () => {
    if (selectedTeeth.length === 0) return;
    const nowIso = new Date().toISOString();
    let next = odontogram;
    for (const t of selectedTeeth) next = applyProcedureToTooth({ odontogram: next, tooth: t, procedure: activeProcedure, nowIso });
    onChangeOdontogram(next);
  };

  const clearSelection = () => {
    if (selectedTeeth.length === 0) return;
    let next = odontogram;
    for (const tooth of selectedTeeth) for (const s of ALL_SURFACES) next = clearSurface({ odontogram: next, tooth, surface: s });
    onChangeOdontogram(next);
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.h1}>Treatment panel</Text>
      <Text style={styles.sub}>Selected: {selectedTeeth.length ? selectedTeeth.join(", ") : "None"}</Text>

      <ProcedurePicker theme={theme} value={activeProcedure} onChange={onChangeActiveProcedure} />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <TouchableOpacity
          disabled={selectedTeeth.length === 0}
          onPress={applyToSelection}
          style={[
            styles.actionBtn,
            { borderColor: theme.colors.primary, opacity: selectedTeeth.length === 0 ? 0.45 : 1 },
          ]}
        >
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>Apply to selected</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={selectedTeeth.length === 0}
          onPress={clearSelection}
          style={[
            styles.actionBtn,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant, opacity: selectedTeeth.length === 0 ? 0.45 : 1 },
          ]}
        >
          <Text style={[styles.actionText, { color: theme.colors.text }]}>Clear selected</Text>
        </TouchableOpacity>
      </View>

      {primaryTooth ? <TreatmentHistoryPanel theme={theme} odontogram={odontogram} selected={{ tooth: primaryTooth }} /> : null}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    h1: { fontWeight: "900", color: theme.colors.primary },
    sub: { fontWeight: "800", opacity: 0.7 },
    actionBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surface },
    actionText: { fontWeight: "900", fontSize: 12 },
  });
