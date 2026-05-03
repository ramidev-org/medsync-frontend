import { PageShell } from "@/components/page_shell";
import { OrthopedicsWorkspaceTabs, type OrthopedicsWorkspaceTool } from "@/components/orthopedics/OrthopedicsWorkspaceTabs";
import { RangeOfMotionPanel } from "@/components/orthopedics/RangeOfMotionPanel";
import { SkeletonMap } from "@/components/orthopedics/SkeletonMap";
import { WebDicomViewer } from "@/components/orthopedics/WebDicomViewer";
import type { OrthopedicsWorkspaceState } from "@/components/orthopedics/types";
import { WorkspaceHero, WorkspaceSurface } from "@/components/workspaces/WorkspaceScaffold";
import { useTheme } from "@/theme/theme_provider";
import React from "react";

export default function OrthopedicsWorkspacePage() {
  const { theme } = useTheme();
  const [tool, setTool] = React.useState<OrthopedicsWorkspaceTool>("skeleton-map");
  const [state, setState] = React.useState<OrthopedicsWorkspaceState>({ selectedJoint: "knee_left", rom: {} });

  const selectedJoint = state.selectedJoint ?? "knee_left";
  const romValue = state.rom?.[selectedJoint] ?? null;

  return (
    <PageShell>
      <WorkspaceHero
        theme={theme}
        badge="Clinical Workspace"
        title="Orthopedics Workspace"
        subtitle="Joint-focused mapping, movement scoring, and imaging access in one place."
      />

      <OrthopedicsWorkspaceTabs theme={theme} active={tool} onChange={setTool} />

      {tool === "skeleton-map" || tool === "joint-selector" ? (
        <WorkspaceSurface
          theme={theme}
          title="Joint Selection"
          subtitle="Pick a joint from the skeleton map to drive charting and ROM entries."
        >
          <SkeletonMap
            theme={theme}
            selected={state.selectedJoint ?? null}
            onSelect={(next) => setState((s) => ({ ...s, selectedJoint: next }))}
          />
        </WorkspaceSurface>
      ) : tool === "range-of-motion-panel" ? (
        <WorkspaceSurface
          theme={theme}
          title="Range Of Motion"
          subtitle="Document objective flexion, extension, abduction, and adduction values."
        >
          <RangeOfMotionPanel
            theme={theme}
            joint={selectedJoint}
            value={romValue as any}
            onChange={(next) =>
              setState((s) => ({
                ...s,
                rom: { ...(s.rom ?? {}), [selectedJoint]: next },
              }))
            }
          />
        </WorkspaceSurface>
      ) : (
        <WorkspaceSurface
          theme={theme}
          title="Imaging Viewer"
          subtitle="Launch and review studies through your connected DICOM viewer."
        >
          <WebDicomViewer theme={theme} />
        </WorkspaceSurface>
      )}
    </PageShell>
  );
}
