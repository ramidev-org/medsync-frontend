// app/(drawer)/UsersPage.tsx
import { TopBar } from "@/components/top_bar";
import { useAuth } from "@/contexts/auth_context";
import { db } from "@/database/database_conn";
import { createUser } from "@/services/admin.services";
import { useTheme } from "@/theme/theme_provider";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UserRole = "doctor" | "assistant";

export default function UsersPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(theme);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("doctor");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* ===== LOAD USERS ===== */
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);

      const { data, error } = await db
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          created_at,
          user_roles!inner (
            role
          )
        `)
        .in("user_roles.role", ["doctor", "assistant"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load users error:", error);
      } else {
        // flatten role
        const formatted = data.map((u: any) => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.user_roles[0]?.role,
          created_at: u.created_at,
        }));

        setUsers(formatted);
      }

      setLoading(false);
    };

    loadUsers();
  }, []);


  /* ===== CREATE USER ===== */
  const handleCreateUser = async () => {
    if (!email || !password || !user) {
      setMessage("Email et mot de passe requis.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const newUser = await createUser({
        email: email.trim(),
        password,
        role,
        adminId: user.id,
      });

      setUsers((prev) => [
        { id: newUser.id, email: newUser.email, role },
        ...prev,
      ]);

      setShowModal(false);
      setEmail("");
      setPassword("");
      setRole("doctor");
    } catch (e: any) {
      setMessage(e.message || "Erreur de création.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TopBar theme={theme} />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Utilisateurs</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Text style={{ color: theme.colors.surface, fontWeight: "700" }}>
            + Ajouter
          </Text>
        </TouchableOpacity>
      </View>

      {/* USERS LIST */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {users.map((u) => (
            <View key={u.id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {u.email[0].toUpperCase()}
                </Text>
              </View>

              <Text style={styles.email}>{u.email}</Text>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      u.role === "doctor"
                        ? theme.colors.primary + "22"
                        : theme.colors.success + "22",
                  },
                ]}
              >
                <Text style={{ fontWeight: "600", textTransform: "capitalize" }}>
                  {u.role}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* CREATE USER MODAL */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nouvel utilisateur</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
            />

            <TextInput
              placeholder="Mot de passe initial"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            <View style={styles.roleSelector}>
              {["doctor", "assistant"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleOption,
                    role === r && {
                      backgroundColor: theme.colors.primary + "22",
                    },
                  ]}
                  onPress={() => setRole(r as UserRole)}
                >
                  <Text style={{ fontWeight: "600" }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {message ? <Text style={styles.error}>{message}</Text> : null}

            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleCreateUser}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Créer
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

/* ===== STYLES ===== */
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

    grid: {
      padding: 16,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },

    card: {
      width: "47%",
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      gap: 8,
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.colors.primary + "33",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 20, fontWeight: "700" },

    email: { fontSize: 14, fontWeight: "600", textAlign: "center" },

    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
    },

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
    },

    roleSelector: { flexDirection: "row", gap: 12 },
    roleOption: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      alignItems: "center",
    },

    createBtn: {
      marginTop: 10,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
    },

    cancel: {
      textAlign: "center",
      marginTop: 10,
      color: theme.colors.textSecondary,
    },

    error: { color: theme.colors.error, fontWeight: "600" },
  });
