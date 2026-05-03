import React from "react";
import { WorkspaceTabs } from "@/components/workspaces/WorkspaceTabs";

export type DermatologyWorkspaceTool =
  | "body-map"
  | "lesion-marker"
  | "photo-timeline"
  | "before-after-viewer";

const TABS = [
  { key: "body-map", label: "Body map" },
  { key: "lesion-marker", label: "Lesion marker" },
  { key: "photo-timeline", label: "Photo timeline" },
  { key: "before-after-viewer", label: "Before / after" },
] as const;

export function DermatologyWorkspaceTabs({
  theme,
  active,
  onChange,
}: {
  theme: any;
  active: DermatologyWorkspaceTool;
  onChange: (next: DermatologyWorkspaceTool) => void;
}) {
  return <WorkspaceTabs theme={theme} tabs={TABS as any} active={active} onChange={onChange} />;
}

