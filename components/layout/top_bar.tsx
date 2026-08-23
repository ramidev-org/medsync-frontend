import PatientForm from "@/components/new_patient";
import { UserAvatar } from "@/components/user_avatar";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { getConversations } from "@/services/chats.services";
import type { ClinicNotificationRow, ConversationRow } from "@/services/backend.types";
import {
  getNotifications,
  markNotificationsRead,
} from "@/services/notifications.services";
import { PAGE_GUTTER, getWebContainerFill } from "@/theme/layout";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

interface TopBarProps {
  theme: any;
}

export const TopBar: React.FC<TopBarProps> = ({ theme }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(false);
  const [patientFormVisible, setPatientFormVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatRows, setChatRows] = useState<ConversationRow[]>([]);
  const [notifications, setNotifications] = useState<ClinicNotificationRow[]>([]);
  const { logout, user } = useAuth();
  const { clinic, isClinicAdmin, subscription } = useAppData();
  const router = useRouter();
  const role = (user?.user_type ?? "doctor") as "doctor" | "assistant";
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryAction = useMemo(() => {
    if (role === "assistant") {
      return {
        label: "Nouvelle Visite",
        onPress: () => router.push("/visits?open_new=1" as any),
      };
    }

    if (role === "doctor" && !isClinicAdmin) {
      return {
        label: "Nouveau Patient",
        onPress: () => setPatientFormVisible(true),
      };
    }

    return null;
  }, [isClinicAdmin, role, router]);

  useEffect(() => setIsMounted(true), []);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handle = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handle);
    handle();
    return () => document.removeEventListener("fullscreenchange", handle);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadChats = async () => {
      if (!user?.id) return;
      try {
        const res = await getConversations({ requesterId: user.id, page: 1, itemsPerPage: 6 });
        if (!cancelled) setChatRows(res?.conversations ?? []);
      } catch (err) {
        if (!cancelled) setChatRows([]);
        console.error("Failed to load top bar chats:", err);
      }
    };
    loadChats();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      if (!user?.id) return;
      try {
        const rows = await getNotifications({ requesterId: user.id, limit: 6 });
        if (!cancelled) setNotifications(rows ?? []);
      } catch (err) {
        if (!cancelled) setNotifications([]);
        console.error("Failed to load top bar notifications:", err);
      }
    };
    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const markRead = async (notificationKeys: string[]) => {
    if (!user?.id || !notificationKeys.length) return;
    setNotifications((old) =>
      old.map((item) =>
        notificationKeys.includes(item.notification_key)
          ? { ...item, unread: false }
          : item,
      ),
    );
    try {
      await markNotificationsRead({
        requesterId: user.id,
        notificationKeys,
      });
    } catch (err) {
      console.error("Failed to persist notification read state:", err);
    }
  };

  const notificationTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours <= 0) return "Just now";
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.round(diffHours / 24)}d`;
  };

  const toggleFullscreen = async () => {
    if (Platform.OS !== "web") return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      msFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };
    const el = (document.documentElement || document.body) as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    const hasFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
    try {
      if (hasFullscreen) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
        else if (doc.msExitFullscreen) await doc.msExitFullscreen();
        return;
      }
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      else if (typeof window !== "undefined") {
        window.open(window.location.href, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMenuVisible(false);
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const dateLabel = useMemo(() => {
    if (!isMounted) return " ";
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
      .format(new Date())
      .replace(/^./, (char) => char.toUpperCase());
  }, [isMounted]);

  const subscriptionBadge = useMemo(() => {
    const status = subscription?.status ?? "missing";
    const label =
      status === "active" ? "Active" : status === "expired" ? "Expired" : status === "revoked" ? "Revoked" : "Missing";
    const bg =
      status === "active"
        ? theme.colors.success
        : status === "expired"
          ? theme.colors.warning
          : status === "revoked"
            ? theme.colors.error
            : theme.colors.surfaceVariant;
    const fg = status === "missing" ? theme.colors.text : "#fff";
    return { label, bg, fg };
  }, [subscription?.status, theme.colors]);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.dateText}>{dateLabel}</Text>
          <View style={styles.rightSection}>
            {primaryAction ? (
              <Pressable onPress={primaryAction.onPress} style={({ hovered, pressed }) => [styles.primaryBtn, hovered && Platform.OS === "web" ? styles.hover : null, pressed ? styles.pressed : null]}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{primaryAction.label}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                setNotificationsOpen((v) => !v);
                setChatsOpen(false);
                setMenuVisible(false);
              }}
              style={({ hovered, pressed }) => [styles.iconButton, hovered && Platform.OS === "web" ? styles.hover : null, pressed ? styles.pressed : null]}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
            </Pressable>
            <Pressable
              onPress={() => {
                setChatsOpen((v) => !v);
                setNotificationsOpen(false);
                setMenuVisible(false);
              }}
              style={({ hovered, pressed }) => [styles.iconButton, hovered && Platform.OS === "web" ? styles.hover : null, pressed ? styles.pressed : null]}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.text} />
            </Pressable>
            {Platform.OS === "web" && (
              <Pressable
                onPress={toggleFullscreen}
                style={({ hovered, pressed }) => [styles.iconButton, hovered ? styles.hover : null, pressed ? styles.pressed : null]}
              >
                <Ionicons
                  name={isFullscreen ? "contract-outline" : "expand-outline"}
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
            )}
            {notificationsOpen && (
              <View style={styles.notificationMenu}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>Notifications</Text>
                  <Pressable
                    onPress={() =>
                      markRead(
                        notifications
                          .filter((item) => item.unread)
                          .map((item) => item.notification_key),
                      )
                    }
                  >
                    <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: 12 }}>Mark all read</Text>
                  </Pressable>
                </View>
                {notifications.map((item) => (
                  <View key={item.id} style={styles.notificationRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notificationText, item.unread && { color: theme.colors.text, fontWeight: "600" }]}>{item.title}</Text>
                      <Text style={styles.notificationTime}>{notificationTime(item.created_at)}</Text>
                    </View>
                    <Pressable
                      onPress={() => markRead([item.notification_key])}
                      style={{ padding: 6 }}
                    >
                      <Ionicons name={item.unread ? "checkmark-circle-outline" : "checkmark-done-outline"} size={18} color={item.unread ? theme.colors.primary : theme.colors.success} />
                    </Pressable>
                  </View>
                ))}
                <View style={styles.dropdownFooter}>
                  <Pressable
                    onPress={() => {
                      setNotificationsOpen(false);
                      router.push("/notifications");
                    }}
                  >
                    <Text style={styles.dropdownFooterLink}>View all notifications</Text>
                  </Pressable>
                </View>
              </View>
            )}
            {chatsOpen && (
              <View style={styles.chatMenu}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>Latest messages</Text>
                </View>
                {chatRows.length === 0 ? (
                  <View style={styles.notificationRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notificationText}>No recent messages.</Text>
                    </View>
                  </View>
                ) : (
                  chatRows.map((row) => {
                    const others = row.members?.filter((m) => m.id !== user?.id) ?? [];
                    const title = row.kind === "group" ? row.title || "Group chat" : others.map((m) => m.full_name || "Unknown").join(", ") || "Direct chat";
                    const subtitle = formatChatPreview(row.last_message?.body);
                    const previewBody = parseReplyEnvelope(row.last_message?.body ?? "")?.body ?? row.last_message?.body;
                    const documentPayload = parseTopBarDocumentMessage(previewBody);
                    const documentVisual = documentPayload ? getTopBarDocumentVisual(documentPayload.mimeType, documentPayload.name) : null;
                    const directMember = row.kind === "direct" ? others[0] : null;
                    return (
                      <Pressable
                        key={row.id}
                        onPress={() => {
                          setChatsOpen(false);
                          router.push(`/chats/${row.id}` as any);
                        }}
                        style={styles.notificationRow}
                      >
                        {documentVisual ? (
                          <View style={[styles.chatPreviewIcon, { backgroundColor: documentVisual.background }]}>
                            <Ionicons name={documentVisual.icon} size={16} color={documentVisual.color} />
                          </View>
                        ) : (
                          <UserAvatar name={title} avatarColor={directMember?.avatar_color ?? null} size={38} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={[styles.notificationText, { color: theme.colors.text, fontWeight: "600" }]}>{title}</Text>
                          <Text numberOfLines={1} style={styles.notificationTime}>{subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                      </Pressable>
                    );
                  })
                )}
                <View style={styles.dropdownFooter}>
                  <Pressable
                    onPress={() => {
                      setChatsOpen(false);
                      router.push("/chats");
                    }}
                  >
                    <Text style={styles.dropdownFooterLink}>Open full chat page</Text>
                  </Pressable>
                </View>
              </View>
            )}
            <Pressable onPress={() => setMenuVisible(!menuVisible)} style={({ hovered, pressed }) => [hovered && Platform.OS === "web" ? styles.hover : null, pressed ? styles.pressed : null]}>
              <UserAvatar name={user?.fullname || user?.email || "User"} avatarColor={user?.avatarColor} size={42} />
            </Pressable>
            {menuVisible && (
              <View style={styles.avatarMenu}>
                <View style={styles.menuHeader}>
                  <View style={styles.menuHeaderRow}>
                    <UserAvatar name={user?.fullname || user?.email || "User"} avatarColor={user?.avatarColor} size={54} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={styles.menuName}>{user?.fullname || user?.email || "—"}</Text>
                      <Text numberOfLines={1} style={styles.menuSub}>
                        {(clinic?.name ? String(clinic.name) : "Clinic") + " • " + (role === "doctor" ? "Doctor" : "Assistant")}
                        {!!isClinicAdmin && role === "doctor" ? " (Admin)" : ""}
                      </Text>
                    </View>
                    <View style={[styles.subBadge, { backgroundColor: subscriptionBadge.bg }]}>
                      <Text style={[styles.subBadgeText, { color: subscriptionBadge.fg }]}>{subscriptionBadge.label}</Text>
                    </View>
                  </View>
                  <View style={styles.metaGrid}>
                
                  </View>
                </View>
                <Pressable style={styles.avatarMenuItem} onPress={() => { setMenuVisible(false); router.push("/profile"); }}>
                  <Ionicons name="person-outline" size={18} color={theme.colors.text} />
                  <Text style={styles.avatarMenuText}>Profile</Text>
                </Pressable>
                <Pressable style={styles.avatarMenuItem} onPress={() => { setMenuVisible(false); router.push("/settings"); }}>
                  <Ionicons name="settings-outline" size={18} color={theme.colors.text} />
                  <Text style={styles.avatarMenuText}>Settings</Text>
                </Pressable>
                {!!isClinicAdmin && (
                  <Pressable style={styles.avatarMenuItem} onPress={() => { setMenuVisible(false); router.push("/users"); }}>
                    <Ionicons name="people-outline" size={18} color={theme.colors.text} />
                    <Text style={styles.avatarMenuText}>Clinic Staff</Text>
                  </Pressable>
                )}
                <View style={styles.menuDivider} />
                <Pressable style={styles.avatarMenuItem} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
                  <Text style={[styles.avatarMenuText, { color: theme.colors.error }]}>Logout</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
      <PatientForm visible={patientFormVisible} onClose={() => setPatientFormVisible(false)} />
    </>
  );
};

const formatChatPreview = (body?: string | null) => {
  if (!body) return "No messages yet";
  const replyBody = parseReplyEnvelope(body)?.body ?? body;
  if (replyBody.startsWith("[medsync-call]")) {
    return replyBody.includes('"mode":"video"') ? "Started a video call" : "Started an audio call";
  }
  const documentPayload = parseTopBarDocumentMessage(replyBody);
  if (documentPayload) return `Document: ${documentPayload.name}`;
  return replyBody.length > 82 ? `${replyBody.slice(0, 82).trimEnd()}...` : replyBody;
};

const DOCUMENT_PREFIX = "[medsync-document]";
const REPLY_PREFIX = "[medsync-reply]";

function parseReplyEnvelope(body?: string | null) {
  if (!body?.startsWith(REPLY_PREFIX)) return null;
  try {
    const parsed = JSON.parse(body.slice(REPLY_PREFIX.length));
    if (typeof parsed?.body !== "string") return null;
    return { body: String(parsed.body) };
  } catch {
    return null;
  }
}

function parseTopBarDocumentMessage(body?: string | null) {
  if (!body?.startsWith(DOCUMENT_PREFIX)) return null;
  try {
    const parsed = JSON.parse(body.slice(DOCUMENT_PREFIX.length));
    if (!parsed?.name) return null;
    return {
      name: String(parsed.name),
      mimeType: String(parsed.mimeType || "application/octet-stream"),
    };
  } catch {
    return null;
  }
}

function getTopBarDocumentVisual(mimeType: string, fileName?: string) {
  const normalized = `${mimeType} ${String(fileName ?? "").toLowerCase()}`;
  if (normalized.includes("pdf")) return { icon: "document-text-outline" as const, color: "#DC2626", background: "#FEF2F2" };
  if (normalized.includes("png") || normalized.includes("jpg") || normalized.includes("jpeg") || normalized.includes("webp") || normalized.includes("gif") || normalized.includes("image")) {
    return { icon: "image-outline" as const, color: "#7C3AED", background: "#F5F3FF" };
  }
  if (normalized.includes("word") || normalized.includes("doc")) return { icon: "document-outline" as const, color: "#1D4ED8", background: "#EFF6FF" };
  if (normalized.includes("sheet") || normalized.includes("excel") || normalized.includes("xls")) return { icon: "grid-outline" as const, color: "#047857", background: "#ECFDF5" };
  return { icon: "attach-outline" as const, color: "#475569", background: "#F8FAFC" };
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      height: 68,
      backgroundColor: "rgba(255,255,255,0.9)",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      zIndex: 10,
      ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, backdropFilter: "saturate(180%) blur(16px)", boxShadow: "0px 10px 26px rgba(15,23,42,0.08)" } as any) : null),
    },
    inner: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: PAGE_GUTTER,
      ...getWebContainerFill(),
    },
    rightSection: { flexDirection: "row", alignItems: "center", gap: 10 },
    primaryBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    dateText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: "700" },
    iconButton: { padding: 8, borderRadius: 12, backgroundColor: "transparent" },
    hover: { backgroundColor: theme.colors.hoverBg },
    pressed: { backgroundColor: theme.colors.pressedBg, transform: [{ scale: 0.98 }] },
    avatarMenu: { position: "absolute", top: 56, right: 0, minWidth: 360, backgroundColor: theme.colors.background, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, zIndex: 20, paddingVertical: 8 },
    notificationMenu: {
      position: "absolute",
      top: 56,
      right: 104,
      minWidth: 330,
      maxWidth: 380,
      backgroundColor: theme.colors.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      zIndex: 20,
      padding: 10,
      gap: 8,
    },
    chatMenu: {
      position: "absolute",
      top: 56,
      right: 58,
      minWidth: 350,
      maxWidth: 400,
      backgroundColor: theme.colors.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      zIndex: 20,
      padding: 10,
      gap: 8,
    },
    notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    notificationTitle: { color: theme.colors.text, fontWeight: "700", fontSize: 14 },
    notificationRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, backgroundColor: theme.colors.surface },
    notificationText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 },
    notificationTime: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11, marginTop: 2 },
    chatPreviewIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(148, 163, 184, 0.18)",
    },
    dropdownFooter: {
      marginTop: 2,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 8,
      alignItems: "flex-end",
    },
    dropdownFooterLink: { color: theme.colors.primary, fontWeight: "700", fontSize: 12 },
    menuHeader: { paddingHorizontal: 12, paddingBottom: 8 },
    menuHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
    menuAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.colors.border },
    menuName: { fontWeight: "700", color: theme.colors.text },
    menuSub: { marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 },
    subBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    subBadgeText: { fontWeight: "700", fontSize: 12 },
    metaGrid: { marginTop: 8, gap: 4, paddingHorizontal: 4 },
    metaValue: { color: theme.colors.text, fontWeight: "700", fontSize: 12 },
    avatarMenuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginHorizontal: 6 },
    avatarMenuText: { fontSize: 14, color: theme.colors.text, fontWeight: "600" },
    menuDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
  });
