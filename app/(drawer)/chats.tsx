import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { getConversations, getOrCreateDirectConversation } from "@/services/chats.services";
import type { ConversationsListResponse, UsersMetadataRow } from "@/services/backend.types";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ChatsEntryPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [staff, setStaff] = React.useState<UsersMetadataRow[]>([]);
  const [conversations, setConversations] = React.useState<ConversationsListResponse["conversations"]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [staffRes, convRes] = await Promise.all([
          callRpc<any, Record<string, unknown>>("rpc_get_clinic_staff", { p_requester_id: user.id }),
          getConversations({ requesterId: user.id, itemsPerPage: 100 }),
        ]);
        if (cancelled) return;
        const conversationRows = convRes?.conversations ?? [];
        const staffRows = (Array.isArray(staffRes) ? staffRes : []) as UsersMetadataRow[];
        setStaff(staffRows);
        setConversations(conversationRows);

        if (conversationRows.length > 0) {
          router.replace(`/chats/${conversationRows[0].id}` as any);
          return;
        }

        // No existing conversation: auto-create one with first teammate
        const firstTeammate = staffRows.find((entry) => entry?.id && entry.id !== user.id);
        if (firstTeammate?.id) {
          const id = await getOrCreateDirectConversation({
            requesterId: user.id,
            otherUserId: firstTeammate.id,
          });
          if (!cancelled) router.replace(`/chats/${id}` as any);
        }
      } catch (e: any) {
        if (cancelled) return;
        Alert.alert("Error", e?.message || "Failed to open chats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [router, user?.id]);

  const startDirect = async (otherUserId: string) => {
    if (!user?.id) return;
    try {
      const id = await getOrCreateDirectConversation({
        requesterId: user.id,
        otherUserId,
      });
      router.replace(`/chats/${id}` as any);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to start conversation");
    }
  };

  const staffRows = React.useMemo(
    () => staff.filter((entry) => entry?.id && entry.id !== user?.id),
    [staff, user?.id],
  );

  return (
    <PageShell title="Chat" subtitle="Open a direct conversation" scrollable={false} contentStyle={{ flex: 1 }}>
      <View style={styles.wrap}>
        <View style={styles.workspaceCard}>
          <View style={styles.workspaceHeader}>
            <Text style={styles.workspaceTitle}>Chats</Text>
            <Text style={styles.workspaceSub}>Conversation workspace</Text>
          </View>

          {loading && (
            <View style={styles.centerState}>
              <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.centerStateText}>Loading chat workspace...</Text>
            </View>
          )}

          {!loading && staffRows.length > 0 && (
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              {staffRows.map((row) => (
                <TouchableOpacity key={row.id} onPress={() => startDirect(row.id)} style={styles.staffRow}>
                  <Avatar name={row.full_name || row.username || row.email || "Unknown"} theme={theme} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffName}>{row.full_name || row.username || row.email || "Unknown"}</Text>
                    <Text style={styles.staffRole}>{row.user_type}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {!loading && staffRows.length === 0 && (
            <View style={styles.centerState}>
              <Ionicons name="people-outline" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.centerStateText}>No teammates available to start a chat yet.</Text>
            </View>
          )}
        </View>
      </View>
    </PageShell>
  );
}

function Avatar({ name, theme }: { name: string; theme: any }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
      }}
    >
      <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>{initials || "?"}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    wrap: { flex: 1, gap: 14 },
    workspaceCard: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      padding: 12,
      minHeight: 260,
    },
    workspaceHeader: { marginBottom: 10 },
    workspaceTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 18 },
    workspaceSub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, minHeight: 180 },
    centerStateText: { color: theme.colors.textSecondary, fontWeight: "700" },
    staffRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      padding: 10,
    },
    staffName: { color: theme.colors.text, fontWeight: "900" },
    staffRole: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700", textTransform: "capitalize" },
  });
