import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { GynecologySteps } from "@/components/gynecology/GynecologySteps";
import { Text, View } from "react-native";

export default function GynecologyWorkspacePage() {
  const { theme } = useTheme();

  return (
    <PageShell title="Gynecology Workspace" subtitle="Simple step flow for consultation capture.">
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
            Gynecology Workspace
          </Text>
        </View>
      </View>

      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 2 }}>Consultation Steps</Text>
      <View style={{ marginTop: 12 }}>
        <GynecologySteps theme={theme} />
      </View>
    </PageShell>
  );
}
