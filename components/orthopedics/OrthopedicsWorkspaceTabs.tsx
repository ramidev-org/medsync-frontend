import React from "react";
import { WorkspaceTabs } from "@/components/workspaces/WorkspaceTabs";

export type OrthopedicsWorkspaceTool =
  | "skeleton-map"
  | "joint-selector"
  | "dicom-viewer"
  | "range-of-motion-panel";

const TABS = [
  { key: "skeleton-map", label: "Skeleton map" },
  { key: "joint-selector", label: "Joint selector" },
  { key: "dicom-viewer", label: "DICOM viewer" },
  { key: "range-of-motion-panel", label: "ROM panel" },
] as const;

export function OrthopedicsWorkspaceTabs({
  theme,
  active,
  onChange,
}: {
  theme: any;
  active: OrthopedicsWorkspaceTool;
  onChange: (next: OrthopedicsWorkspaceTool) => void;
}) {
  return <WorkspaceTabs theme={theme} tabs={TABS as any} active={active} onChange={onChange} />;
}

