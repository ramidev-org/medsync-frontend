import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { Text, View } from "react-native";

export default function ChatsPage() {
  const { theme } = useTheme();

  return (
    <PageShell title="Chats" subtitle="Messagerie interne (bientot)">
      <ThemedCard>
        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>Module en cours</Text>
          <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>
            Prochaine etape: conversations patient / staff, notifications, et pieces jointes.
          </Text>
        </View>
      </ThemedCard>
    </PageShell>
  );
}

