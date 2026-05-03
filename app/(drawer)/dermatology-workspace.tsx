import { PageShell } from "@/components/page_shell";
import { BeforeAfterViewer } from "@/components/dermatology/BeforeAfterViewer";
import { BodyMap } from "@/components/dermatology/BodyMap";
import { DermatologyWorkspaceTabs, type DermatologyWorkspaceTool } from "@/components/dermatology/DermatologyWorkspaceTabs";
import { LesionAnnotator } from "@/components/dermatology/LesionAnnotator";
import { PhotoTimeline, type TimelinePhoto } from "@/components/dermatology/PhotoTimeline";
import type { DermatologyWorkspaceState } from "@/components/dermatology/types";
import { WorkspaceHero, WorkspaceSurface } from "@/components/workspaces/WorkspaceScaffold";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { Text, View } from "react-native";

export default function DermatologyWorkspacePage() {
  const { theme } = useTheme();
  const [tool, setTool] = React.useState<DermatologyWorkspaceTool>("body-map");
  const [state, setState] = React.useState<DermatologyWorkspaceState>({
    side: "front",
    markers: [],
    photos: [],
  });

  return (
    <PageShell>
      <WorkspaceHero
        theme={theme}
        badge="Clinical Workspace"
        title="Dermatology Workspace"
        subtitle="Structured visual exam tools for lesion tracking, comparisons, and documentation."
      />

      <DermatologyWorkspaceTabs theme={theme} active={tool} onChange={setTool} />

      {tool === "body-map" ? (
        <WorkspaceSurface
          theme={theme}
          title="Body Region Mapping"
          subtitle="Mark and review anatomical lesion positions with front/back targeting."
        >
          <BodyMap
            theme={theme}
            side={state.side ?? "front"}
            markers={state.markers ?? []}
            onChangeSide={(next) => setState((s) => ({ ...s, side: next }))}
            onChangeMarkers={(next) => setState((s) => ({ ...s, markers: next }))}
          />
        </WorkspaceSurface>
      ) : tool === "lesion-marker" ? (
        <WorkspaceSurface
          theme={theme}
          title="Lesion Annotation"
          subtitle="Drop and remove lesion points directly on patient photos."
        >
          <LesionAnnotator theme={theme} />
        </WorkspaceSurface>
      ) : tool === "photo-timeline" ? (
        <WorkspaceSurface
          theme={theme}
          title="Photo Timeline"
          subtitle="Chronological visual follow-up for treatment progress."
        >
          <PhotoTimeline
            theme={theme}
            photos={(state.photos ?? []) as TimelinePhoto[]}
            onChange={(next) => setState((s) => ({ ...s, photos: next }))}
          />
        </WorkspaceSurface>
      ) : tool === "before-after-viewer" ? (
        <WorkspaceSurface
          theme={theme}
          title="Before / After Comparison"
          subtitle="Interactive side-by-side clinical comparison."
        >
          <BeforeAfterViewer theme={theme} />
        </WorkspaceSurface>
      ) : (
        <View style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface }}>
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>WIP</Text>
          <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>
            Tool not implemented yet: {tool}
          </Text>
        </View>
      )}
    </PageShell>
  );
}
