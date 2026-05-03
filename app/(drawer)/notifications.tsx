import { PageShell } from "@/components/page_shell";
import { ThemedCard } from "@/components/default_card";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type NotificationItem = {
  id: string;
  kind: "follow_up" | "lab" | "payment" | "system";
  title: string;
  description: string;
  created_at: string;
  unread: boolean;
};

const MOCK: NotificationItem[] = [
  {
    id: "n1",
    kind: "follow_up",
    title: "Relance patient",
    description: "Programmer un suivi pour M. Karim B. (consultation ouverte).",
    created_at: "Aujourd’hui",
    unread: true,
  },
  {
    id: "n2",
    kind: "lab",
    title: "Résultat à valider",
    description: "Biologie: HbA1c disponible (à rattacher à la consultation).",
    created_at: "Hier",
    unread: true,
  },
  {
    id: "n3",
    kind: "system",
    title: "Rappel sécurité",
    description: "Activez l’audit log et les rôles pour le personnel (admin).",
    created_at: "Cette semaine",
    unread: false,
  },
];

const iconFor = (kind: NotificationItem["kind"]) => {
  if (kind === "follow_up") return "calendar-outline";
  if (kind === "lab") return "flask-outline";
  if (kind === "payment") return "card-outline";
  return "information-circle-outline";
};

export default function NotificationsPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = React.useState<NotificationItem[]>(MOCK);

  const unread = items.filter((x) => x.unread).length;

  const markAllRead = () => {
    setItems((p) => p.map((x) => ({ ...x, unread: false })));
  };

  return (
    <PageShell
      title="Notifications"
      subtitle={unread ? `${unread} non lues` : "Tout est à jour"}
      actions={
        <TouchableOpacity style={styles.actionBtn} onPress={markAllRead}>
          <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.text} />
          <Text style={styles.actionBtnText}>Tout marquer lu</Text>
        </TouchableOpacity>
      }
    >
      <ThemedCard style={{ padding: 16 }}>
        <Text style={{ fontWeight: "900", color: theme.colors.text }}>
          À venir
        </Text>
        <Text style={{ marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700" }}>
          Prototype: cette page affichera les relances, résultats, alertes et événements (audit).
        </Text>
      </ThemedCard>

      <View style={{ height: 12 }} />

      {items.map((n) => (
        <View
          key={n.id}
          style={[
            styles.row,
            {
              borderColor: theme.colors.border,
              backgroundColor: n.unread ? "rgba(59, 130, 246, 0.08)" : theme.colors.surface,
            },
          ]}
        >
          <View style={styles.left}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.background }]}>
              <Ionicons name={iconFor(n.kind) as any} size={18} color={theme.colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.title}>{n.title}</Text>
                {n.unread && <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />}
              </View>
              <Text style={styles.desc}>{n.description}</Text>
              <Text style={styles.meta}>{n.created_at}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.smallBtn}
            onPress={() => setItems((p) => p.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
          >
            <Ionicons name="checkmark-outline" size={18} color={theme.colors.text} />
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

