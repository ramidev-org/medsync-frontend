import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

import { OdontogramState, ProcedureKey, ToothSurface, clearSurface, upsertProcedure } from "./odontogram";
import { ProcedurePicker } from "./ProcedurePicker";
import { OdontogramDialog } from "./OdontogramDialog";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebOdontogram } from "./WebOdontogram";

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
  onChangeSelectedTeeth,
  activeProcedure,
  onChangeActiveProcedure,
  odontogram,
  onChangeOdontogram,
  filterSection,
}: {
  theme: any;
  selectedTeeth: string[];
  onChangeSelectedTeeth: (next: string[]) => void;
  activeProcedure: ProcedureKey;
  onChangeActiveProcedure: (next: ProcedureKey) => void;
  odontogram: OdontogramState;
  onChangeOdontogram: (next: OdontogramState) => void;
  filterSection?: React.ReactNode;
}) {
  const [openSelector, setOpenSelector] = React.useState(false);
  const isWeb = Platform.OS === "web";

  const createTreatment = () => {
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
    onChangeSelectedTeeth([]);
  };

  return (
    <View style={{ gap: 12 }}>
      <OdontogramDialog
        theme={theme}
        open={openSelector}
        title="Select teeth"
        subtitle="Click teeth to select/deselect, then close."
        odontogram={odontogram}
        selectedTeethFdi={selectedTeeth}
        onChangeSelectedTeethFdi={onChangeSelectedTeeth}
        onClose={() => setOpenSelector(false)}
      />

      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 14,
          backgroundColor: theme.colors.surface,
          padding: 12,
          gap: 12,
          ...(isWeb ? ({ flexDirection: "row", alignItems: "stretch" } as any) : null),
        }}
      >
        <View style={{ gap: 12, ...(isWeb ? ({ width: 360, flexShrink: 0 } as any) : null) }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <ProcedurePicker theme={theme} value={activeProcedure} onChange={onChangeActiveProcedure} />

            {!isWeb ? (
              <TouchableOpacity
                onPress={() => setOpenSelector(true)}
                style={{ borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <MaterialCommunityIcons name="tooth-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={{ fontWeight: "900", color: theme.colors.textSecondary, fontSize: 12 }}>Teeth</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.colors.background }}>
            <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>Selected teeth</Text>
            <Text style={{ marginTop: 4, fontWeight: "900", color: theme.colors.text, fontSize: 12 }}>
              {selectedTeeth.length ? selectedTeeth.join(", ") : "None"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <TouchableOpacity
              disabled={selectedTeeth.length === 0}
              onPress={createTreatment}
              style={[
                { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, borderColor: theme.colors.primary, backgroundColor: theme.colors.primary, opacity: selectedTeeth.length === 0 ? 0.45 : 1 },
              ]}
            >
              <Text style={{ fontWeight: "900", fontSize: 12, color: theme.colors.textOnPrimary }}>Create treatment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={selectedTeeth.length === 0}
              onPress={clearSelection}
              style={[
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant, opacity: selectedTeeth.length === 0 ? 0.45 : 1 },
                { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
              ]}
            >
              <Text style={{ fontWeight: "900", fontSize: 12, color: theme.colors.text }}>Clear selected</Text>
            </TouchableOpacity>
          </View>

          {!!filterSection ? <View style={{ marginTop: 2 }}>{filterSection}</View> : null}
        </View>

        {isWeb ? (
          <View style={{ flex: 1, minWidth: 520, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, backgroundColor: theme.colors.background }}>
            <WebOdontogram
              themeMode="light"
              odontogram={odontogram}
              defaultSelected={(selectedTeeth ?? []).map((t) => `teeth-${t}`)}
              onSelectionChange={onChangeSelectedTeeth}
              splitUpperLower
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
