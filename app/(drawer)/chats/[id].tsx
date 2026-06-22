import { PageShell } from "@/components/page_shell";
import { ChatAvatar, getChatAvatarTone } from "@/components/chat_avatar";
import { useAuth } from "@/contexts/auth_context";
import { db } from "@/database/database_conn";
import {
  buildCallChannelName,
  buildIncomingCallChannelName,
  buildPresenceChannelName,
  createCallSessionId,
  openCallSessionTab,
  type CallInvitePayload,
  type CallMode,
} from "@/services/calling";
import { getConversations, getMessages, sendMessage } from "@/services/chats.services";
import type { ChatMessageRow, ConversationRow } from "@/services/backend.types";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
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

type ChatDocumentPayload = {
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};

type ChatReactionPayload = {
  messageId: string;
  emoji: string;
};

type ChatReplyPayload = {
  messageId: string;
  senderName: string;
  snippet: string;
};

type ChatReplyEnvelope = {
  replyTo: ChatReplyPayload;
  body: string;
};

const DOCUMENT_PREFIX = "[medsync-doc]";
const REACTION_PREFIX = "[medsync-reaction]";
const REPLY_PREFIX = "[medsync-reply]";
const REACTION_OPTIONS = ["\u{1F44D}", "\u2764\uFE0F", "\u{1F602}", "\u{1F60E}", "\u{1F680}"];
const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

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
  const shouldStickToBottomRef = React.useRef(true);
  const presenceChannelRef = React.useRef<ReturnType<typeof db.channel> | null>(null);
  const incomingChannelRef = React.useRef<ReturnType<typeof db.channel> | null>(null);

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
  const [replyingTo, setReplyingTo] = React.useState<ChatReplyPayload | null>(null);
  const [incomingCallInvite, setIncomingCallInvite] = React.useState<CallInvitePayload | null>(null);
  const [onlineUserIds, setOnlineUserIds] = React.useState<string[]>([]);

  const refresh = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!user?.id || !conversationId) return;
    if (!options?.silent) setLoading(true);
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
      if (!options?.silent) {
        Alert.alert("Error", e?.message || "Failed to load messages");
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [conversationId, user?.id]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!user?.id || !conversationId) return;
    const intervalId = setInterval(() => {
      void refresh({ silent: true });
    }, 7000);
    return () => clearInterval(intervalId);
  }, [conversationId, refresh, user?.id]);

  React.useEffect(() => {
    if (shouldStickToBottomRef.current) {
      messagesRef.current?.scrollToEnd({ animated: true });
    }
  }, [rows.length, conversationId]);

  React.useEffect(() => {
    setReplyingTo(null);
    setActiveMessageId(null);
  }, [conversationId]);

  const title = React.useMemo(() => {
    if (!conversation) return conversationId ? `Conversation ${conversationId.slice(0, 8)}...` : "Conversation";
    if (conversation.kind === "group") return conversation.title || "Group chat";
    const others = conversation.members.filter((m) => m.id !== user?.id);
    return others.map((m) => m.full_name || "Unknown").join(", ") || "Direct chat";
  }, [conversation, conversationId, user?.id]);

  const talkingWith = React.useMemo(() => {
    if (!conversation) return "Unknown";
    if (conversation.kind === "group") return conversation.title || "Group chat";
    const other = conversation.members.find((m) => m.id !== user?.id);
    return other?.full_name || "Direct chat";
  }, [conversation, user?.id]);

  const otherParticipant = React.useMemo(() => {
    if (!conversation || conversation.kind === "group") return null;
    return conversation.members.find((member) => member.id !== user?.id) ?? null;
  }, [conversation, user?.id]);

  const isOtherParticipantOnline = React.useMemo(() => {
    if (!otherParticipant?.id) return false;
    return onlineUserIds.includes(otherParticipant.id);
  }, [onlineUserIds, otherParticipant?.id]);

  const subtitle = React.useMemo(() => {
    if (!conversation) return "Internal clinic chat";
    if (conversation.kind === "group") return `${conversation.members.length} participants`;
    return isOtherParticipantOnline ? "Online now" : "Offline";
  }, [conversation, isOtherParticipantOnline]);

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

  const visibleRows = React.useMemo(() => rows.filter((row) => !parseReactionMessage(row.body)), [rows]);
  const reactionsByMessage = React.useMemo(() => buildReactionsMap(rows), [rows]);
  const messageLookup = React.useMemo(
    () => Object.fromEntries(visibleRows.map((row) => [row.id, row])),
    [visibleRows],
  );
  const groupedMessages = React.useMemo(() => groupMessagesByDay(visibleRows), [visibleRows]);

  const resetCallUi = React.useCallback(() => {
    setIncomingCallInvite(null);
  }, []);

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
      presenceChannelRef.current?.unsubscribe();
      incomingChannelRef.current?.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (!user?.id || !user?.clinic_id) return;

    const channel = db.channel(buildPresenceChannelName(user.clinic_id), {
      config: {
        presence: { key: user.id },
      },
    });

    const syncPresence = () => {
      const state = channel.presenceState<Record<string, unknown>>();
      setOnlineUserIds(Object.keys(state));
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence);

    presenceChannelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await channel.track({
        userId: user.id,
        fullName: user.fullname || user.email || "Team member",
        updatedAt: new Date().toISOString(),
      });
      syncPresence();
    });

    return () => {
      channel.unsubscribe();
      if (presenceChannelRef.current === channel) presenceChannelRef.current = null;
    };
  }, [user?.clinic_id, user?.email, user?.fullname, user?.id]);

  React.useEffect(() => {
    if (!user?.id || !user?.clinic_id) return;

    const channel = db.channel(buildIncomingCallChannelName(user.clinic_id, user.id), {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "incoming-call" }, ({ payload }) => {
      const invite = payload as CallInvitePayload;
      if (!invite?.sessionId || invite.receiverId !== user.id) return;
      setIncomingCallInvite(invite);
    });

    incomingChannelRef.current = channel;
    channel.subscribe();

    return () => {
      channel.unsubscribe();
      if (incomingChannelRef.current === channel) incomingChannelRef.current = null;
    };
  }, [user?.clinic_id, user?.id]);

  const onMessagesScroll = React.useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const layoutHeight = event.nativeEvent.layoutMeasurement?.height ?? 0;
      const contentHeight = event.nativeEvent.contentSize?.height ?? 0;
      shouldStickToBottomRef.current = offsetY + layoutHeight >= contentHeight - 120;
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

  const sendBody = React.useCallback(async (body: string) => {
    if (!user?.id || !conversationId) return;
    const payload =
      replyingTo
        ? `${REPLY_PREFIX}${JSON.stringify({
            replyTo: replyingTo,
            body,
          } satisfies ChatReplyEnvelope)}`
        : body;

    setSending(true);
    try {
      const optimistic: ChatMessageRow = {
        id: `optimistic_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: user.fullname || user.email || "You",
        body: payload,
        created_at: new Date().toISOString(),
        edited_at: null,
      };
      shouldStickToBottomRef.current = true;
      setRows((prev) => [...prev, optimistic]);
      await sendMessage({ requesterId: user.id, conversationId, body: payload });
      setReplyingTo(null);
      await refresh({ silent: true });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send");
      await refresh({ silent: true });
    } finally {
      setSending(false);
    }
  }, [conversationId, refresh, replyingTo, user?.email, user?.fullname, user?.id]);

  const onSend = React.useCallback(async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    await sendBody(body);
  }, [sendBody, text]);

  const onPickDocument = React.useCallback(async () => {
    if (Platform.OS !== "web") {
      Alert.alert("Documents", "Document sending is currently available on web.");
      return;
    }

    try {
      const payload = await pickDocumentFromWeb();
      if (!payload) return;
      if (payload.size > MAX_DOCUMENT_BYTES) {
        Alert.alert("Document too large", "Please choose a document smaller than 2 MB.");
        return;
      }
      await sendBody(`${DOCUMENT_PREFIX}${JSON.stringify(payload)}`);
    } catch (error: any) {
      Alert.alert("Documents", error?.message || "Unable to attach this document.");
    }
  }, [sendBody]);

  const onReactToMessage = React.useCallback(async (messageId: string, emoji: string) => {
    await sendBody(`${REACTION_PREFIX}${JSON.stringify({ messageId, emoji } satisfies ChatReactionPayload)}`);
    setActiveMessageId(null);
  }, [sendBody]);

  const onReplyToMessage = React.useCallback((message: ChatMessageRow) => {
    setReplyingTo({
      messageId: message.id,
      senderName: message.sender_id === user?.id ? "You" : message.sender_name || "Staff",
      snippet: buildReplySnippet(message.body),
    });
    setActiveMessageId(null);
  }, [user?.id]);

  const startCall = React.useCallback(
    async () => {
      if (!user?.id || !conversationId || !conversation) return;
      if (Platform.OS !== "web") {
        showCallAlert("Call", "Calling is currently available on web only.");
        return;
      }
      if (conversation.kind !== "direct") {
        showCallAlert("Call", "Calls currently support direct conversations only.");
        return;
      }
      if (!user.clinic_id || !otherParticipant?.id) {
        showCallAlert("Call", "We could not determine who to call.");
        return;
      }

      try {
        const receiverId = otherParticipant.id;
        const sessionId = createCallSessionId();
        const startedBy = user.fullname || user.email || "Team member";

        const inviteChannel = db.channel(buildIncomingCallChannelName(user.clinic_id, receiverId), {
          config: { broadcast: { self: true } },
        });

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Unable to reach the receiver.")), 7000);
          inviteChannel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              clearTimeout(timeout);
              resolve();
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
              clearTimeout(timeout);
              reject(new Error("Unable to reach the receiver."));
            }
          });
        });

        await inviteChannel.send({
          type: "broadcast",
          event: "incoming-call",
          payload: {
            sessionId,
            conversationId,
            clinicId: user.clinic_id,
            callerId: user.id,
            callerName: startedBy,
            receiverId,
            mode: "audio",
            createdAt: new Date().toISOString(),
          } satisfies CallInvitePayload,
        });
        inviteChannel.unsubscribe();

        openCallSessionTab({
          sessionId,
          conversationId,
          clinicId: user.clinic_id,
          mode: "audio",
          role: "caller",
          peerId: receiverId,
          peerName: otherParticipant.full_name || "Team member",
          startedById: user.id,
          startedBy,
          receiverId,
        });
      } catch (error: any) {
        showCallAlert("Call", error?.message || "Unable to start the call.");
      }
    },
    [
      conversation,
      conversationId,
      otherParticipant?.id,
      user,
    ],
  );

  const acceptIncomingCall = React.useCallback(async () => {
    const invite = incomingCallInvite;
    if (!invite) return;

    try {
      setIncomingCallInvite(null);

      openCallSessionTab({
        sessionId: invite.sessionId,
        conversationId: invite.conversationId,
        clinicId: invite.clinicId,
        mode: invite.mode,
        role: "callee",
        peerId: invite.callerId,
        peerName: invite.callerName,
        startedById: invite.callerId,
        startedBy: invite.callerName,
        receiverId: invite.receiverId,
      });
    } catch (error: any) {
      showCallAlert("Call", error?.message || "Unable to join the call.");
    }
  }, [incomingCallInvite]);

  const declineIncomingCall = React.useCallback(async () => {
    const invite = incomingCallInvite;
    setIncomingCallInvite(null);
    resetCallUi();
    if (!invite) return;

    const tempChannel = db.channel(buildCallChannelName(invite.sessionId), {
      config: { broadcast: { self: true } },
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Unable to reach the call session.")), 7000);
        tempChannel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            resolve();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            clearTimeout(timeout);
            reject(new Error("Unable to reach the call session."));
          }
        });
      });

      await tempChannel.send({
        type: "broadcast",
        event: "reject",
        payload: {
          sessionId: invite.sessionId,
          rejectedById: user?.id || "",
          rejectedAt: new Date().toISOString(),
        },
      });
    } catch {}
    finally {
      tempChannel.unsubscribe();
    }
  }, [incomingCallInvite, resetCallUi, user?.id]);

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
                  const rowSub = formatConversationPreview(row.last_message?.body);
                  const unread = row.last_message?.sender_id && row.last_message.sender_id !== user?.id && !active ? 1 : 0;
                  const avatarTone = getChatAvatarTone(index);
                  return (
                    <TouchableOpacity
                      key={row.id}
                      style={[styles.chatItem, active ? styles.chatItemActive : null]}
                      onPress={() => router.replace(`/chats/${row.id}` as any)}
                    >
                      <ChatAvatar name={rowTitle} size={42} square tone={avatarTone} />
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
                  <ChatAvatar
                    name={talkingWith}
                    size={42}
                    square
                    tone={getChatAvatarTone(1)}
                  />
                  <View style={styles.personCopy}>
                    <Text style={styles.personName} numberOfLines={1}>
                      {title}
                    </Text>
                    <View style={styles.personStatusRow}>
                      <Text style={styles.personStatus} numberOfLines={1}>
                        {subtitle}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  <HeaderIconButton
                    icon="call-outline"
                    onPress={() => void startCall()}
                    disabled={!conversation || conversation.kind !== "direct"}
                  />
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
                    {group.items.map((item) => {
                      const mine = item.sender_id === user?.id;
                      const active = activeMessageId === item.id;
                      const replyData = parseReplyMessage(item.body);
                      return (
                        <View key={item.id} style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
                          <View style={[styles.messageStack, mine ? styles.messageStackMine : null]}>
                            <Text style={[styles.senderLabel, mine ? styles.senderLabelMine : null]} numberOfLines={1}>
                              {mine ? "You" : item.sender_name || "Staff"}
                            </Text>
                            <Pressable
                              onHoverIn={() => setActiveMessageId(item.id)}
                              onHoverOut={() => setActiveMessageId((current) => (current === item.id ? null : current))}
                              onPress={() => setActiveMessageId((current) => (current === item.id ? null : item.id))}
                              style={styles.messageBubbleWrap}
                            >
                              <MessageBubble
                                item={item}
                                mine={mine}
                                active={active}
                                replyTo={replyData?.replyTo ?? null}
                                replySource={replyData?.replyTo ? messageLookup[replyData.replyTo.messageId] ?? null : null}
                                reactions={reactionsByMessage[item.id] ?? []}
                                onReact={onReactToMessage}
                                onReply={onReplyToMessage}
                                styles={styles}
                              />
                            </Pressable>
                            <View style={[styles.messageMeta, mine ? styles.messageMetaMine : null]}>
                              <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
                              {mine && <Ionicons name="checkmark-done-outline" size={12} color="#71819A" />}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}

                {!loading && visibleRows.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No messages yet</Text>
                    <Text style={styles.emptySub}>Start the conversation and your team updates will appear here.</Text>
                  </View>
                )}

                {!!conversation && sending && (
                  <View style={styles.typingRow}>
                    <ActivityIndicator size="small" color="#64748B" />
                    <Text style={styles.typingText}>Sending message...</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.composer}>
              <TouchableOpacity style={styles.composerIcon} onPress={() => void onPickDocument()} disabled={sending}>
                <Ionicons name="attach-outline" size={18} color="#59708F" />
              </TouchableOpacity>
              <View style={styles.composerField}>
                {replyingTo ? (
                  <View style={styles.replyComposerCard}>
                    <View style={styles.replyComposerStripe} />
                    <View style={styles.replyComposerCopy}>
                      <Text style={styles.replyComposerLabel} numberOfLines={1}>
                        Replying to {replyingTo.senderName}
                      </Text>
                      <Text style={styles.replyComposerSnippet} numberOfLines={1}>
                        {replyingTo.snippet}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.replyComposerClose} onPress={() => setReplyingTo(null)}>
                      <Ionicons name="close" size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ) : null}
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={replyingTo ? "Write your reply..." : "Write a message..."}
                  placeholderTextColor="#71819A"
                  style={styles.input}
                  multiline
                />
              </View>
              <TouchableOpacity
                onPress={onSend}
                disabled={sending || text.trim().length === 0}
                style={[styles.composerIcon, styles.sendBtn, sending || text.trim().length === 0 ? styles.composerIconDisabled : null]}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {Platform.OS === "web" && incomingCallInvite ? (
              <View style={styles.callInviteOverlay}>
                <View style={styles.callInviteModal}>
                  <Text style={styles.callInviteOverlayTitle}>
                    Incoming audio call
                  </Text>
                  <Text style={styles.callInviteOverlayText}>
                    {incomingCallInvite.callerName} is calling you. Accepting will open the call in a new browser tab so you can keep chatting here.
                  </Text>
                  <View style={styles.callInviteOverlayActions}>
                    <TouchableOpacity style={styles.callDeclineBtn} onPress={() => void declineIncomingCall()}>
                      <Text style={styles.callDeclineBtnText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callAcceptBtn} onPress={() => void acceptIncomingCall()}>
                      <Text style={styles.callAcceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

          </View>
        </View>
      </KeyboardAvoidingView>
    </PageShell>
  );
}

function HeaderIconButton({
  icon,
  onPress,
  active = false,
  disabled = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[headerButtonStyles.button, active ? headerButtonStyles.buttonActive : null, disabled ? headerButtonStyles.buttonDisabled : null]}
    >
      <Ionicons name={icon} size={18} color="#405B82" />
    </TouchableOpacity>
  );
}

function MessageBubble({
  item,
  mine,
  active,
  replyTo,
  replySource,
  reactions,
  onReact,
  onReply,
  styles,
}: {
  item: ChatMessageRow;
  mine: boolean;
  active: boolean;
  replyTo: ChatReplyPayload | null;
  replySource: ChatMessageRow | null;
  reactions: Array<{ emoji: string; count: number }>;
  onReact: (messageId: string, emoji: string) => void | Promise<void>;
  onReply: (message: ChatMessageRow) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const normalizedBody = getMessageBody(item.body);
  const invite = parseLegacyCallInvite(normalizedBody);
  const documentPayload = parseDocumentMessage(normalizedBody);

  const renderReactionPicker = () =>
    active ? (
      <View style={styles.messageActions}>
        <TouchableOpacity style={styles.replyActionBtn} onPress={() => onReply(item)}>
          <Ionicons name="return-up-back-outline" size={14} color="#405B82" />
        </TouchableOpacity>
        {REACTION_OPTIONS.map((emoji) => (
          <TouchableOpacity key={`${item.id}_${emoji}`} style={styles.emojiPickerBtn} onPress={() => void onReact(item.id, emoji)}>
            <Text style={styles.emojiPickerText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : null;

  const renderReplyPreview = () =>
    replyTo ? (
      <View style={styles.replyPreview}>
        <View style={styles.replyPreviewStripe} />
        <View style={styles.replyPreviewCopy}>
          <Text style={[styles.replyPreviewName, mine ? styles.replyPreviewNameMine : null]} numberOfLines={1}>
            {replyTo.senderName}
          </Text>
          <Text style={[styles.replyPreviewSnippet, mine ? styles.replyPreviewSnippetMine : null]} numberOfLines={2}>
            {replySource ? buildReplySnippet(replySource.body) : replyTo.snippet}
          </Text>
        </View>
      </View>
    ) : null;

  const renderReactions = () =>
    reactions.length > 0 ? (
      <View style={styles.messageReactions}>
        {reactions.map((reaction) => (
          <TouchableOpacity key={`${item.id}_${reaction.emoji}`} style={styles.reactionChip} onPress={() => void onReact(item.id, reaction.emoji)}>
            <Text style={styles.reactionChipEmoji}>{reaction.emoji}</Text>
            <Text style={styles.reactionChipCount}>{reaction.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : null;

  if (invite) {
    return (
      <View style={[styles.messageBubble, mine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
        {renderReactionPicker()}
        {renderReplyPreview()}
        <View style={styles.callInviteCard}>
          <View style={styles.callInviteHeader}>
            <Ionicons
              name={invite.mode === "video" ? "videocam-outline" : "call-outline"}
              size={16}
              color={mine ? "#EFF6FF" : "#2563EB"}
            />
            <Text style={[styles.callInviteTitle, mine ? styles.callInviteTitleMine : null]}>
              {invite.mode === "video" ? "Video call invite" : "Audio call invite"}
            </Text>
          </View>
          <Text style={[styles.callInviteMeta, mine ? styles.callInviteMetaMine : null]}>
            Legacy invite from {invite.startedBy}
          </Text>
          <View style={[styles.callInviteButton, mine ? styles.callInviteButtonMine : null]}>
            <Ionicons name="time-outline" size={15} color={mine ? "#1D4ED8" : "#fff"} />
            <Text style={[styles.callInviteButtonText, mine ? styles.callInviteButtonTextMine : null]}>Legacy call log</Text>
          </View>
        </View>
        {renderReactions()}
      </View>
    );
  }

  if (documentPayload) {
    return (
      <View style={[styles.messageBubble, mine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
        {renderReactionPicker()}
        {renderReplyPreview()}
        <View style={styles.documentCard}>
          <View style={styles.documentHeader}>
            <View style={[styles.documentIconWrap, mine ? styles.documentIconWrapMine : null]}>
              <Ionicons name="document-text-outline" size={18} color={mine ? "#1D4ED8" : "#2563EB"} />
            </View>
            <View style={styles.documentCopy}>
              <Text style={[styles.documentName, mine ? styles.documentNameMine : null]} numberOfLines={1}>
                {documentPayload.name}
              </Text>
              <Text style={[styles.documentMeta, mine ? styles.documentMetaMine : null]}>
                {formatFileSize(documentPayload.size)} • {formatDocumentType(documentPayload.mimeType)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.documentButton, mine ? styles.documentButtonMine : null]} onPress={() => void openDocumentPayload(documentPayload)}>
            <Ionicons name="download-outline" size={15} color={mine ? "#1D4ED8" : "#FFFFFF"} />
            <Text style={[styles.documentButtonText, mine ? styles.documentButtonTextMine : null]}>Open document</Text>
          </TouchableOpacity>
        </View>
        {renderReactions()}
      </View>
    );
  }

  return (
    <View style={[styles.messageBubble, mine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
      {renderReactionPicker()}
      {renderReplyPreview()}
      <Text style={[styles.messageBody, mine ? styles.messageBodyMine : styles.messageBodyOther]}>{formatTextMessage(normalizedBody)}</Text>
      {renderReactions()}
    </View>
  );
}

function CallMediaTile({
  title,
  subtitle,
  stream,
  mode,
  styles,
  fallbackName,
  emptyLabel,
  muted = false,
}: {
  title: string;
  subtitle: string;
  stream: MediaStream | null;
  mode: CallMode;
  styles: ReturnType<typeof createStyles>;
  fallbackName: string;
  emptyLabel?: string;
  muted?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const hasVideo = mode === "video" && !!stream?.getVideoTracks?.().some((track) => track.enabled !== false);

  React.useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    if (hasVideo && stream) {
      element.srcObject = stream;
      void element.play().catch(() => {});
      return () => {
        element.srcObject = null;
      };
    }

    element.srcObject = null;
  }, [hasVideo, stream]);

  React.useEffect(() => {
    const element = audioRef.current;
    if (!element || !stream || muted) return;
    element.srcObject = stream;
    void element.play().catch(() => {});
    return () => {
      element.srcObject = null;
    };
  }, [muted, stream]);

  return (
    <View style={[styles.callParticipantTile, hasVideo ? styles.callParticipantTileVideo : styles.callParticipantTileAudio]}>
      {!muted && stream ? <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} /> : null}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          style={{ width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#020617" }}
        />
      ) : (
        <View style={styles.callAvatarWrap}>
          <View style={styles.callAvatarBubble}>
            <Text style={styles.callAvatarText}>{getAvatarInitials(fallbackName)}</Text>
          </View>
          <Text style={styles.callAvatarName}>{title}</Text>
          <Text style={styles.callAvatarMeta}>{subtitle}</Text>
          {!!emptyLabel && <Text style={styles.callAvatarHint}>{emptyLabel}</Text>}
        </View>
      )}
      <View style={styles.callParticipantMeta}>
        <Text style={styles.callParticipantName} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.callParticipantStatus}>{subtitle}</Text>
      </View>
    </View>
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
  buttonActive: {
    borderColor: "#78A9FF",
    backgroundColor: "#EDF5FF",
  },
  buttonDisabled: {
    opacity: 0.55,
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

function formatConversationPreview(body?: string | null) {
  if (!body) return "No messages yet";
  const reply = parseReplyMessage(body);
  const normalizedBody = reply?.body ?? body;
  const invite = parseLegacyCallInvite(normalizedBody);
  if (invite) {
    return invite.mode === "video" ? "Legacy video call invite" : "Legacy audio call invite";
  }
  const reaction = parseReactionMessage(normalizedBody);
  if (reaction) return `${reaction.emoji} reaction`;
  const documentPayload = parseDocumentMessage(normalizedBody);
  if (documentPayload) return `Document: ${documentPayload.name}`;
  return formatTextMessage(normalizedBody);
}

function normalizeCallMode(value: unknown): CallMode {
  return value === "video" ? "video" : "audio";
}

async function acquireLocalMedia(mode: CallMode) {
  const attempts: Array<{
    constraints: MediaStreamConstraints;
    fallbackNotice?: string;
  }> =
    mode === "video"
      ? [
          { constraints: { audio: true, video: true } },
          {
            constraints: { audio: true, video: false },
            fallbackNotice: "Camera not found. Joining as audio-only.",
          },
          {
            constraints: { audio: false, video: false },
            fallbackNotice: "No microphone or camera found. Joining in receive-only mode.",
          },
        ]
      : [
          { constraints: { audio: true, video: false } },
          {
            constraints: { audio: false, video: false },
            fallbackNotice: "Microphone not found. Joining in receive-only mode.",
          },
        ];

  let lastError: any = null;

  for (const attempt of attempts) {
    try {
      const hasLocalTrack = !!attempt.constraints.audio || !!attempt.constraints.video;
      const stream = hasLocalTrack
        ? await navigator.mediaDevices.getUserMedia(attempt.constraints)
        : new MediaStream();

      return {
        stream,
        fallbackNotice: attempt.fallbackNotice || null,
        hasAudioTrack: stream.getAudioTracks().length > 0,
        hasVideoTrack: stream.getVideoTracks().length > 0,
      };
    } catch (error: any) {
      lastError = error;
      const name = String(error?.name || "");
      const retryable =
        name === "NotFoundError" ||
        name === "DevicesNotFoundError" ||
        name === "OverconstrainedError" ||
        name === "ConstraintNotSatisfiedError";

      if (!retryable) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Unable to access local media devices.");
}

function showCallAlert(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function parseLegacyCallInvite(body?: string | null) {
  if (!body?.startsWith("[medsync-call]")) return null;
  try {
    const parsed = JSON.parse(body.slice("[medsync-call]".length));
    const mode = normalizeCallMode(parsed?.mode);
    return {
      mode,
      startedBy: String(parsed?.startedBy ?? "Team member"),
      createdAt: String(parsed?.createdAt ?? ""),
    };
  } catch {
    return null;
  }
}

function parseDocumentMessage(body?: string | null): ChatDocumentPayload | null {
  if (!body?.startsWith(DOCUMENT_PREFIX)) return null;
  try {
    const parsed = JSON.parse(body.slice(DOCUMENT_PREFIX.length));
    if (!parsed?.name || !parsed?.dataUrl) return null;
    return {
      name: String(parsed.name),
      mimeType: String(parsed.mimeType || "application/octet-stream"),
      size: Number(parsed.size || 0),
      dataUrl: String(parsed.dataUrl),
    };
  } catch {
    return null;
  }
}

function parseReactionMessage(body?: string | null): ChatReactionPayload | null {
  if (!body?.startsWith(REACTION_PREFIX)) return null;
  try {
    const parsed = JSON.parse(body.slice(REACTION_PREFIX.length));
    if (!parsed?.messageId || !parsed?.emoji) return null;
    return {
      messageId: String(parsed.messageId),
      emoji: String(parsed.emoji),
    };
  } catch {
    return null;
  }
}

function parseReplyMessage(body?: string | null): ChatReplyEnvelope | null {
  if (!body?.startsWith(REPLY_PREFIX)) return null;
  try {
    const parsed = JSON.parse(body.slice(REPLY_PREFIX.length));
    if (!parsed?.replyTo?.messageId || typeof parsed?.body !== "string") return null;
    return {
      replyTo: {
        messageId: String(parsed.replyTo.messageId),
        senderName: String(parsed.replyTo.senderName || "Staff"),
        snippet: String(parsed.replyTo.snippet || ""),
      },
      body: String(parsed.body),
    };
  } catch {
    return null;
  }
}

function getMessageBody(body: string) {
  return parseReplyMessage(body)?.body ?? body;
}

function buildReactionsMap(rows: ChatMessageRow[]) {
  const map: Record<string, Record<string, number>> = {};
  rows.forEach((row) => {
    const reaction = parseReactionMessage(row.body);
    if (!reaction) return;
    if (!map[reaction.messageId]) map[reaction.messageId] = {};
    map[reaction.messageId][reaction.emoji] = (map[reaction.messageId][reaction.emoji] ?? 0) + 1;
  });

  return Object.fromEntries(
    Object.entries(map).map(([messageId, reactions]) => [
      messageId,
      Object.entries(reactions).map(([emoji, count]) => ({ emoji, count })),
    ]),
  ) as Record<string, Array<{ emoji: string; count: number }>>;
}

function formatTextMessage(body: string) {
  const normalizedBody = getMessageBody(body);
  const documentPayload = parseDocumentMessage(normalizedBody);
  if (documentPayload) return documentPayload.name;
  const reaction = parseReactionMessage(normalizedBody);
  if (reaction) return `${reaction.emoji} reaction`;
  return normalizedBody;
}

function buildReplySnippet(body: string) {
  const normalizedBody = getMessageBody(body);
  const documentPayload = parseDocumentMessage(normalizedBody);
  if (documentPayload) return `Document: ${documentPayload.name}`;
  const invite = parseLegacyCallInvite(normalizedBody);
  if (invite) return invite.mode === "video" ? "Video call invite" : "Audio call invite";
  const reaction = parseReactionMessage(normalizedBody);
  if (reaction) return `${reaction.emoji} reaction`;
  return normalizedBody.length > 90 ? `${normalizedBody.slice(0, 90).trimEnd()}...` : normalizedBody;
}

function formatDocumentType(mimeType: string) {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("text")) return "TXT";
  return "Document";
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function pickDocumentFromWeb(): Promise<ChatDocumentPayload | null> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Unable to read the selected document."));
      reader.onload = () =>
        resolve({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          dataUrl: String(reader.result || ""),
        });
      reader.readAsDataURL(file);
    };

    input.click();
  });
}

async function openDocumentPayload(payload: ChatDocumentPayload) {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const link = document.createElement("a");
    link.href = payload.dataUrl;
    link.download = payload.name;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
    return;
  }

  Alert.alert("Document", "Opening documents is currently available on web.");
}

function getAvatarInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "TM"
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
    callOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(148,163,184,0.28)",
      padding: 14,
      justifyContent: "center",
      zIndex: 40,
    },
    callInviteOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15,23,42,0.42)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      zIndex: 45,
    },
    callInviteModal: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      padding: 22,
      borderWidth: 1,
      borderColor: "#DCE7F5",
      gap: 10,
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0 18px 48px rgba(48,80,130,0.18)",
          } as any)
        : null),
    },
    callInviteOverlayTitle: {
      color: "#0F172A",
      fontSize: 20,
      fontWeight: "900",
    },
    callInviteOverlayText: {
      color: "#475569",
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 20,
    },
    callInviteOverlayActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 8,
    },
    callDeclineBtn: {
      minWidth: 96,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#FECACA",
      backgroundColor: "#FFF1F2",
      alignItems: "center",
      justifyContent: "center",
    },
    callDeclineBtnText: {
      color: "#DC2626",
      fontSize: 13,
      fontWeight: "900",
    },
    callAcceptBtn: {
      minWidth: 96,
      height: 42,
      borderRadius: 14,
      backgroundColor: "#2563EB",
      alignItems: "center",
      justifyContent: "center",
    },
    callAcceptBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "900",
    },
    callShell: {
      flex: 1,
      borderRadius: 30,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(203,213,225,0.34)",
      backgroundColor: "#0F172A",
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0 24px 60px rgba(15,23,42,0.22)",
          } as any)
        : null),
    },
    callHeader: {
      minHeight: 76,
      paddingHorizontal: 18,
      paddingVertical: 16,
      backgroundColor: "#121A30",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(148,163,184,0.22)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    callHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },
    callTitle: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
    },
    callSubtitle: {
      color: "rgba(255,255,255,0.72)",
      fontSize: 12,
      fontWeight: "700",
      marginTop: 3,
    },
    callHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginLeft: "auto",
    },
    callDeviceRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      flex: 1,
      minWidth: 220,
    },
    callDeviceBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(37,99,235,0.12)",
      borderWidth: 1,
      borderColor: "rgba(96,165,250,0.18)",
    },
    callDeviceBadgeWarning: {
      backgroundColor: "rgba(245,158,11,0.12)",
      borderColor: "rgba(251,191,36,0.24)",
    },
    callDeviceBadgeText: {
      color: "#DBEAFE",
      fontSize: 11,
      fontWeight: "900",
    },
    callDeviceBadgeTextWarning: {
      color: "#FDE68A",
    },
    callControlBtn: {
      width: 40,
      height: 40,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(226,232,240,0.24)",
      backgroundColor: "rgba(30,41,59,0.82)",
      alignItems: "center",
      justifyContent: "center",
    },
    callControlBtnDisabled: {
      opacity: 0.45,
    },
    callCloseBtn: {
      width: 38,
      height: 38,
      borderRadius: 999,
      backgroundColor: "#DC2626",
      alignItems: "center",
      justifyContent: "center",
    },
    callNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 18,
      marginTop: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: "rgba(37,99,235,0.14)",
      borderWidth: 1,
      borderColor: "rgba(96,165,250,0.22)",
    },
    callNoticeWarning: {
      backgroundColor: "rgba(245,158,11,0.12)",
      borderColor: "rgba(251,191,36,0.22)",
    },
    callNoticeText: {
      flex: 1,
      color: "#E2E8F0",
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 18,
    },
    callStage: {
      flex: 1,
      backgroundColor: "#0F172A",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      padding: 18,
      alignContent: "flex-start",
    },
    callParticipantTile: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "rgba(148,163,184,0.26)",
      backgroundColor: "#141D35",
    },
    callParticipantTileVideo: {
      flex: 1,
      minWidth: 260,
      minHeight: 240,
    },
    callParticipantTileAudio: {
      flex: 1,
      minWidth: 300,
      minHeight: 240,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    callParticipantSpeaking: {
      borderColor: "#60A5FA",
      shadowColor: "#60A5FA",
      shadowOpacity: 0.3,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
    },
    callAvatarWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    callAvatarBubble: {
      width: 108,
      height: 108,
      borderRadius: 999,
      backgroundColor: "#FB7185",
      alignItems: "center",
      justifyContent: "center",
    },
    callAvatarText: {
      color: "#FFFFFF",
      fontSize: 42,
      fontWeight: "900",
    },
    callAvatarName: {
      color: "#F8FAFC",
      fontSize: 20,
      fontWeight: "900",
    },
    callAvatarMeta: {
      color: "#CBD5E1",
      fontSize: 12,
      fontWeight: "800",
    },
    callAvatarHint: {
      maxWidth: 260,
      color: "#94A3B8",
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 17,
      textAlign: "center",
    },
    callParticipantMeta: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: "rgba(15,23,42,0.72)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    callParticipantName: {
      flex: 1,
      color: "#F8FAFC",
      fontSize: 12,
      fontWeight: "900",
    },
    callParticipantBadges: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    callParticipantStatus: {
      color: "#CBD5E1",
      fontSize: 11,
      fontWeight: "800",
    },
    callEmptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    callEmptyTitle: {
      color: "#F8FAFC",
      fontSize: 18,
      fontWeight: "900",
    },
    callEmptyText: {
      maxWidth: 320,
      color: "#CBD5E1",
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 20,
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
      alignItems: "stretch",
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
      marginBottom: 6,
      color: "#64748B",
      fontSize: 11,
      fontWeight: "900",
    },
    senderLabelMine: {
      marginRight: 4,
      textAlign: "right",
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
    callInviteCard: {
      minWidth: 220,
      gap: 10,
    },
    callInviteHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    callInviteTitle: {
      color: "#1F2937",
      fontSize: 14,
      fontWeight: "900",
    },
    callInviteTitleMine: {
      color: "#15315D",
    },
    callInviteMeta: {
      color: "#475569",
      fontSize: 12,
      fontWeight: "700",
    },
    callInviteMetaMine: {
      color: "#274472",
    },
    callInviteButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: "#2563EB",
    },
    callInviteButtonMine: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#A9CFFF",
    },
    callInviteButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },
    callInviteButtonTextMine: {
      color: "#1D4ED8",
    },
    messageActions: {
      position: "absolute",
      top: -18,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#DCE7F5",
      backgroundColor: "#FFFFFF",
    },
    replyActionBtn: {
      width: 28,
      height: 28,
      borderRadius: 999,
      backgroundColor: "#EDF5FF",
      alignItems: "center",
      justifyContent: "center",
    },
    messageActionsVisible: {
      opacity: 1,
    },
    emojiPickerBtn: {
      minWidth: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    emojiPickerText: {
      fontSize: 14,
    },
    replyPreview: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 10,
      marginBottom: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.54)",
    },
    replyPreviewStripe: {
      width: 3,
      borderRadius: 999,
      backgroundColor: "#2563EB",
    },
    replyPreviewCopy: {
      flex: 1,
      minWidth: 0,
    },
    replyPreviewName: {
      color: "#1D4ED8",
      fontSize: 11,
      fontWeight: "900",
    },
    replyPreviewNameMine: {
      color: "#15315D",
    },
    replyPreviewSnippet: {
      marginTop: 2,
      color: "#475569",
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
    },
    replyPreviewSnippetMine: {
      color: "#274472",
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
    messageReactions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },
    reactionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.82)",
      borderWidth: 1,
      borderColor: "#DCE7F5",
      alignSelf: "flex-start",
    },
    reactionChipEmoji: {
      fontSize: 12,
    },
    reactionChipCount: {
      color: "#475569",
      fontSize: 11,
      fontWeight: "900",
    },
    documentCard: {
      minWidth: 220,
      gap: 12,
    },
    documentHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    documentIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: "#EFF6FF",
      alignItems: "center",
      justifyContent: "center",
    },
    documentIconWrapMine: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#A9CFFF",
    },
    documentCopy: {
      flex: 1,
      minWidth: 0,
    },
    documentName: {
      color: "#1F2937",
      fontSize: 14,
      fontWeight: "900",
    },
    documentNameMine: {
      color: "#15315D",
    },
    documentMeta: {
      marginTop: 3,
      color: "#475569",
      fontSize: 12,
      fontWeight: "700",
    },
    documentMetaMine: {
      color: "#274472",
    },
    documentButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: "#2563EB",
    },
    documentButtonMine: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#A9CFFF",
    },
    documentButtonText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
    },
    documentButtonTextMine: {
      color: "#1D4ED8",
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
    composerIconDisabled: {
      opacity: 0.45,
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
      paddingVertical: 10,
    },
    replyComposerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
      padding: 10,
      borderRadius: 14,
      backgroundColor: "#EAF2FF",
    },
    replyComposerStripe: {
      width: 3,
      alignSelf: "stretch",
      borderRadius: 999,
      backgroundColor: "#2563EB",
    },
    replyComposerCopy: {
      flex: 1,
      minWidth: 0,
    },
    replyComposerLabel: {
      color: "#1D4ED8",
      fontSize: 11,
      fontWeight: "900",
    },
    replyComposerSnippet: {
      marginTop: 2,
      color: "#475569",
      fontSize: 11,
      fontWeight: "700",
    },
    replyComposerClose: {
      width: 24,
      height: 24,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
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
