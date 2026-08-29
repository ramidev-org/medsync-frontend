import React from "react";
import { WorkspaceTabs } from "@/components/workspaces/WorkspaceTabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type DermatologyWorkspaceTool =
  | "intake"
  | "lesion-log"
  | "photo-log"
  | "assessment";

const TABS = [
  { key: "intake", label: "Intake" },
  { key: "lesion-log", label: "Lesion log" },
  { key: "photo-log", label: "Photo log" },
  { key: "assessment", label: "Assessment" },
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
  const tabs = React.useMemo(
    () =>
      (TABS as any).map((t: any) => ({
        ...t,
        icon: (
          <MaterialCommunityIcons
            name={
              t.key === "intake"
                ? "clipboard-text-outline"
                : t.key === "lesion-log"
                  ? "format-list-bulleted"
                  : t.key === "photo-log"
                    ? "camera-outline"
                    : "beaker-outline"
            }
            size={16}
            color={t.key === active ? "#fff" : theme.colors.textSecondary}
          />
        ),
      })),
    [active, theme]
  );

  return <WorkspaceTabs theme={theme} tabs={tabs} active={active} onChange={onChange} />;
}
