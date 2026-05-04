import { PageShell } from "@/components/page_shell";
import { DermatologyLesionLog } from "@/components/dermatology/DermatologyLesionLog";
import type { DermatologyWorkspaceState } from "@/components/dermatology/types";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

export default function DermatologyWorkspacePage() {
  const { theme } = useTheme();
  const [state, setState] = React.useState<DermatologyWorkspaceState>({
    side: "front",
    lesions: [],
  });

  return (
    <PageShell title="Dermatology Workspace" subtitle="Quick lesion entry and history review.">
      <View style={{ paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 999,
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: theme.colors.surface,
          }}
        >
          <MaterialCommunityIcons name="medical-bag" size={14} color={theme.colors.primary} />
          <Text style={{ fontWeight: "900", color: theme.colors.primary, fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase" }}>
            Dermatology Workspace
          </Text>
        </View>
      </View>

      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 2 }}>Lesions</Text>
      <View style={{ marginTop: 12 }}>
        <DermatologyLesionLog theme={theme} value={state.lesions ?? []} onChange={(next) => setState((s) => ({ ...s, lesions: next }))} />
      </View>
    </PageShell>
  );
}
