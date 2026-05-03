import { PageShell } from "@/components/page_shell";
import { WorkspaceHero, WorkspaceSurface } from "@/components/workspaces/WorkspaceScaffold";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { GynecologySteps } from "@/components/gynecology/GynecologySteps";

export default function GynecologyWorkspacePage() {
  const { theme } = useTheme();

  return (
    <PageShell>
      <WorkspaceHero
        theme={theme}
        badge="Medical Lab Workspace"
        icon={<MaterialCommunityIcons name="flask-outline" size={14} color={theme.colors.primary} />}
        title="Gynecology Workspace"
        subtitle="Step-based gynecology workflow: triage → history → exam → tests → assessment → plan."
      />

      <WorkspaceSurface theme={theme} title="Gynecology Steps" subtitle="Use the step chips to capture the encounter in a structured flow.">
        <GynecologySteps theme={theme} />
      </WorkspaceSurface>
    </PageShell>
  );
}

