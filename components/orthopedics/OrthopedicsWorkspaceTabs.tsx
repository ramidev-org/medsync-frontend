import React from "react";
import { WorkspaceTabs } from "@/components/workspaces/WorkspaceTabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type OrthopedicsWorkspaceTool =
  | "joint"
  | "range-of-motion"
  | "imaging";

const TABS = [
  { key: "joint", label: "Joint" },
  { key: "range-of-motion", label: "ROM" },
  { key: "imaging", label: "Imaging" },
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
  const tabs = React.useMemo(
    () =>
      (TABS as any).map((t: any) => ({
        ...t,
        icon: (
          <MaterialCommunityIcons
            name={t.key === "joint" ? "human-handsup" : t.key === "range-of-motion" ? "angle-acute" : "flask-outline"}
            size={16}
            color={t.key === active ? "#fff" : theme.colors.textSecondary}
          />
        ),
      })),
    [active, theme]
  );

  return <WorkspaceTabs theme={theme} tabs={tabs} active={active} onChange={onChange} />;
}
