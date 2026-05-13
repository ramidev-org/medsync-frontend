import React from "react";
import { WorkspaceTabs } from "@/components/workspaces/WorkspaceTabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type OrthopedicsWorkspaceTool =
  | "joint"
  | "range-of-motion"
  | "history";

const TABS = [
  { key: "joint", label: "Joint" },
  { key: "range-of-motion", label: "ROM" },
  { key: "history", label: "History" },
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
            name={t.key === "joint" ? "human-handsup" : t.key === "range-of-motion" ? "angle-acute" : "history"}
            size={16}
            color={t.key === active ? "#fff" : theme.colors.textSecondary}
          />
        ),
      })),
    [active, theme]
  );

  return <WorkspaceTabs theme={theme} tabs={tabs} active={active} onChange={onChange} />;
}
