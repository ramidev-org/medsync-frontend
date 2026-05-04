import { PageShell } from "@/components/page_shell";
import { JointSelectorForm } from "@/components/orthopedics/JointSelectorForm";
import { RangeOfMotionPanel } from "@/components/orthopedics/RangeOfMotionPanel";
import { RomHistoryCards } from "@/components/orthopedics/RomHistoryCards";
import type { OrthopedicsWorkspaceState } from "@/components/orthopedics/types";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

export default function OrthopedicsWorkspacePage() {
  const { theme } = useTheme();
  const [state, setState] = React.useState<OrthopedicsWorkspaceState>({ selectedJoint: "knee_left", rom: {}, romLog: [] });
  const [jointNote, setJointNote] = React.useState("");

  const selectedJoint = state.selectedJoint ?? "knee_left";
  const romValue = state.rom?.[selectedJoint] ?? null;

  return (
    <PageShell title="Orthopedics Workspace" subtitle="Simple ROM capture and history review.">
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
          <MaterialCommunityIcons name="medical-bag" size={14} color={theme.colors.primary} />
          <Text style={{ fontWeight: "900", color: theme.colors.primary, fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase" }}>
            Orthopedics Workspace
          </Text>
        </View>
      </View>

      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 2 }}>Joint Selection</Text>
      <View style={{ marginTop: 12 }}>
        <JointSelectorForm
          theme={theme}
          selected={selectedJoint}
          note={jointNote}
          onSelect={(next) => setState((s) => ({ ...s, selectedJoint: next }))}
          onChangeNote={setJointNote}
        />
      </View>

      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 16 }}>Range Of Motion</Text>
      <View style={{ marginTop: 10 }}>
        <RangeOfMotionPanel
          theme={theme}
          joint={selectedJoint}
          value={romValue as any}
          onChange={(next) => setState((s) => ({ ...s, rom: { ...(s.rom ?? {}), [selectedJoint]: next } }))}
          onCreate={(next) =>
            setState((s) => ({
              ...s,
              rom: { ...(s.rom ?? {}), [selectedJoint]: next },
              romLog: [
                {
                  id: `rom_${selectedJoint}_${Date.now().toString(16)}`,
                  joint: selectedJoint,
                  atIso: new Date().toISOString(),
                  value: next,
                },
                ...(s.romLog ?? []),
              ].slice(0, 200),
            }))
          }
        />
      </View>

      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 16 }}>ROM History</Text>
      <View style={{ marginTop: 10 }}>
        <RomHistoryCards theme={theme} entries={state.romLog ?? []} />
      </View>
    </PageShell>
  );
}
