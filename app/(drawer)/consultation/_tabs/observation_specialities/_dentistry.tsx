import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TreatmentHistoryPanel } from "@/components/dentistry/TreatmentHistoryPanel";
import { WebOdontogram } from "@/components/dentistry/WebOdontogram";
import { ToothTreatmentPanel } from "@/components/dentistry/ToothTreatmentPanel";
import { OdontogramState, type ProcedureKey, type ToothSurface, clearSurface, upsertProcedure } from "@/components/dentistry/odontogram";

export type DentistryState = {
  activeProcedure?: ProcedureKey;
  selectedTeeth?: string[]; // FDI ids e.g. ["11","21"]
  odontogram?: OdontogramState;
  xrays?: string[];
};

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

  const activeProcedure = value.activeProcedure ?? "caries";
  const odontogram = value.odontogram ?? {};
  const selectedTeeth = value.selectedTeeth ?? [];

  const prevSelectedRef = React.useRef<string[]>(selectedTeeth);
  React.useEffect(() => {
    prevSelectedRef.current = selectedTeeth;
  }, [selectedTeeth]);

  // Workflow: select teeth → choose tool (auto applies tool to current selection).
  const prevProcRef = React.useRef<ProcedureKey | null>(null);
  React.useEffect(() => {
    if (prevProcRef.current === null) {
      prevProcRef.current = activeProcedure;
      return;
    }
    if (prevProcRef.current === activeProcedure) return;
    prevProcRef.current = activeProcedure;
    if (selectedTeeth.length === 0) return;

    const nowIso = new Date().toISOString();
    let next = odontogram;
    for (const t of selectedTeeth) next = applyProcedureToTooth({ odontogram: next, tooth: t, procedure: activeProcedure, nowIso });
    set({ odontogram: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProcedure]);

  const onSelectionChange = (nextSelected: string[]) => {
    const prev = prevSelectedRef.current;
    prevSelectedRef.current = nextSelected;
    set({ selectedTeeth: nextSelected });

    // Paint newly selected teeth immediately (feels like a "brush" tool).
    const prevSet = new Set(prev);
    const nowIso = new Date().toISOString();
    let next = odontogram;
    for (const t of nextSelected) {
      if (!prevSet.has(t)) next = applyProcedureToTooth({ odontogram: next, tooth: t, procedure: activeProcedure, nowIso });
    }
    if (next !== odontogram) set({ odontogram: next });
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 12 }}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>Dentistry</Text>

      <WebOdontogram
        themeMode="light"
        odontogram={odontogram}
        defaultSelected={selectedTeeth.map((t) => `teeth-${t}`)}
        onSelectionChange={onSelectionChange}
        maxWidth={900}
        splitUpperLower
      />

      <View style={{ gap: 12 }}>
        <ToothTreatmentPanel
          theme={theme}
          selectedTeeth={selectedTeeth}
          activeProcedure={activeProcedure}
          onChangeActiveProcedure={(next) => set({ activeProcedure: next })}
          odontogram={odontogram}
          onChangeOdontogram={(next) => set({ odontogram: next })}
        />
        <TreatmentHistoryPanel theme={theme} odontogram={odontogram} selected={{ tooth: selectedTeeth[0] }} />
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    title: { fontWeight: "900" },
  });

// Not a route screen; keep router scanning happy.
export default function DentistryRoute() {
  return null;
}
