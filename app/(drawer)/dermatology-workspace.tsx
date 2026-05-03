import { PageShell } from "@/components/page_shell";
import { DermatologyLesionLog } from "@/components/dermatology/DermatologyLesionLog";
import type { DermatologyWorkspaceState } from "@/components/dermatology/types";
import { WorkspaceHero, WorkspaceSurface } from "@/components/workspaces/WorkspaceScaffold";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

export default function DermatologyWorkspacePage() {
  const { theme } = useTheme();
  const [state, setState] = React.useState<DermatologyWorkspaceState>({
    side: "front",
    lesions: [],
  });

  return (
    <PageShell>
      <WorkspaceHero
        theme={theme}
        badge="Medical Lab Workspace"
        icon={<MaterialCommunityIcons name="flask-outline" size={14} color={theme.colors.primary} />}
        title="Dermatology Workspace"
        subtitle="Lesion entry + card history with date filters."
      />

      <WorkspaceSurface theme={theme} title="Lesions" subtitle="Create a lesion entry and review history.">
        <DermatologyLesionLog theme={theme} value={state.lesions ?? []} onChange={(next) => setState((s) => ({ ...s, lesions: next }))} />
      </WorkspaceSurface>
    </PageShell>
  );
}
