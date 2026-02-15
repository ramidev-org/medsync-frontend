// app/(drawer)/UsersPage.tsx
import { TopBar } from "@/components/top_bar";
import { IS_DEMO } from "@/config/runtime";
import { useAuth } from "@/contexts/auth_context";
import { MOCK_USERS } from "@/data/mock/admin_users";
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
  const [doctors, setDoctors] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
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

      if (IS_DEMO) {
        setDoctors(MOCK_USERS.doctors);
        setAssistants(MOCK_USERS.assistants);
        setUsers([...MOCK_USERS.doctors, ...MOCK_USERS.assistants]);
        setLoading(false);
        return;
      }

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
        setDoctors(formatted.filter((u: any) => u.role === "doctor"));
        setAssistants(formatted.filter((u: any) => u.role === "assistant"));
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
        <ScrollView contentContainerStyle={styles.page}>
          {/* Doctors */}
          <Text style={styles.sectionTitle}>Médecins</Text>
          <View style={styles.grid}>
            {(IS_DEMO ? doctors : users.filter((u) => u.role === "doctor")).map((u: any) => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.cardTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{(u.full_name || u.email)[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{u.full_name || "Docteur"}</Text>
                    {!!u.speciality && (
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>{u.speciality}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* stats rows (demo only) */}
                {IS_DEMO && (
                  <View style={{ gap: 10, marginTop: 12 }}>
                    <View style={styles.rowLine}>
                      <Text style={styles.rowLabel}>Patients</Text>
                      <Text style={styles.rowValue}>{u.patients}</Text>
                    </View>
                    <View style={styles.rowLine}>
                      <Text style={styles.rowLabel}>Rating</Text>
                      <Text style={styles.rowValue}>{u.rating}/5.0</Text>
                    </View>
                    <View>
                      <Text style={styles.rowLabel}>Availability</Text>
                      <Text style={styles.rowSub}>{u.availability}</Text>
                    </View>
                    <View style={styles.rowLine}>
                      <Text style={styles.rowLabel}>Téléphone</Text>
                      <Text style={styles.rowValue}>{u.phone}</Text>
                    </View>
                    <View style={styles.rowLine}>
                      <Text style={styles.rowLabel}>Email</Text>
                      <Text style={styles.rowValue}>{u.email}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Assistants */}
          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Assistants</Text>
          <View style={styles.grid}>
            {(IS_DEMO ? assistants : users.filter((u) => u.role === "assistant")).map((u: any) => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.cardTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{(u.full_name || u.email)[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{u.full_name || "Assistant"}</Text>
                    {IS_DEMO && (
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>{u.department || "Accueil"}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {IS_DEMO && (
                  <View style={{ gap: 10, marginTop: 12 }}>
                    <View style={styles.rowLine}>
                      <Text style={styles.rowLabel}>Shift</Text>
                      <Text style={styles.rowValue}>{u.shift}</Text>
                    </View>
                    <View style={styles.rowLine}>
                      <Text style={styles.rowLabel}>Téléphone</Text>
                      <Text style={styles.rowValue}>{u.phone}</Text>
                    </View>
                    <View style={styles.rowLine}>
                      <Text style={styles.rowLabel}>Email</Text>
                      <Text style={styles.rowValue}>{u.email}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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

    pill: {
      alignSelf: "flex-start",
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.primary + "18",
    },
    pillText: { fontSize: 12, fontWeight: "700", color: theme.colors.primary },

    rowLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    rowLabel: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    rowValue: { color: theme.colors.text, fontWeight: "700", fontSize: 12 },
    rowSub: { color: theme.colors.text, fontWeight: "600", marginTop: 4, fontSize: 12 },

    cardActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    secondaryBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      backgroundColor: theme.colors.surface,
    },
    secondaryBtnText: { fontWeight: "800", color: theme.colors.text, fontSize: 13 },
    primaryBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: theme.colors.primary,
    },
    primaryBtnText: { fontWeight: "800", color: theme.colors.surface, fontSize: 13 },

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
