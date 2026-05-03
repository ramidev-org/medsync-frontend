import { PageShell } from "@/components/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type StaffRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  user_type: "doctor" | "assistant";
  active?: boolean | null;
};

export default function UsersPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { user } = useAuth();
  const { isClinicAdmin, subscription } = useAppData();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!user || user.user_type !== "doctor" || !isClinicAdmin) {
      router.replace("/dashboard");
      return;
    }
    const run = async () => {
      setLoading(true);
      try {
        const staff = await callRpc<StaffRow[], Record<string, unknown>>("rpc_get_clinic_staff", { p_requester_id: user.id });
        setRows(staff ?? []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, isClinicAdmin, router]);

  const doctors = useMemo(() => rows.filter((row) => row.user_type === "doctor"), [rows]);
  const assistants = useMemo(() => rows.filter((row) => row.user_type === "assistant"), [rows]);

  return (
    <PageShell title="Team Management" subtitle="Manage doctors and assistants with role limits.">
      <View style={styles.stats}>
        <Stat label="Doctors" value={`${doctors.length}/${subscription?.max_doctors ?? "—"}`} theme={theme} />
        <Stat label="Assistants" value={`${assistants.length}/${subscription?.max_assistants ?? "—"}`} theme={theme} />
        <Stat label="Total Staff" value={`${rows.length}`} theme={theme} />
      </View>

      <View style={styles.invite}>
        <TextInput
          placeholder="staff@clinic.com"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TouchableOpacity style={styles.button}>
          <Ionicons name="mail-open-outline" size={16} color="#fff" />
          <Text style={styles.buttonText}>Invite (UI ready)</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <View style={styles.list}>
          {rows.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.full_name || item.email || "Unknown"}</Text>
                <Text style={styles.meta}>{item.email || "no-email"} • {item.user_type}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: item.active ? "#DCFCE7" : "#FEE2E2" }]}>
                <Text style={{ color: item.active ? "#166534" : "#991B1B", fontWeight: "800", fontSize: 11 }}>{item.active ? "Active" : "Inactive"}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </PageShell>
  );
}

function Stat({ label, value, theme }: any) {
  return (
    <View style={{ flex: 1, minWidth: 180, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, padding: 12 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: "900", fontSize: 22, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    invite: { marginTop: 12, flexDirection: "row", gap: 8, alignItems: "center" },
    input: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface, color: theme.colors.text, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 10 },
    button: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.colors.primary },
    buttonText: { color: "#fff", fontWeight: "800" },
    center: { padding: 24, alignItems: "center" },
    list: { marginTop: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    name: { color: theme.colors.text, fontWeight: "800" },
    meta: { color: theme.colors.textSecondary, fontWeight: "700", marginTop: 2, fontSize: 12 },
    pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  });
