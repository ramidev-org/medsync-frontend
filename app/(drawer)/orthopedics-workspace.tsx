import { PageShell } from "@/components/page_shell";
import { JointSelectorForm } from "@/components/orthopedics/JointSelectorForm";
import { RangeOfMotionPanel } from "@/components/orthopedics/RangeOfMotionPanel";
import { RomHistoryCards } from "@/components/orthopedics/RomHistoryCards";
import type { OrthopedicsWorkspaceState } from "@/components/orthopedics/types";
import { WorkspaceHero, WorkspaceSurface } from "@/components/workspaces/WorkspaceScaffold";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

export default function OrthopedicsWorkspacePage() {
  const { theme } = useTheme();
  const [state, setState] = React.useState<OrthopedicsWorkspaceState>({ selectedJoint: "knee_left", rom: {}, romLog: [] });
  const [jointNote, setJointNote] = React.useState("");

  const selectedJoint = state.selectedJoint ?? "knee_left";
  const romValue = state.rom?.[selectedJoint] ?? null;

  return (
    <PageShell>
      <WorkspaceHero
        theme={theme}
        badge="Medical Lab Workspace"
        icon={<MaterialCommunityIcons name="flask-outline" size={14} color={theme.colors.primary} />}
        title="Orthopedics Workspace"
        subtitle="ROM entry + card history with date filters."
      />

      <WorkspaceSurface theme={theme} title="Joint Selection" subtitle="Select the joint to drive charting and ROM entries.">
        <JointSelectorForm
          theme={theme}
          selected={selectedJoint}
          note={jointNote}
          onSelect={(next) => setState((s) => ({ ...s, selectedJoint: next }))}
          onChangeNote={setJointNote}
        />
      </WorkspaceSurface>

      <WorkspaceSurface theme={theme} title="ROM" subtitle="Enter ROM values then create an entry.">
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
      </WorkspaceSurface>

      <WorkspaceSurface theme={theme} title="ROM History" subtitle="Cards + date filters for recorded ROM values.">
        <RomHistoryCards theme={theme} entries={state.romLog ?? []} />
      </WorkspaceSurface>
    </PageShell>
  );
}
