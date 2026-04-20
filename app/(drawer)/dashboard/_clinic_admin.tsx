import { TopBar } from "@/components/top_bar";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { db } from "@/database/database_conn";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getDashboardStyles } from "./_styles";

type DashboardCounts = {
  patients?: number;
  doctors?: number;
  assistants?: number;
  virtual_clinics?: number;
  appointments_total?: number;
  appointments_pending?: number;
  payments_total?: number;
  payments_paid?: number;
};

type StaffRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  user_type: "doctor" | "assistant";
};

type VirtualClinicRow = {
  id: string;
  clinic_id: string;
  speciality_id: string;
  doctor_id?: string | null;
  speciality_name?: string | null;
  doctor_name?: string | null;
  active?: boolean | null;
};

type SpecialityRow = { id: string; name: string };

const toNumber = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export default function ClinicAdminDashboardPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDashboardStyles(theme), [theme]);
  const router = useRouter();

  const { user } = useAuth();
  const { isClinicAdmin, clinic } = useAppData();

  useEffect(() => {
    if (!user) return;
    if (user.user_type !== "doctor" || !isClinicAdmin) {
      router.replace("/dashboard");
    }
  }, [user, isClinicAdmin, router]);

  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<DashboardCounts>({});
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [virtualClinics, setVirtualClinics] = useState<VirtualClinicRow[]>([]);
  const [specialities, setSpecialities] = useState<SpecialityRow[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSpecialityId, setCreateSpecialityId] = useState<string | null>(null);
  const [createDoctorId, setCreateDoctorId] = useState<string | null>(null);
  const [createActive, setCreateActive] = useState(true);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setCounts({});
        setStaff([]);
        setVirtualClinics([]);
        setSpecialities([]);
        return;
      }
      const [c, s, v] = await Promise.all([
        callRpc<any, Record<string, unknown>>("rpc_get_clinic_dashboard_counts", {
          p_requester_id: user.id,
        }),
        callRpc<StaffRow[], Record<string, unknown>>("rpc_get_clinic_staff", {
          p_requester_id: user.id,
        }),
        callRpc<VirtualClinicRow[], Record<string, unknown>>("rpc_get_virtual_clinics", {
          p_requester_id: user.id,
        }),
      ]);

      const nextCounts: DashboardCounts = {
        patients: toNumber(c?.patients ?? c?.patients_count ?? c?.patient_count),
        doctors: toNumber(c?.doctors ?? c?.doctors_count ?? c?.doctor_count),
        assistants: toNumber(c?.assistants ?? c?.assistants_count ?? c?.assistant_count),
        virtual_clinics: toNumber(
          c?.virtual_clinics ?? c?.virtual_clinics_count ?? c?.virtual_clinic_count,
        ),
        appointments_total: toNumber(
          c?.appointments_total ?? c?.appointments ?? c?.appointments_count,
        ),
        appointments_pending: toNumber(
          c?.appointments_pending ?? c?.pending_appointments ?? c?.pending_count,
        ),
        payments_total: toNumber(c?.payments_total ?? c?.payments ?? c?.payments_count),
        payments_paid: toNumber(c?.payments_paid ?? c?.paid_payments ?? c?.paid_count),
      };

      setCounts(nextCounts);
      setStaff(s ?? []);
      setVirtualClinics(v ?? []);

      const { data: specData } = await db
        .from("doctor_specialities")
        .select("id,name")
        .order("name", { ascending: true });
      setSpecialities(
        (specData as any[])?.map((x) => ({ id: String(x.id), name: String(x.name) })) ?? [],
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const doctors = staff.filter((x) => x.user_type === "doctor");

  const createVirtualClinic = async () => {
    setCreateError("");
    if (!user?.id) {
      setCreateError("Missing user session.");
      return;
    }
    if (!createSpecialityId) {
      setCreateError("Speciality is required.");
      return;
    }

    setCreating(true);
    try {
      await callRpc<string, Record<string, unknown>>("rpc_create_virtual_clinic", {
        p_requester_id: user.id,
        p_speciality_id: createSpecialityId,
        p_doctor_id: createDoctorId,
        p_active: createActive,
      });

      setCreateOpen(false);
      setCreateSpecialityId(null);
      setCreateDoctorId(null);
      setCreateActive(true);
      await refresh();
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create cabinet.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={localStyles.headerRow}>
          <View>
            <Text style={localStyles.h1}>Clinic Admin</Text>
            <Text style={localStyles.sub}>
              {clinic?.name ? String(clinic.name) : "Your clinic"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/users")}
            style={[localStyles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={localStyles.primaryBtnText}>Invite staff</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <View style={localStyles.statsGrid}>
              <StatCard title="Patients" value={counts.patients ?? 0} theme={theme} />
              <StatCard title="Doctors" value={counts.doctors ?? 0} theme={theme} />
              <StatCard title="Assistants" value={counts.assistants ?? 0} theme={theme} />
              <StatCard
                title="Virtual clinics"
                value={counts.virtual_clinics ?? 0}
                theme={theme}
              />
              <StatCard
                title="Appointments (total)"
                value={counts.appointments_total ?? 0}
                theme={theme}
              />
              <StatCard
                title="Appointments (pending)"
                value={counts.appointments_pending ?? 0}
                theme={theme}
              />
              <StatCard
                title="Payments (total)"
                value={counts.payments_total ?? 0}
                theme={theme}
              />
              <StatCard
                title="Payments (paid)"
                value={counts.payments_paid ?? 0}
                theme={theme}
              />
            </View>

            <View style={localStyles.sectionHeader}>
              <Text style={localStyles.h2}>Virtual clinics</Text>
              <TouchableOpacity
                onPress={() => {
                  setCreateError("");
                  setCreateOpen(true);
                }}
                style={[localStyles.outlineBtn, { borderColor: theme.colors.border }]}
              >
                <Ionicons name="add" size={18} color={theme.colors.text} />
                <Text style={[localStyles.outlineBtnText, { color: theme.colors.text }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              {virtualClinics.map((v) => {
                const assigned = doctors.find((d) => d.id === v.doctor_id);
                return (
                  <View
                    key={v.id}
                    style={[
                      localStyles.vcRow,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[localStyles.vcName, { color: theme.colors.text }]}>
                        {v.speciality_name || "Virtual clinic"}
                      </Text>
                      <Text style={[localStyles.vcMeta, { color: theme.colors.textSecondary }]}>
                        {assigned?.full_name || assigned?.email || v.doctor_name || "Unassigned"}
                      </Text>
                    </View>
                    <View
                      style={[
                        localStyles.badge,
                        {
                          backgroundColor: v.active ? "#DCFCE7" : "#FEE2E2",
                          borderColor: v.active ? "#22C55E" : "#EF4444",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          localStyles.badgeText,
                          { color: v.active ? "#166534" : "#991B1B" },
                        ]}
                      >
                        {v.active ? "Active" : "Paused"}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {!virtualClinics.length && (
                <Text style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>
                  No virtual clinics yet.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={createOpen} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <View style={[localStyles.modal, { backgroundColor: theme.colors.surface }]}>
            <Text style={[localStyles.modalTitle, { color: theme.colors.text }]}>
              Create virtual clinic
            </Text>

            <Text style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>
              Speciality
            </Text>
            <View style={localStyles.pillsRow}>
              {specialities.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setCreateSpecialityId(s.id)}
                  style={[
                    localStyles.pill,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                    createSpecialityId === s.id && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Text style={{ fontWeight: "800", color: theme.colors.text }}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>
              Assign doctor (optional)
            </Text>
            <View style={localStyles.pillsRow}>
              <TouchableOpacity
                onPress={() => setCreateDoctorId(null)}
                style={[
                  localStyles.pill,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                  createDoctorId == null && { borderColor: theme.colors.primary },
                ]}
              >
                <Text style={{ fontWeight: "800", color: theme.colors.text }}>None</Text>
              </TouchableOpacity>
              {doctors.slice(0, 6).map((d) => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => setCreateDoctorId(d.id)}
                  style={[
                    localStyles.pill,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                    createDoctorId === d.id && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Text style={{ fontWeight: "800", color: theme.colors.text }}>
                    {(d.full_name || d.email || "Doctor").split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!createError && (
              <Text style={{ color: theme.colors.error, fontWeight: "700" }}>
                {createError}
              </Text>
            )}

            <View style={localStyles.modalActions}>
              <TouchableOpacity
                onPress={() => setCreateOpen(false)}
                style={[localStyles.outlineBtn, { borderColor: theme.colors.border }]}
                disabled={creating}
              >
                <Text style={[localStyles.outlineBtnText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createVirtualClinic}
                style={[localStyles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={localStyles.primaryBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ title, value, theme }: { title: string; value: number; theme: any }) {
  return (
    <View
      style={[
        localStyles.statCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 }}>
        {title}
      </Text>
      <Text style={{ color: theme.colors.text, fontWeight: "900", fontSize: 22, marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  h1: { fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 2, fontWeight: "700", opacity: 0.75 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "24%",
    minWidth: 200,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h2: { fontSize: 16, fontWeight: "900" },
  vcRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vcName: { fontWeight: "900", fontSize: 15 },
  vcMeta: { marginTop: 4, fontWeight: "700", fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontWeight: "900", fontSize: 12 },
  primaryBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  outlineBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  outlineBtnText: { fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modal: { borderRadius: 20, padding: 18, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  input: { borderWidth: 1, borderRadius: 12, padding: 12 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 6 },
});
