import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { getConversations, getMessages, sendMessage } from "@/services/chats.services";
import type { ChatMessageRow, ConversationRow } from "@/services/backend.types";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function ChatConversationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const conversationId = String(id ?? "");
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 1100;
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<ChatMessageRow[]>([]);
  const [conversation, setConversation] = React.useState<ConversationRow | null>(null);
  const [allConversations, setAllConversations] = React.useState<ConversationRow[]>([]);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!user?.id || !conversationId) return;
    setLoading(true);
    try {
      const [msgs, listResult] = await Promise.all([
        getMessages({ requesterId: user.id, conversationId, limit: 100 }),
        getConversations({ requesterId: user.id, page: 1, itemsPerPage: 200 }),
      ]);
      setRows(msgs ?? []);
      const conversations = listResult?.conversations ?? [];
      setAllConversations(conversations);
      setConversation(conversations.find((item) => item.id === conversationId) ?? null);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const title = React.useMemo(() => {
    if (!conversation) return conversationId ? `Conversation ${conversationId.slice(0, 8)}...` : "Conversation";
    if (conversation.kind === "group") return conversation.title || "Group chat";
    const others = conversation.members.filter((m) => m.id !== user?.id);
    return others.map((m) => m.full_name || "Unknown").join(", ") || "Direct chat";
  }, [conversation, conversationId, user?.id]);

  const subtitle = React.useMemo(() => {
    if (!conversation) return "internal clinic chat";
    return conversation.kind === "group" ? `${conversation.members.length} participants` : "online team chat";
  }, [conversation]);
  const talkingWith = React.useMemo(() => {
    if (!conversation) return "Unknown";
    if (conversation.kind === "group") return conversation.title || "Group chat";
    const other = conversation.members.find((m) => m.id !== user?.id);
    return other?.full_name || "Direct chat";
  }, [conversation, user?.id]);

  const onSend = async () => {
    if (!user?.id || !conversationId) return;
    const body = text.trim();
    if (!body) return;

    setSending(true);
    try {
      setText("");
      const optimistic: ChatMessageRow = {
        id: `optimistic_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: "You",
        body,
        created_at: new Date().toISOString(),
        edited_at: null,
      };
      setRows((prev) => [...prev, optimistic]);
      await sendMessage({ requesterId: user.id, conversationId, body });
      await refresh();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send");
      await refresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell scrollable={false} contentStyle={{ flex: 1, paddingBottom: 10, paddingTop: 14 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        style={{ flex: 1 }}
      >
        <View style={styles.outer}>
          {isWideWeb && (
            <View style={styles.historyPane}>
              <View style={styles.brandPill}>
                <Ionicons name="chatbubbles-outline" size={15} color="#1D4ED8" />
                <Text style={styles.brandPillText}>MedSync Chat</Text>
              </View>
              <Text style={styles.historyTitle}>Chats</Text>
              <Text style={styles.historySub}>Recent clinic conversations</Text>
              <View style={{ height: 10 }} />
              <ScrollView contentContainerStyle={styles.historyListContent}>
              {allConversations.map((row) => {
                const active = row.id === conversationId;
                const rowTitle =
                  row.kind === "group"
                    ? row.title || "Group chat"
                    : row.members
                        .filter((member) => member.id !== user?.id)
                        .map((member) => member.full_name || "Unknown")
                        .join(", ") || "Direct chat";
                const rowSub = row.last_message?.body || "No messages yet";
                return (
                <TouchableOpacity
                  key={row.id}
                  style={[
                    styles.historyRow,
                    active ? { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft } : null,
                  ]}
                  onPress={() => router.replace(`/chats/${row.id}` as any)}
                >
                  <Avatar name={rowTitle} theme={theme} size={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyRowTitle} numberOfLines={1}>{rowTitle}</Text>
                    <Text style={styles.historyRowSub} numberOfLines={1}>{rowSub}</Text>
                  </View>
                </TouchableOpacity>
              )})}
              </ScrollView>
            </View>
          )}

          <View style={styles.container}>
          {!!conversation && (
            <>
            <View style={styles.chatTopBar}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Avatar name={talkingWith} theme={theme} size={34} />
                <View style={{ maxWidth: "72%" }}>
                  <Text style={styles.chatTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.chatSub} numberOfLines={1}>
                    {subtitle}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Ionicons name="videocam-outline" size={18} color={theme.colors.textSecondary} />
                <Ionicons name="call-outline" size={18} color={theme.colors.textSecondary} />
              </View>
            </View>
            <View style={styles.chatHero}>
              <View style={styles.chatHeroText}>
                <Text style={styles.chatHeroTitle}>Clinic conversation hub</Text>
                <Text style={styles.chatHeroSub}>
                  Follow live team updates with the same calm visual language as the lab workspace.
                </Text>
              </View>
              <View style={styles.chatHeroStats}>
                <View style={styles.chatHeroStat}>
                  <Text style={styles.chatHeroStatValue}>{rows.length}</Text>
                  <Text style={styles.chatHeroStatLabel}>Messages</Text>
                </View>
                <View style={styles.chatHeroStat}>
                  <Text style={styles.chatHeroStatValue}>{conversation.members.length}</Text>
                  <Text style={styles.chatHeroStatLabel}>Members</Text>
                </View>
              </View>
            </View>
            </>
          )}

          <FlatList
            data={rows}
            keyExtractor={(message) => message.id}
            onRefresh={refresh}
            refreshing={loading}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 12, paddingTop: 6 }}
            renderItem={({ item }) => {
              const mine = item.sender_id === user?.id;
              return (
                <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
                  {!mine && <Avatar name={item.sender_name || "Staff"} theme={theme} size={30} />}
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.sender, mine ? styles.senderMine : styles.senderOther]}>
                      {mine ? "You" : item.sender_name || "Staff"}
                    </Text>
                    <Text style={[styles.body, mine ? styles.bodyMine : styles.bodyOther]}>{item.body}</Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.time, mine ? styles.timeMine : styles.timeOther]}>{formatTime(item.created_at)}</Text>
                      {mine && <Ionicons name="checkmark-done-outline" size={12} color="#3C6B40" />}
                    </View>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.composer}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="add-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
              multiline
            />
            {text.trim().length > 0 ? (
              <TouchableOpacity onPress={onSend} disabled={sending} style={styles.sendBtn}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="mic-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </PageShell>
  );
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function Avatar({ name, theme, size = 36 }: { name: string; theme: any; size?: number }) {
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
      }}
    >
      <Text style={{ fontWeight: "900", color: theme.colors.primary, fontSize: Math.max(11, size * 0.32) }}>
        {initials || "?"}
      </Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    outer: { flex: 1, flexDirection: "row", gap: 14, minHeight: 0 },
    brandPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#EFF6FF",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 10,
    },
    brandPillText: {
      color: "#1D4ED8",
      fontWeight: "800",
      fontSize: 12,
    },
    historyPane: {
      width: 300,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      padding: 16,
      minHeight: 0,
      height: "100%",
    },
    historyListContent: { gap: 10, paddingBottom: 10 },
    historyTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 20 },
    historySub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    historyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: 12,
      backgroundColor: theme.colors.background,
    },
    historyRowTitle: { color: theme.colors.text, fontWeight: "900" },
    historyRowSub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    container: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 24,
      backgroundColor: "#F8FBFF",
      padding: 10,
      minHeight: 380,
      height: "100%",
    },
    chatTopBar: {
      marginHorizontal: 6,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    chatTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
    chatSub: { marginTop: 1, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11 },
    chatHero: {
      marginHorizontal: 6,
      marginBottom: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 14,
      gap: 14,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    chatHeroText: {
      flex: 1,
      minWidth: 220,
    },
    chatHeroTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "900",
    },
    chatHeroSub: {
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontWeight: "700",
      lineHeight: 20,
    },
    chatHeroStats: {
      flexDirection: "row",
      gap: 10,
    },
    chatHeroStat: {
      minWidth: 96,
      borderRadius: 16,
      backgroundColor: "#EFF6FF",
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: "center",
    },
    chatHeroStatValue: {
      color: "#1D4ED8",
      fontSize: 22,
      fontWeight: "900",
    },
    chatHeroStatLabel: {
      marginTop: 2,
      color: "#334155",
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    messageRow: { marginTop: 7, flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "90%" },
    messageRowMine: { alignSelf: "flex-end" },
    messageRowOther: { alignSelf: "flex-start" },
    bubble: {
      maxWidth: "100%",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
    },
    bubbleMine: {
      backgroundColor: "#DBEAFE",
      borderColor: "rgba(37,99,235,0.18)",
    },
    bubbleOther: {
      backgroundColor: "#FFFFFF",
      borderColor: "rgba(15,23,42,0.1)",
    },
    sender: { fontWeight: "900", fontSize: 11, marginBottom: 3 },
    senderMine: { color: "#256029" },
    senderOther: { color: theme.colors.textSecondary },
    body: { fontWeight: "700", lineHeight: 19 },
    bodyMine: { color: "#1F2937" },
    bodyOther: { color: "#1F2937" },
    metaRow: { marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 },
    time: { fontSize: 10, fontWeight: "700" },
    timeMine: { color: "#1D4ED8" },
    timeOther: { color: theme.colors.textSecondary },
    composer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: Platform.OS === "ios" ? 16 : 10,
      borderTopWidth: 1,
      borderTopColor: "rgba(15,23,42,0.08)",
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      marginHorizontal: 6,
      marginTop: 6,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#EFF6FF",
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 110,
      borderWidth: 1,
      borderColor: "rgba(15,23,42,0.08)",
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      color: theme.colors.text,
      fontWeight: "700",
      backgroundColor: theme.colors.background,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: "#2563EB",
      alignItems: "center",
      justifyContent: "center",
    },
  });
