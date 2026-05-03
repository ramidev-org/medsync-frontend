import { PageShell } from "@/components/page_shell";
import { DentistryState, DentistryTab } from "@/app/(drawer)/consultation/_tabs/observation_specialities/_dentistry";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { DentistryWorkspaceTabs, type DentistryWorkspaceTool } from "@/components/dentistry/DentistryWorkspaceTabs";
import { XrayViewer } from "@/components/dentistry/XrayViewer";
import { ToothTreatmentPanel } from "@/components/dentistry/ToothTreatmentPanel";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DentistryWorkspacePage() {
  const { theme } = useTheme();
  const [state, setState] = React.useState<DentistryState>({});
  const [tool, setTool] = React.useState<DentistryWorkspaceTool>("odontogram");
  const [xrayDraft, setXrayDraft] = React.useState("");

  return (
    <PageShell title="Dentistry Workspace" subtitle="Testing area for the odontogram, history, and X‑ray viewer.">
      <DentistryWorkspaceTabs theme={theme} active={tool} onChange={setTool} />

      {tool === "odontogram" ? (
        <DentistryTab theme={theme} value={state} onChange={setState} />
      ) : tool === "dental-xray-viewer" ? (
        <View style={{ gap: 12 }}>
          <Text style={{ fontWeight: "900", color: theme.colors.primary }}>Dental X‑ray viewer</Text>

          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <TextInput
              value={xrayDraft}
              onChangeText={setXrayDraft}
              placeholder="Paste image URL…"
              placeholderTextColor={theme.colors.textSecondary}
              style={{
                flexGrow: 1,
                minWidth: 280,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: theme.colors.surface,
                fontWeight: "800",
              }}
            />
            <TouchableOpacity
              onPress={() => {
                const uri = xrayDraft.trim();
                if (!uri) return;
                setState((s) => ({ ...s, xrays: [...(s.xrays ?? []), uri] }));
                setXrayDraft("");
              }}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.primary,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text style={{ fontWeight: "900", color: theme.colors.primary }}>Add</Text>
            </TouchableOpacity>
          </View>

          <XrayViewer theme={theme} xrays={state.xrays ?? []} onChange={(next) => setState((s) => ({ ...s, xrays: next }))} />
        </View>
      ) : tool === "tooth-treatment-panel" ? (
        <ToothTreatmentPanel
          theme={theme}
          selectedTeeth={state.selectedTeeth ?? []}
          activeProcedure={state.activeProcedure ?? "caries"}
          onChangeActiveProcedure={(next) => setState((s) => ({ ...s, activeProcedure: next }))}
          odontogram={state.odontogram ?? {}}
          onChangeOdontogram={(next) => setState((s) => ({ ...s, odontogram: next }))}
        />
      ) : (
        <View />
      )}
    </PageShell>
  );
}
