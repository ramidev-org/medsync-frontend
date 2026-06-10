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
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type MessageGroup = {
  label: string;
  items: ChatMessageRow[];
};

export default function ChatConversationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const conversationId = String(id ?? "");
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === "web" && width >= 1100;
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const messagesRef = React.useRef<ScrollView | null>(null);
  const groupOffsetsRef = React.useRef<Record<string, number>>({});
  const floatingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<ChatMessageRow[]>([]);
  const [conversation, setConversation] = React.useState<ConversationRow | null>(null);
  const [allConversations, setAllConversations] = React.useState<ConversationRow[]>([]);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [floatingDate, setFloatingDate] = React.useState("Today");
  const [showFloatingDate, setShowFloatingDate] = React.useState(false);
  const [activeMessageId, setActiveMessageId] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    messagesRef.current?.scrollToEnd({ animated: true });
  }, [rows.length, conversationId]);

  const title = React.useMemo(() => {
    if (!conversation) return conversationId ? `Conversation ${conversationId.slice(0, 8)}...` : "Conversation";
    if (conversation.kind === "group") return conversation.title || "Group chat";
    const others = conversation.members.filter((m) => m.id !== user?.id);
    return others.map((m) => m.full_name || "Unknown").join(", ") || "Direct chat";
  }, [conversation, conversationId, user?.id]);

  const subtitle = React.useMemo(() => {
    if (!conversation) return "Internal clinic chat";
    return conversation.kind === "group" ? `${conversation.members.length} participants` : "Online team chat";
  }, [conversation]);

  const talkingWith = React.useMemo(() => {
    if (!conversation) return "Unknown";
    if (conversation.kind === "group") return conversation.title || "Group chat";
    const other = conversation.members.find((m) => m.id !== user?.id);
    return other?.full_name || "Direct chat";
  }, [conversation, user?.id]);

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

  const groupedMessages = React.useMemo(() => groupMessagesByDay(rows), [rows]);

  React.useEffect(() => {
    if (groupedMessages.length > 0) {
      setFloatingDate(groupedMessages[groupedMessages.length - 1].label);
    }
  }, [groupedMessages]);

  React.useEffect(() => {
    return () => {
      if (floatingTimerRef.current) {
        clearTimeout(floatingTimerRef.current);
      }
    };
  }, []);

  const onMessagesScroll = React.useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const sorted = Object.entries(groupOffsetsRef.current).sort((a, b) => a[1] - b[1]);
      let currentLabel = groupedMessages[0]?.label;

      sorted.forEach(([label, top]) => {
        if (top - offsetY <= 72) currentLabel = label;
      });

      if (currentLabel) {
        setFloatingDate(currentLabel);
        setShowFloatingDate(true);
        if (floatingTimerRef.current) clearTimeout(floatingTimerRef.current);
        floatingTimerRef.current = setTimeout(() => setShowFloatingDate(false), 850);
      }
    },
    [groupedMessages],
  );

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
        <View style={styles.page}>
          {isWideWeb && (
            <View style={styles.sidebar}>
              <View style={styles.brandPill}>
                <Ionicons name="chatbubbles-outline" size={14} color="#2563EB" />
                <Text style={styles.brandPillText}>MedSync Chat</Text>
              </View>
              <Text style={styles.sidebarTitle}>Chats</Text>
              <Text style={styles.sidebarSub}>Recent clinic conversations</Text>

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
                  const active = row.id === conversationId;
                  const rowTitle =
                    row.kind === "group"
                      ? row.title || "Group chat"
                      : row.members
                          .filter((member) => member.id !== user?.id)
                          .map((member) => member.full_name || "Unknown")
                          .join(", ") || "Direct chat";
                  const rowSub = row.last_message?.body || "No messages yet";
                  const unread = row.last_message?.sender_id && row.last_message.sender_id !== user?.id && !active ? 1 : 0;
                  const avatarTone = getAvatarTone(index);
                  return (
                    <TouchableOpacity
                      key={row.id}
                      style={[styles.chatItem, active ? styles.chatItemActive : null]}
                      onPress={() => router.replace(`/chats/${row.id}` as any)}
                    >
                      <Avatar name={rowTitle} theme={theme} size={42} square tone={avatarTone} presence={unread ? "online" : "away"} />
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
            {!!conversation && (
              <View style={styles.chatHeader}>
                <View style={styles.personWrap}>
                  <Avatar name={talkingWith} theme={theme} size={42} square tone={getAvatarTone(1)} presence="online" />
                  <View style={styles.personCopy}>
                    <Text style={styles.personName} numberOfLines={1}>
                      {title}
                    </Text>
                    <View style={styles.personStatusRow}>
                      <View style={styles.statusDot} />
                      <Text style={styles.personStatus} numberOfLines={1}>
                        {subtitle}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  <HeaderIconButton icon="search-outline" />
                  <HeaderIconButton icon="call-outline" />
                  <HeaderIconButton icon="ellipsis-horizontal" />
                </View>
              </View>
            )}

            <View style={styles.messagesWrap}>
              <View style={[styles.floatingDate, showFloatingDate ? styles.floatingDateVisible : null]}>
                <Text style={styles.floatingDateText}>{floatingDate}</Text>
              </View>
              <ScrollView
                ref={messagesRef}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
                contentContainerStyle={styles.messagesContent}
                onScroll={onMessagesScroll}
                scrollEventThrottle={16}
              >
                {groupedMessages.map((group) => (
                  <View
                    key={group.label}
                    style={styles.groupWrap}
                    onLayout={(event) => {
                      groupOffsetsRef.current[group.label] = event.nativeEvent.layout.y;
                    }}
                  >
                    <View style={styles.datePill}>
                      <Text style={styles.datePillText}>{group.label}</Text>
                    </View>
                    {group.items.map((item, index) => {
                      const mine = item.sender_id === user?.id;
                      const active = activeMessageId === item.id;
                      return (
                        <View key={item.id} style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
                          {!mine && (
                            <Avatar
                              name={item.sender_name || "Staff"}
                              theme={theme}
                              size={28}
                              square
                              small
                              tone={getAvatarTone(index)}
                            />
                          )}
                          <View style={[styles.messageStack, mine ? styles.messageStackMine : null]}>
                            {!mine && (
                              <Text style={styles.senderLabel} numberOfLines={1}>
                                {item.sender_name || "Staff"}
                              </Text>
                            )}
                            <Pressable
                              onHoverIn={() => setActiveMessageId(item.id)}
                              onHoverOut={() => setActiveMessageId((current) => (current === item.id ? null : current))}
                              onPress={() => setActiveMessageId((current) => (current === item.id ? null : item.id))}
                              style={styles.messageBubbleWrap}
                            >
                              <View style={[styles.messageBubble, mine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
                                <View style={[styles.messageActions, active ? styles.messageActionsVisible : null]}>
                                  <TouchableOpacity style={styles.messageActionBtn}>
                                    <Ionicons name="return-up-back-outline" size={13} color="#64748B" />
                                  </TouchableOpacity>
                                  <TouchableOpacity style={styles.messageActionBtn}>
                                    <Ionicons name="heart-outline" size={13} color="#64748B" />
                                  </TouchableOpacity>
                                  <TouchableOpacity style={styles.messageActionBtn}>
                                    <Ionicons name="ellipsis-horizontal" size={13} color="#64748B" />
                                  </TouchableOpacity>
                                </View>
                                <Text style={[styles.messageBody, mine ? styles.messageBodyMine : styles.messageBodyOther]}>{item.body}</Text>
                              </View>
                            </Pressable>
                            <View style={[styles.messageMeta, mine ? styles.messageMetaMine : null]}>
                              <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
                              {mine && <Ionicons name="checkmark-done-outline" size={12} color="#71819A" />}
                            </View>
                            {shouldShowReaction(item.body) && (
                              <View style={styles.reactionPill}>
                                <Text style={styles.reactionText}>👍</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}

                {!loading && rows.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No messages yet</Text>
                    <Text style={styles.emptySub}>Start the conversation and your team updates will appear here.</Text>
                  </View>
                )}

                {!loading && !!conversation && (
                  <View style={styles.typingRow}>
                    <View style={styles.typingDots}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                    <Text style={styles.typingText}>{talkingWith} channel is ready</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.composer}>
              <TouchableOpacity style={styles.composerIcon}>
                <Ionicons name="attach-outline" size={18} color="#59708F" />
              </TouchableOpacity>
              <View style={styles.composerField}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Write a message..."
                  placeholderTextColor="#71819A"
                  style={styles.input}
                  multiline
                />
                <Ionicons name="happy-outline" size={18} color="#71819A" />
              </View>
              {text.trim().length > 0 ? (
                <TouchableOpacity onPress={onSend} disabled={sending} style={[styles.composerIcon, styles.sendBtn]}>
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.composerIcon}>
                  <Ionicons name="mic-outline" size={18} color="#59708F" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </PageShell>
  );
}

function HeaderIconButton({ icon }: { icon: React.ComponentProps<typeof Ionicons>["name"] }) {
  return (
    <TouchableOpacity style={headerButtonStyles.button}>
      <Ionicons name={icon} size={18} color="#405B82" />
    </TouchableOpacity>
  );
}

const headerButtonStyles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DCE7F5",
    backgroundColor: "#F8FBFF",
    alignItems: "center",
    justifyContent: "center",
  },
});

function groupMessagesByDay(rows: ChatMessageRow[]): MessageGroup[] {
  const map = new Map<string, ChatMessageRow[]>();
  rows.forEach((row) => {
    const key = formatDayKey(row.created_at);
    const group = map.get(key) ?? [];
    group.push(row);
    map.set(key, group);
  });
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function formatDayKey(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((today.getTime() - value.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return iso;
  }
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatConversationTime(iso?: string | null) {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (sameDay) {
      return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
    }

    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  } catch {
    return "";
  }
}

function getAvatarTone(index: number) {
  const tones = ["blue", "green", "purple", "orange"] as const;
  return tones[index % tones.length];
}

function shouldShowReaction(body: string) {
  const value = body.toLowerCase();
  return value.includes("done") || value.includes("received") || value.includes("ok") || value.includes("thanks");
}

function Avatar({
  name,
  theme,
  size = 36,
  square = false,
  small = false,
  tone = "blue",
  presence,
}: {
  name: string;
  theme: any;
  size?: number;
  square?: boolean;
  small?: boolean;
  tone?: "blue" | "green" | "purple" | "orange";
  presence?: "online" | "away";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const tones = {
    blue: { backgroundColor: "#EDF5FF", borderColor: "#CCDBF1", color: "#1D4ED8" },
    green: { backgroundColor: "#EAFBF4", borderColor: "#BCEBD6", color: "#047857" },
    purple: { backgroundColor: "#F3EDFF", borderColor: "#DED2FF", color: "#7C3AED" },
    orange: { backgroundColor: "#FFF7ED", borderColor: "#FED7AA", color: "#EA580C" },
  } as const;
  const palette = tones[tone];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: square ? Math.max(11, size * 0.36) : size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: palette.borderColor,
        backgroundColor: small ? "#F8FBFF" : palette.backgroundColor,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Text style={{ fontWeight: "900", color: palette.color, fontSize: Math.max(9, size * 0.28) }}>
        {initials || "?"}
      </Text>
      {!!presence && (
        <View
          style={{
            position: "absolute",
            right: 2,
            bottom: 2,
            width: Math.max(9, size * 0.26),
            height: Math.max(9, size * 0.26),
            borderRadius: 999,
            borderWidth: 2,
            borderColor: "#FFFFFF",
            backgroundColor: presence === "online" ? "#22C55E" : "#F59E0B",
          }}
        />
      )}
    </View>
  );
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
    brandPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 30,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: "#EDF5FF",
    },
    brandPillText: {
      color: "#2563EB",
      fontSize: 12,
      fontWeight: "900",
    },
    sidebarTitle: {
      marginTop: 16,
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.6,
    },
    sidebarSub: {
      marginTop: 2,
      marginBottom: 12,
      color: "#64748B",
      fontSize: 12,
      fontWeight: "800",
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
      fontWeight: "800",
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
    chatItemActive: {
      backgroundColor: "#EDF5FF",
      borderColor: "#78A9FF",
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
      fontWeight: "900",
    },
    chatTime: {
      color: "#7B8AA1",
      fontSize: 10.5,
      fontWeight: "900",
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
      fontWeight: "900",
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
    chatHeader: {
      minHeight: 66,
      margin: 14,
      marginBottom: 0,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#DCE7F5",
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    personWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      flex: 1,
      minWidth: 0,
    },
    personCopy: {
      flex: 1,
      minWidth: 0,
    },
    personName: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "900",
    },
    personStatusRow: {
      marginTop: 5,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: "#22C55E",
    },
    personStatus: {
      color: "#64748B",
      fontSize: 12,
      fontWeight: "800",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
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
    },
    floatingDate: {
      position: "absolute",
      top: 10,
      left: "50%",
      transform: [{ translateX: -60 }],
      zIndex: 5,
      opacity: 0,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: "rgba(237,245,255,0.96)",
      borderWidth: 1,
      borderColor: "#D7E7FF",
    },
    floatingDateVisible: {
      opacity: 1,
    },
    floatingDateText: {
      color: "#64748B",
      fontSize: 11,
      fontWeight: "900",
    },
    groupWrap: {
      marginBottom: 8,
    },
    datePill: {
      alignSelf: "center",
      marginBottom: 12,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: "#EDF5FF",
      borderWidth: 1,
      borderColor: "#D7E7FF",
    },
    datePillText: {
      color: "#64748B",
      fontSize: 11,
      fontWeight: "900",
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      marginVertical: 8,
    },
    messageRowMine: {
      justifyContent: "flex-end",
    },
    messageRowOther: {
      justifyContent: "flex-start",
    },
    messageStack: {
      maxWidth: "72%",
      alignItems: "flex-start",
    },
    messageStackMine: {
      alignItems: "flex-end",
      marginLeft: "auto",
    },
    senderLabel: {
      marginBottom: 4,
      marginLeft: 4,
      color: "#64748B",
      fontSize: 11,
      fontWeight: "900",
    },
    messageBubble: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      position: "relative",
    },
    messageBubbleWrap: {
      position: "relative",
    },
    messageBubbleMine: {
      backgroundColor: "#DCECFF",
      borderColor: "#A9CFFF",
      borderBottomRightRadius: 7,
    },
    messageBubbleOther: {
      backgroundColor: "#FFFFFF",
      borderColor: "#DCE7F5",
      borderBottomLeftRadius: 7,
    },
    messageBody: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700",
    },
    messageBodyMine: {
      color: "#15315D",
    },
    messageBodyOther: {
      color: "#1F2937",
    },
    messageActions: {
      position: "absolute",
      top: -14,
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      opacity: 0,
      padding: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#DCE7F5",
      backgroundColor: "#FFFFFF",
    },
    messageActionsVisible: {
      opacity: 1,
    },
    messageActionBtn: {
      width: 24,
      height: 24,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    messageMeta: {
      marginTop: 5,
      paddingHorizontal: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    messageMetaMine: {
      justifyContent: "flex-end",
    },
    messageTime: {
      color: "#76869B",
      fontSize: 10.5,
      fontWeight: "900",
    },
    reactionPill: {
      marginTop: -3,
      marginLeft: 10,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#DCE7F5",
      backgroundColor: "#FFFFFF",
      alignSelf: "flex-start",
    },
    reactionText: {
      fontSize: 12,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    emptySub: {
      marginTop: 6,
      color: "#64748B",
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
    typingRow: {
      marginTop: 10,
      marginBottom: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    typingDots: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#DCE7F5",
    },
    typingDot: {
      width: 5,
      height: 5,
      borderRadius: 999,
      backgroundColor: "#94A3B8",
    },
    typingText: {
      color: "#64748B",
      fontSize: 12,
      fontWeight: "800",
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
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      color: "#334155",
      fontSize: 14,
      fontWeight: "800",
      paddingVertical: 9,
    },
    sendBtn: {
      backgroundColor: "#2563EB",
    },
  });
