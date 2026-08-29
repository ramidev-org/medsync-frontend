import { TopBar } from "@/components/layout/top_bar";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { db } from "@/database/database_conn";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const { user } = useAuth();
  const { isClinicAdmin, clinic, subscription } = useAppData();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    try {
      if (!user?.id || !isClinicAdmin) {
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
        virtual_clinics: toNumber(c?.virtual_clinics ?? c?.virtual_clinics_count ?? c?.virtual_clinic_count),
        appointments_total: toNumber(c?.appointments_total ?? c?.appointments ?? c?.appointments_count),
        appointments_pending: toNumber(c?.appointments_pending ?? c?.pending_appointments ?? c?.pending_count),
        payments_total: toNumber(c?.payments_total ?? c?.payments ?? c?.payments_count),
        payments_paid: toNumber(c?.payments_paid ?? c?.paid_payments ?? c?.paid_count),
      };

      setCounts(nextCounts);
      setStaff(s ?? []);
      setVirtualClinics(v ?? []);

      const { data: specData } = await db.from("doctor_specialities").select("id,name").order("name", { ascending: true });
      setSpecialities((specData as any[])?.map((item) => ({ id: String(item.id), name: String(item.name) })) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load clinic dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [isClinicAdmin, user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const doctors = staff.filter((entry) => entry.user_type === "doctor");
  const assistants = staff.filter((entry) => entry.user_type === "assistant");
  const activeVirtualClinics = virtualClinics.filter((entry) => entry.active).length;
  const utilization = subscription.max_doctors ? Math.round(((subscription.current_doctors ?? 0) / Math.max(1, subscription.max_doctors)) * 100) : 0;

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
        <View style={styles.row}>
          <View style={styles.leftColumn}>
            {error ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.colors.error, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: `${theme.colors.error}12` }}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
                <Text style={{ color: theme.colors.error, fontWeight: "700", fontSize: 13, flex: 1 }}>{error}</Text>
                <TouchableOpacity onPress={() => void refresh()}>
                  <Text style={{ color: theme.colors.error, fontWeight: "700", fontSize: 13, textDecorationLine: "underline" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={[styles.welcomeCard, localStyles.heroCard]}>
              <View style={localStyles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeTitle}>Clinic admin overview</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Monitor staff capacity, subscription health, and virtual clinic coverage from one cleaner control surface.
                  </Text>
                </View>
                <View style={localStyles.heroPill}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#1D4ED8" />
                  <Text style={localStyles.heroPillText}>Admin mode</Text>
                </View>
              </View>

              <View style={localStyles.heroInfoGrid}>
                <InfoChip label="Clinic" value={clinic?.name ? String(clinic.name) : "MyDoctor"} />
                <InfoChip label="Plan" value={(subscription?.tier_plan || clinic?.tier_plan || "basic").toString()} />
                <InfoChip label="Subscription" value={subscription?.status || "missing"} />
              </View>
            </View>

            {loading ? (
              <View style={localStyles.loadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={localStyles.loadingText}>Loading dashboard…</Text>
              </View>
            ) : (
              <View style={styles.statsRow}>
                <MetricCard title="Patients" value={counts.patients ?? 0} icon="people-outline" tone="#2563EB" theme={theme} />
                <MetricCard title="Doctors" value={counts.doctors ?? 0} icon="medkit-outline" tone="#0F766E" theme={theme} />
                <MetricCard title="Assistants" value={counts.assistants ?? 0} icon="headset-outline" tone="#7C3AED" theme={theme} />
                <MetricCard title="Virtual clinics" value={counts.virtual_clinics ?? 0} icon="layers-outline" tone="#EA580C" theme={theme} />
              </View>
            )}

            <View style={[styles.chartCard, localStyles.sectionCard]}>
              <View style={localStyles.sectionHeader}>
                <View>
                  <Text style={styles.cardTitle}>Virtual clinics</Text>
                  <Text style={localStyles.sectionSub}>{activeVirtualClinics} active cabinet{activeVirtualClinics === 1 ? "" : "s"} connected today</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setCreateError("");
                    setCreateOpen(true);
                  }}
                  style={localStyles.primaryAction}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={localStyles.primaryActionText}>Create cabinet</Text>
                </TouchableOpacity>
              </View>

              <View style={localStyles.virtualClinicList}>
                {virtualClinics.map((item, index) => {
                  const assigned = doctors.find((entry) => entry.id === item.doctor_id);
                  const tone = avatarTone(index);
                  return (
                    <View key={item.id} style={localStyles.virtualClinicRow}>
                      <View style={[localStyles.virtualClinicIcon, { backgroundColor: tone.backgroundColor, borderColor: tone.borderColor }]}>
                        <Text style={[localStyles.virtualClinicIconText, { color: tone.color }]}>
                          {(item.speciality_name || "VC").slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={localStyles.virtualClinicTitle} numberOfLines={1}>{item.speciality_name || "Virtual clinic"}</Text>
                        <Text style={localStyles.virtualClinicMeta} numberOfLines={1}>
                          {assigned?.full_name || assigned?.email || item.doctor_name || "Unassigned"}
                        </Text>
                      </View>
                      <View style={[localStyles.stateBadge, item.active ? localStyles.stateBadgeActive : localStyles.stateBadgePaused]}>
                        <Text style={[localStyles.stateBadgeText, item.active ? localStyles.stateBadgeTextActive : localStyles.stateBadgeTextPaused]}>
                          {item.active ? "Active" : "Paused"}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {!virtualClinics.length ? (
                  <Text style={localStyles.emptyText}>No virtual clinics have been created yet.</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={[styles.doctorCard, localStyles.sectionCard]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Staff capacity</Text>
              <ProgressRow label="Doctor seats used" value={`${subscription.current_doctors ?? 0}/${subscription.max_doctors ?? "—"}`} progress={utilization} theme={theme} />
              <ProgressRow
                label="Assistant seats used"
                value={`${subscription.current_assistants ?? 0}/${subscription.max_assistants ?? "—"}`}
                progress={subscription.max_assistants ? Math.round(((subscription.current_assistants ?? 0) / Math.max(1, subscription.max_assistants)) * 100) : 0}
                theme={theme}
              />
              <View style={localStyles.inlineCards}>
                <MiniCard label="Pending appointments" value={counts.appointments_pending ?? 0} theme={theme} />
                <MiniCard label="Paid payments" value={counts.payments_paid ?? 0} theme={theme} />
              </View>
            </View>

            <View style={[styles.doctorCard, localStyles.sectionCard, { marginTop: 14 }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Team snapshot</Text>
              <View style={localStyles.peopleList}>
                <TeamRow title="Doctors" value={doctors.length} icon="medkit-outline" theme={theme} />
                <TeamRow title="Assistants" value={assistants.length} icon="headset-outline" theme={theme} />
                <TeamRow title="Total staff" value={staff.length} icon="people-outline" theme={theme} />
              </View>
            </View>

            <View style={[styles.doctorCard, localStyles.sectionCard, { marginTop: 14 }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Subscription summary</Text>
              <View style={localStyles.summaryStack}>
                <SummaryRow label="Status" value={subscription.status || "missing"} />
                <SummaryRow label="Expiry" value={subscription.expires_at ? String(subscription.expires_at).slice(0, 10) : "Not set"} />
                <SummaryRow label="Payments" value={String(counts.payments_total ?? 0)} />
                <SummaryRow label="Appointments" value={String(counts.appointments_total ?? 0)} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={createOpen} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <View style={[localStyles.modal, { backgroundColor: theme.colors.surface }]}>
            <Text style={[localStyles.modalTitle, { color: theme.colors.text }]}>Create virtual clinic</Text>

            <Text style={[localStyles.modalLabel, { color: theme.colors.textSecondary }]}>Speciality</Text>
            <View style={localStyles.pillsRow}>
              {specialities.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setCreateSpecialityId(item.id)}
                  style={[
                    localStyles.pill,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                    createSpecialityId === item.id && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Text style={{ fontWeight: "600", color: theme.colors.text }}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[localStyles.modalLabel, { color: theme.colors.textSecondary }]}>Assign doctor</Text>
            <View style={localStyles.pillsRow}>
              <TouchableOpacity
                onPress={() => setCreateDoctorId(null)}
                style={[
                  localStyles.pill,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                  createDoctorId == null && { borderColor: theme.colors.primary },
                ]}
              >
                <Text style={{ fontWeight: "600", color: theme.colors.text }}>None</Text>
              </TouchableOpacity>
              {doctors.slice(0, 8).map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => setCreateDoctorId(entry.id)}
                  style={[
                    localStyles.pill,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                    createDoctorId === entry.id && { borderColor: theme.colors.primary },
                  ]}
                >
                  <Text style={{ fontWeight: "600", color: theme.colors.text }}>{(entry.full_name || entry.email || "Doctor").split(" ")[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setCreateActive((value) => !value)} style={[localStyles.toggleRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <Ionicons name={createActive ? "checkmark-circle" : "ellipse-outline"} size={18} color={createActive ? theme.colors.primary : theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.text, fontWeight: "600" }}>Activate immediately</Text>
            </TouchableOpacity>

            {!!createError ? <Text style={{ color: theme.colors.error, fontWeight: "700" }}>{createError}</Text> : null}

            <View style={localStyles.modalActions}>
              <TouchableOpacity onPress={() => setCreateOpen(false)} style={[localStyles.secondaryAction, { borderColor: theme.colors.border }]} disabled={creating}>
                <Text style={[localStyles.secondaryActionText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createVirtualClinic} style={localStyles.primaryAction} disabled={creating}>
                {creating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={localStyles.primaryActionText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={localStyles.infoChip}>
      <Text style={localStyles.infoChipLabel}>{label}</Text>
      <Text style={localStyles.infoChipValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function MetricCard({ title, value, icon, tone, theme }: any) {
  return (
    <View style={[localStyles.metricCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[localStyles.metricIcon, { backgroundColor: `${tone}16`, borderColor: `${tone}24` }]}>
        <Ionicons name={icon} size={20} color={tone} />
      </View>
      <Text style={[localStyles.metricValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[localStyles.metricTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

function ProgressRow({ label, value, progress, theme }: any) {
  return (
    <View>
      <View style={localStyles.progressTop}>
        <Text style={[localStyles.rowLabel, { color: theme.colors.muted }]}>{label}</Text>
        <Text style={[localStyles.rowValue, { color: theme.colors.text }]}>{value}</Text>
      </View>
      <View style={[localStyles.progressBar, { backgroundColor: theme.colors.border }]}>
        <View style={[localStyles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: theme.colors.primary }]} />
      </View>
    </View>
  );
}

function MiniCard({ label, value, theme }: any) {
  return (
    <View style={[localStyles.miniCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
      <Text style={[localStyles.rowLabel, { color: theme.colors.muted }]}>{label}</Text>
      <Text style={[localStyles.rowValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function TeamRow({ title, value, icon, theme }: any) {
  return (
    <View style={[localStyles.teamRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
      <View style={[localStyles.teamIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={[localStyles.teamTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[localStyles.teamValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={localStyles.summaryRow}>
      <Text style={localStyles.summaryLabel}>{label}</Text>
      <Text style={localStyles.summaryValue}>{value}</Text>
    </View>
  );
}

function avatarTone(index: number) {
  const tones = [
    { backgroundColor: "#EDF5FF", borderColor: "#CCDBF1", color: "#1D4ED8" },
    { backgroundColor: "#EAFBF4", borderColor: "#BCEBD6", color: "#047857" },
    { backgroundColor: "#FFF7ED", borderColor: "#FED7AA", color: "#EA580C" },
    { backgroundColor: "#F3EDFF", borderColor: "#DED2FF", color: "#7C3AED" },
  ];
  return tones[index % tones.length];
}

const localStyles = StyleSheet.create({
  heroCard: {
    gap: 18,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    flexWrap: "wrap",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EDF5FF",
  },
  heroPillText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  heroInfoGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  infoChip: {
    minWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DCE7F5",
  },
  infoChipLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  infoChipValue: {
    marginTop: 5,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  metricTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCard: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  sectionSub: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#2563EB",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryAction: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  secondaryActionText: {
    fontWeight: "700",
  },
  virtualClinicList: {
    gap: 10,
  },
  virtualClinicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE7F5",
    backgroundColor: "#F8FBFF",
  },
  virtualClinicIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  virtualClinicIconText: {
    fontSize: 14,
    fontWeight: "700",
  },
  virtualClinicTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  virtualClinicMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  stateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  stateBadgeActive: {
    backgroundColor: "#EAFBF4",
    borderColor: "#BCEBD6",
  },
  stateBadgePaused: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECACA",
  },
  stateBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  stateBadgeTextActive: {
    color: "#047857",
  },
  stateBadgeTextPaused: {
    color: "#B91C1C",
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressBar: {
    height: 9,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  inlineCards: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  miniCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  peopleList: {
    gap: 10,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  teamIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  teamTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  teamValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryStack: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5EDF7",
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.32)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalLabel: {
    fontWeight: "600",
    fontSize: 12,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
});
