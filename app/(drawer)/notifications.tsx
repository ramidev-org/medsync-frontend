import { PageShell } from "@/components/page_shell";
import { ThemedCard } from "@/components/default_card";
import { useAuth } from "@/contexts/auth_context";
import {
  getNotifications,
  markNotificationsRead,
} from "@/services/notifications.services";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NotificationItem = {
  id: string;
  kind: "follow_up" | "payment" | "system" | "task" | string;
  title: string;
  description: string;
  created_at: string;
  unread: boolean;
};

const iconFor = (kind: NotificationItem["kind"]) => {
  if (kind === "follow_up") return "calendar-outline";
  if (kind === "payment") return "card-outline";
  if (kind === "task") return "checkbox-outline";
  return "information-circle-outline";
};

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours <= 0) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export default function NotificationsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await getNotifications({ requesterId: user.id, limit: 40 });
      setItems(
        rows.map((row) => ({
          id: row.notification_key || row.id,
          kind: row.kind,
          title: row.title,
          description: row.description,
          created_at: row.created_at,
          unread: !!row.unread,
        })),
      );
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((x) => x.unread).length;

  const markAsRead = async (ids: string[]) => {
    if (!user?.id || !ids.length) return;
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, unread: false } : item,
      ),
    );
    try {
      await markNotificationsRead({
        requesterId: user.id,
        notificationKeys: ids,
      });
    } catch (err) {
      console.error("Failed to persist read notifications:", err);
      load();
    }
  };

  return (
    <PageShell
      title="Notifications"
      subtitle={unread ? `${unread} unread` : "Everything is up to date"}
      actions={
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => markAsRead(items.filter((item) => item.unread).map((item) => item.id))}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={18}
            color={theme.colors.text}
          />
          <Text style={styles.actionBtnText}>Mark all read</Text>
        </TouchableOpacity>
      }
    >
      <ThemedCard style={{ padding: 16 }}>
        <Text style={{ fontWeight: "900", color: theme.colors.text }}>
          Live clinic feed
        </Text>
        <Text
          style={{
            marginTop: 4,
            color: theme.colors.textSecondary,
            fontWeight: "700",
          }}
        >
          This stream now reflects real task, invite, appointment, and inventory signals
          from the clinic workspace.
        </Text>
      </ThemedCard>

      <View style={{ height: 12 }} />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      ) : null}

      {!loading && !items.length ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="notifications-off-outline"
            size={22}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>No active notifications</Text>
          <Text style={styles.emptyText}>
            New tasks, pending invites, low stock warnings, and appointment prompts will
            appear here.
          </Text>
        </View>
      ) : null}

      {items.map((n) => (
        <View
          key={n.id}
          style={[
            styles.row,
            {
              borderColor: theme.colors.border,
              backgroundColor: n.unread
                ? "rgba(59, 130, 246, 0.08)"
                : theme.colors.surface,
            },
          ]}
        >
          <View style={styles.left}>
            <View
              style={[styles.iconWrap, { backgroundColor: theme.colors.background }]}
            >
              <Ionicons
                name={iconFor(n.kind) as any}
                size={18}
                color={theme.colors.text}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.title}>{n.title}</Text>
                {n.unread ? (
                  <View
                    style={[styles.dot, { backgroundColor: theme.colors.primary }]}
                  />
                ) : null}
              </View>
              <Text style={styles.desc}>{n.description}</Text>
              <Text style={styles.meta}>{timeLabel(n.created_at)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.smallBtn}
            onPress={() => markAsRead([n.id])}
          >
            <Ionicons
              name={n.unread ? "checkmark-circle-outline" : "checkmark-done-outline"}
              size={18}
              color={n.unread ? theme.colors.primary : theme.colors.success}
            />
          </TouchableOpacity>
        </View>
      ))}
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 40,
    },
    actionBtnText: { fontWeight: "900", color: theme.colors.text },
    loadingBox: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.colors.surface,
      marginBottom: 10,
    },
    loadingText: { color: theme.colors.textSecondary, fontWeight: "800" },
    errorBox: {
      borderWidth: 1,
      borderColor: `${theme.colors.error}33`,
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: `${theme.colors.error}10`,
      marginBottom: 10,
    },
    errorText: { color: theme.colors.error, fontWeight: "800" },
    emptyState: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 18,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      gap: 6,
    },
    emptyTitle: { color: theme.colors.text, fontWeight: "900" },
    emptyText: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
      textAlign: "center",
      maxWidth: 520,
    },
    row: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 10,
    },
    left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    title: { fontWeight: "900", color: theme.colors.text },
    desc: { marginTop: 3, color: theme.colors.textSecondary, fontWeight: "700" },
    meta: { marginTop: 6, color: theme.colors.muted, fontWeight: "700", fontSize: 12 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    smallBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
  });
