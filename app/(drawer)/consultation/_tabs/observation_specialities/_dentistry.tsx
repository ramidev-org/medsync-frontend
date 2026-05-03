import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { TreatmentHistoryPanel } from "@/components/dentistry/TreatmentHistoryPanel";
import { ToothTreatmentPanel } from "@/components/dentistry/ToothTreatmentPanel";
import { OdontogramState, type ProcedureKey, type ToothSurface, clearSurface, upsertProcedure } from "@/components/dentistry/odontogram";
import { Dropdown } from "@/components/input_fields";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type DentistryState = {
  activeProcedure?: ProcedureKey;
  selectedTeeth?: string[]; // FDI ids e.g. ["11","21"]
  odontogram?: OdontogramState;
  xrays?: string[];
};

const ALL_SURFACES: ToothSurface[] = ["B", "L", "M", "D", "O"];
const EMPTY_SELECTION: string[] = [];

const TEETH: string[] = [
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
];

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
  const selectedTeeth = value.selectedTeeth ?? EMPTY_SELECTION;

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

      <View style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border }}>
              <MaterialCommunityIcons name="flask-outline" size={14} color={theme.colors.primary} />
            </View>
            <Text style={{ fontWeight: "900", color: theme.colors.text }}>Tooth selection</Text>
          </View>
          <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>{selectedTeeth.length} selected</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
            <Dropdown
              label="Tooth (FDI)"
              value={value.selectedTeeth?.[0] ?? ""}
              options={TEETH}
              onChange={(picked) => {
                if (!picked) return;
                const next = Array.from(new Set([picked, ...(selectedTeeth || [])]));
                onSelectionChange(next);
              }}
              prefixIcon="grid-outline"
              placeholder="Select a tooth…"
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {selectedTeeth.length === 0 ? (
            <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>Pick teeth to apply procedures and populate history.</Text>
          ) : (
            selectedTeeth.map((t) => (
              <Pressable
                key={t}
                onPress={() => onSelectionChange(selectedTeeth.filter((x) => x !== t))}
                style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: theme.colors.background, flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={{ fontWeight: "900", color: theme.colors.textSecondary, fontSize: 12 }}>{t}</Text>
                <MaterialCommunityIcons name="close" size={14} color={theme.colors.textSecondary} />
              </Pressable>
            ))
          )}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <ToothTreatmentPanel
          theme={theme}
          selectedTeeth={selectedTeeth}
          onChangeSelectedTeeth={(next) => set({ selectedTeeth: next })}
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
