// app/(drawer)/UsersPage.tsx
import { TopBar } from "@/components/top_bar";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { callRpc, invokeEdgeFunction } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UserType = "doctor" | "assistant";

type StaffRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  user_type: UserType;
  active?: boolean | null;
  created_at?: string | null;
};

export default function UsersPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const router = useRouter();

  const { user, session } = useAuth();
  const { isClinicAdmin } = useAppData();

  const [users, setUsers] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>("assistant");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  // Only clinic-admin doctors can manage staff.
  useEffect(() => {
    if (!user) return;
    if (user.user_type !== "doctor" || !isClinicAdmin) {
      router.replace("/dashboard");
    }
  }, [user, isClinicAdmin, router]);

  const refresh = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setUsers([]);
        return;
      }
      const staff = await callRpc<StaffRow[], Record<string, unknown>>(
        "rpc_get_clinic_staff",
        { p_requester_id: user.id },
      );
      setUsers(staff ?? []);
    } catch (e) {
      console.error("Load staff error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInviteStaff = async () => {
    if (!email.trim()) {
      setMessage("Email requis.");
      return;
    }
    if (!session?.access_token) {
      setMessage("Vous devez être connecté.");
      return;
    }

    setSaving(true);
    setMessage("");
    setInviteUrl("");

    try {
      const res = await invokeEdgeFunction<any, { email: string; user_type: UserType }>(
        "create-staff-invite",
        { email: email.trim(), user_type: userType },
        session.access_token,
      );

      const url =
        (res?.invite_url as string | undefined) ??
        (res?.url as string | undefined) ??
        (res?.inviteUrl as string | undefined) ??
        "";
      if (url) setInviteUrl(url);

      setShowModal(false);
      setEmail("");
      setUserType("assistant");
      await refresh();
    } catch (e: any) {
      setMessage(e?.message || "Erreur d'invitation.");
    } finally {
      setSaving(false);
    }
  };

  const copyInviteUrl = async () => {
    if (!inviteUrl) return;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl);
      Alert.alert("Copied", "Invite link copied to clipboard.");
      return;
    }
    Alert.alert("Invite link", inviteUrl);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TopBar theme={theme} />

      <View style={styles.header}>
        <Text style={styles.title}>Personnel</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            setMessage("");
            setInviteUrl("");
            setShowModal(true);
          }}
        >
          <Text style={{ color: theme.colors.surface, fontWeight: "700" }}>
            + Inviter
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.sectionTitle}>Médecins</Text>
          <View style={styles.grid}>
            {users
              .filter((u) => u.user_type === "doctor")
              .map((u) => (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(u.full_name || u.email || "?")[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{u.full_name || "Docteur"}</Text>
                      {!!u.email && <Text style={styles.rowSub}>{u.email}</Text>}
                    </View>
                  </View>
                </View>
              ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Assistants</Text>
          <View style={styles.grid}>
            {users
              .filter((u) => u.user_type === "assistant")
              .map((u) => (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(u.full_name || u.email || "?")[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{u.full_name || "Assistant"}</Text>
                      {!!u.email && <Text style={styles.rowSub}>{u.email}</Text>}
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Inviter un membre du personnel</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.roleSelector}>
              {(["doctor", "assistant"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleOption,
                    userType === r && {
                      backgroundColor: theme.colors.primary + "22",
                    },
                  ]}
                  onPress={() => setUserType(r)}
                >
                  <Text style={{ fontWeight: "600" }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {inviteUrl ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontWeight: "700" }}>Invite link</Text>
                <Text selectable style={{ color: theme.colors.textSecondary }}>
                  {inviteUrl}
                </Text>
                <TouchableOpacity
                  style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={copyInviteUrl}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Copy link</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {message ? <Text style={styles.error}>{message}</Text> : null}

            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleInviteStaff}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Envoyer l’invitation
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
    },
    title: { fontSize: 22, fontWeight: "800" },

    addBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },

    page: {
      paddingHorizontal: 16,
      paddingBottom: 28,
    },

    sectionTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.colors.text,
      paddingHorizontal: 2,
      marginTop: 6,
      marginBottom: 10,
    },

    grid: {
      paddingBottom: 8,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },

    userCard: {
      width: "31.5%",
      minWidth: 280,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },

    cardTop: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },

    avatarCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary + "22",
    },
    avatarText: { fontSize: 20, fontWeight: "800", color: theme.colors.primary },

    name: { fontSize: 16, fontWeight: "800", color: theme.colors.text },

    rowSub: { color: theme.colors.text, fontWeight: "600", marginTop: 4, fontSize: 12 },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      padding: 20,
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      gap: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: "700" },

    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.colors.background,
    },

    roleSelector: { flexDirection: "row", gap: 10 },
    roleOption: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },

    error: { color: theme.colors.error, fontWeight: "700" },

    createBtn: {
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },

    cancel: {
      marginTop: 10,
      textAlign: "center",
      fontWeight: "700",
      color: theme.colors.textSecondary,
    },
  });
