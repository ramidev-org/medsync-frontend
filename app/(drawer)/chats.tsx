import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { getConversations, getOrCreateDirectConversation } from "@/services/chats.services";
import type { ConversationsListResponse, UsersMetadataRow } from "@/services/backend.types";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChatsPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const router = useRouter();

  const [migrationMissing, setMigrationMissing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [staff, setStaff] = React.useState<UsersMetadataRow[]>([]);
  const [conversations, setConversations] = React.useState<ConversationsListResponse["conversations"]>([]);
  const [search, setSearch] = React.useState("");

  const refresh = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setMigrationMissing(false);

      const [staffRes, convRes] = await Promise.all([
        callRpc<any, Record<string, unknown>>("rpc_get_clinic_staff", { p_requester_id: user.id }),
        getConversations({ requesterId: user.id }),
      ]);

      setStaff((Array.isArray(staffRes) ? staffRes : []) as UsersMetadataRow[]);
      setConversations(convRes?.conversations ?? []);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      const notFound = msg.toLowerCase().includes("was not found") || msg.includes("404");
      if (notFound) {
        setMigrationMissing(true);
        setConversations([]);
      } else {
        Alert.alert("Error", msg || "Failed to load chats");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredConversations = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) => {
      const title = getConversationTitle(conversation, user?.id);
      const preview = conversation.last_message?.body ?? "";
      return title.toLowerCase().includes(q) || preview.toLowerCase().includes(q);
    });
  }, [conversations, search, user?.id]);

  const filteredStaff = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = staff.filter((s) => s?.id && s.id !== user?.id);
    if (!q) return all;
    return all.filter((person) => {
      const n = person.full_name ?? "";
      const u = person.username ?? "";
      const e = person.email ?? "";
      return (
        n.toLowerCase().includes(q) ||
        u.toLowerCase().includes(q) ||
        e.toLowerCase().includes(q) ||
        String(person.user_type ?? "").toLowerCase().includes(q)
      );
    });
  }, [search, staff, user?.id]);

  const startDirect = async (otherUserId: string) => {
    if (!user?.id) return;
    try {
      const id = await getOrCreateDirectConversation({
        requesterId: user.id,
        otherUserId,
      });
      router.push(`/chats/${id}` as any);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to start conversation");
    }
  };

  return (
    <PageShell title="Chats" subtitle="Team conversations, handoffs, and quick internal communication">
      {migrationMissing && (
        <ThemedCard>
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>Database migration missing</Text>
          <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>
            Apply `database/sql/2026_05_09_inventory_and_chats.sql` in Supabase to enable chats.
          </Text>
        </ThemedCard>
      )}

      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <ThemedCard style={{ padding: 14 }}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
            <TextInput
              placeholder="Search conversations or teammates"
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            {!!search.trim() && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </ThemedCard>

        <ThemedCard>
          <View style={styles.sectionHeader}>
            <Text style={{ fontWeight: "900", color: theme.colors.text }}>Conversations</Text>
            <TouchableOpacity onPress={refresh} style={styles.headerAction}>
              <Ionicons name="refresh" size={18} color={theme.colors.textSecondary} />
              <Text style={{ fontWeight: "800", color: theme.colors.textSecondary }}>{loading ? "Loading..." : "Refresh"}</Text>
            </TouchableOpacity>
          </View>

          {filteredConversations.length === 0 && (
            <Text style={{ marginTop: 10, fontWeight: "700", color: theme.colors.textSecondary }}>
              No conversations yet. Start one from the team list below.
            </Text>
          )}

          {filteredConversations.map((c) => {
            const last = c.last_message;
            const title = getConversationTitle(c, user?.id);
            const subtitle = c.kind === "group" ? `${c.members.length} members` : "Direct message";
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => router.push(`/chats/${c.id}` as any)}
                style={styles.conversationRow}
              >
                <Avatar name={title} theme={theme} />
                <View style={{ flex: 1 }}>
                  <View style={styles.conversationTop}>
                    <Text style={styles.conversationTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.conversationTime}>{formatTime(last?.created_at ?? c.updated_at)}</Text>
                  </View>
                  <Text style={styles.conversationMeta} numberOfLines={1}>{subtitle}</Text>
                  <Text style={styles.conversationPreview} numberOfLines={1}>
                    {last ? last.body : "No messages yet"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </ThemedCard>

        <ThemedCard>
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>Team</Text>
          <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>
            Tap a colleague to start a direct chat.
          </Text>

          {filteredStaff.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => startDirect(s.id)}
                style={styles.staffRow}
              >
                <Avatar name={s.full_name || s.username || s.email || "Unknown"} theme={theme} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>{s.full_name || s.username || s.email || "Unknown"}</Text>
                  <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary }}>{s.user_type}</Text>
                </View>
                <Ionicons name="chatbubbles-outline" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
        </ThemedCard>
      </ScrollView>
    </PageShell>
  );
}

function getConversationTitle(
  conversation: ConversationsListResponse["conversations"][number],
  currentUserId?: string,
) {
  if (conversation.kind === "group") return conversation.title || "Group chat";
  const others = conversation.members.filter((m) => m.id !== currentUserId);
  const names = others.map((m) => m.full_name || "Unknown");
  return names.join(", ") || "Direct chat";
}

function formatTime(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function Avatar({ name, theme, size = 44 }: { name: string; theme: any; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.primarySoft,
        marginRight: 10,
      }}
    >
      <Text style={{ fontWeight: "900", color: theme.colors.primary }}>{initials || "?"}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.background,
      minHeight: 44,
    },
    searchInput: { flex: 1, color: theme.colors.text, fontWeight: "700" },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    headerAction: { flexDirection: "row", gap: 8, alignItems: "center" },
    conversationRow: {
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    conversationTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    conversationTitle: { flex: 1, fontWeight: "900", color: theme.colors.text },
    conversationTime: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: "700" },
    conversationMeta: { marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 },
    conversationPreview: { marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary },
    staffRow: {
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
  });
