import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { ToothTreatmentPanel } from "@/components/dentistry/ToothTreatmentPanel";
import { DentistryHistoryFilters, DentistryTreatmentHistoryCards } from "@/components/dentistry/DentistryTreatmentHistoryCards";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function DentistryWorkspacePage() {
  const { theme } = useTheme();
  const [state, setState] = React.useState<{
    activeProcedure?: any;
    selectedTeeth?: string[];
    odontogram?: any;
  }>({});
  const [from, setFrom] = React.useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [to, setTo] = React.useState<Date>(() => new Date());

  const resetFilters = React.useCallback(() => {
    const d = new Date();
    const f = new Date(d);
    f.setDate(f.getDate() - 30);
    setFrom(f);
    setTo(d);
  }, []);

  return (
    <PageShell title="Dentistry Workspace" subtitle="Treatment entry + card history with date filters.">
      <View style={{ paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 999,
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: theme.colors.surface,
          }}
        >
          <MaterialCommunityIcons name="tooth-outline" size={14} color={theme.colors.primary} />
          <Text style={{ fontWeight: "900", color: theme.colors.primary, fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase" }}>
            Dentistry Workspace
          </Text>
        </View>
      </View>

      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 2 }}>Treatment</Text>

      <View style={{ marginTop: 12, gap: 18 }}>
        <View style={{ padding: 2 }}>
          <ToothTreatmentPanel
            theme={theme}
            selectedTeeth={state.selectedTeeth ?? []}
            onChangeSelectedTeeth={(next) => setState((s) => ({ ...s, selectedTeeth: next }))}
            activeProcedure={state.activeProcedure ?? "caries"}
            onChangeActiveProcedure={(next) => setState((s) => ({ ...s, activeProcedure: next }))}
            odontogram={state.odontogram ?? {}}
            onChangeOdontogram={(next) => setState((s) => ({ ...s, odontogram: next }))}
            filterSection={
              <DentistryHistoryFilters
                theme={theme}
                from={from}
                to={to}
                onFromChange={setFrom}
                onToChange={setTo}
                onReset={resetFilters}
              />
            }
          />
        </View>
        <View style={{ marginTop: 4 }}>
          <DentistryTreatmentHistoryCards
            theme={theme}
            odontogram={state.odontogram ?? {}}
            from={from}
            to={to}
            maxHeight={340}
          />
        </View>
      </View>
    </PageShell>
  );
}
