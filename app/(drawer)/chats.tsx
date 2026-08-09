import { PageShell } from "@/components/page_shell";
import { ChatAvatar, getChatAvatarTone } from "@/components/chat_avatar";
import { useAuth } from "@/contexts/auth_context";
import { getConversationReadAt, getConversations } from "@/services/chats.services";
import type { ConversationRow } from "@/services/backend.types";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function ChatsEntryPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 1100;
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = React.useState(true);
  const [allConversations, setAllConversations] = React.useState<ConversationRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const refresh = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const listResult = await getConversations({ requesterId: user.id, page: 1, itemsPerPage: 200 });
      setAllConversations(listResult?.conversations ?? []);
    } catch {
      setAllConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredConversations = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allConversations;
    return allConversations.filter((row) => {
      const rowTitle =
        row.kind === "group"
          ? row.title || "Group chat"
          : row.members
              .filter((member) => member.id !== user?.id)
              .map((member) => member.full_name || "Unknown")
              .join(", ") || "Direct chat";
      const lastBody = row.last_message?.body || "";
      return rowTitle.toLowerCase().includes(query) || lastBody.toLowerCase().includes(query);
    });
  }, [allConversations, searchQuery, user?.id]);

  return (
    <PageShell scrollable={false} contentStyle={{ flex: 1, paddingBottom: 10, paddingTop: 14 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        style={{ flex: 1 }}
      >
        <View style={styles.page}>
          {isWideWeb && (
            <View style={styles.sidebar}>
              <View style={styles.sidebarSearch}>
                <Ionicons name="search-outline" size={16} color="#71819A" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search conversation..."
                  placeholderTextColor="#71819A"
                  style={styles.sidebarSearchInput}
                />
              </View>

              <ScrollView contentContainerStyle={styles.sidebarList}>
                {filteredConversations.map((row, index) => {
                  const directMember = row.members.find((member) => member.id !== user?.id);
                  const rowTitle =
                    row.kind === "group"
                      ? row.title || "Group chat"
                      : row.members
                          .filter((member) => member.id !== user?.id)
                          .map((member) => member.full_name || "Unknown")
                          .join(", ") || "Direct chat";
                  const rowSub = formatConversationPreview(row.last_message?.body);
                  const localReadAt = user?.id ? getConversationReadAt(user.id, row.id) : null;
                  const unread =
                    typeof row.unread_count === "number"
                      ? Math.max(row.unread_count, 0)
                      : row.last_message?.sender_id &&
                          row.last_message.sender_id !== user?.id &&
                          (!localReadAt || new Date(row.last_message.created_at).getTime() > new Date(localReadAt).getTime())
                        ? 1
                        : 0;
                  const avatarTone = getChatAvatarTone(index);
                  return (
                    <TouchableOpacity
                      key={row.id}
                      style={styles.chatItem}
                      onPress={() => router.replace(`/chats/${row.id}` as any)}
                    >
                      <ChatAvatar
                        name={rowTitle}
                        avatarColor={row.kind === "direct" ? directMember?.avatar_color ?? null : null}
                        size={42}
                        square
                        tone={avatarTone}
                      />
                      <View style={styles.chatCopy}>
                        <View style={styles.chatTopline}>
                          <Text style={styles.chatName} numberOfLines={1}>
                            {rowTitle}
                          </Text>
                          <Text style={styles.chatTime}>{formatConversationTime(row.last_message?.created_at)}</Text>
                        </View>
                        <Text style={styles.chatLast} numberOfLines={1}>
                          {rowSub}
                        </Text>
                      </View>
                      <View style={styles.chatMeta}>
                        {unread ? (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{unread}</Text>
                          </View>
                        ) : (
                          <Ionicons name="checkmark-done-outline" size={13} color="#94A3B8" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.mainPanel}>
            <View style={styles.messagesWrap}>
              <ScrollView
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
                contentContainerStyle={styles.messagesContent}
              >
                {loading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.emptyTitle}>Loading conversations</Text>
                    <Text style={styles.emptySub}>Your team messages are being prepared.</Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No conversation selected</Text>
                    <Text style={styles.emptySub}>Choose a conversation from the left to open the full chat workspace.</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.composer}>
              <TouchableOpacity style={styles.composerIcon} disabled>
                <Ionicons name="attach-outline" size={18} color="#59708F" />
              </TouchableOpacity>
              <View style={styles.composerField}>
                <TextInput
                  value=""
                  editable={false}
                  placeholder="Select a conversation to start messaging..."
                  placeholderTextColor="#71819A"
                  style={styles.input}
                />
              </View>
              <TouchableOpacity style={[styles.composerIcon, styles.sendBtn]} disabled>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </PageShell>
  );
}

function formatConversationPreview(body?: string | null) {
  if (!body) return "No messages yet";
  if (body.startsWith("[medsync-reply]")) {
    try {
      const parsed = JSON.parse(body.slice("[medsync-reply]".length));
      return formatConversationPreview(String(parsed?.body || ""));
    } catch {
      return "Reply";
    }
  }
  if (body.startsWith("[medsync-call]")) {
    return body.includes('"mode":"video"') ? "Started a video call" : "Started an audio call";
  }
  if (body.startsWith("[medsync-doc]")) {
    try {
      const parsed = JSON.parse(body.slice("[medsync-doc]".length));
      return `Document: ${String(parsed?.name || "Attachment")}`;
    } catch {
      return "Document attachment";
    }
  }
  if (body.startsWith("[medsync-reaction]")) {
    return "Activity update";
  }
  return body;
}

function formatConversationTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: {
      flex: 1,
      flexDirection: "row",
      gap: 14,
      minHeight: 0,
    },
    sidebar: {
      width: 300,
      padding: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#D4E2F3",
      backgroundColor: "rgba(255,255,255,0.92)",
      minHeight: 0,
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0 18px 48px rgba(48,80,130,0.10)",
          } as any)
        : null),
    },
    sidebarSearch: {
      height: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#DCE7F5",
      backgroundColor: "#F6F9FD",
      marginBottom: 10,
    },
    sidebarSearchInput: {
      flex: 1,
      color: "#71819A",
      fontSize: 13,
      fontWeight: "600",
    },
    sidebarList: {
      gap: 9,
      paddingBottom: 12,
    },
    chatItem: {
      minHeight: 68,
      padding: 11,
      borderRadius: 18,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "transparent",
      backgroundColor: "transparent",
    },
    chatCopy: {
      flex: 1,
      minWidth: 0,
    },
    chatMeta: {
      alignSelf: "flex-end",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      minWidth: 24,
    },
    chatTopline: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    chatName: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
    chatTime: {
      color: "#7B8AA1",
      fontSize: 10.5,
      fontWeight: "700",
    },
    chatLast: {
      marginTop: 4,
      color: "#64748B",
      fontSize: 12,
      fontWeight: "700",
    },
    unreadBadge: {
      minWidth: 23,
      height: 23,
      paddingHorizontal: 7,
      borderRadius: 999,
      backgroundColor: "#2563EB",
      alignItems: "center",
      justifyContent: "center",
    },
    unreadText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    mainPanel: {
      flex: 1,
      minHeight: 0,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#D4E2F3",
      backgroundColor: "rgba(255,255,255,0.92)",
      overflow: "hidden",
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0 18px 48px rgba(48,80,130,0.10)",
          } as any)
        : null),
    },
    messagesWrap: {
      flex: 1,
      minHeight: 0,
      position: "relative",
    },
    messagesContent: {
      paddingHorizontal: 16,
      paddingVertical: 18,
      paddingBottom: 14,
      flexGrow: 1,
      justifyContent: "center",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      gap: 6,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    emptySub: {
      marginTop: 6,
      color: "#64748B",
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
    composer: {
      minHeight: 64,
      marginHorizontal: 14,
      marginBottom: 14,
      padding: 9,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: "#DCE7F5",
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    composerIcon: {
      width: 44,
      height: 44,
      borderRadius: 17,
      backgroundColor: "#EDF3FB",
      alignItems: "center",
      justifyContent: "center",
    },
    composerField: {
      flex: 1,
      minHeight: 46,
      maxHeight: 120,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#DCE7F5",
      backgroundColor: "#F6F9FD",
      paddingHorizontal: 14,
      justifyContent: "center",
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      color: "#334155",
      fontSize: 14,
      fontWeight: "600",
      paddingVertical: 9,
    },
    sendBtn: {
      backgroundColor: "#2563EB",
    },
  });
