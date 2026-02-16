import { TopBar } from "@/components/top_bar";
import { getCurrentRoleImage } from "@/config/runtime";
import { useAuth } from "@/contexts/auth_context";
import { MOCK } from "@/data/mock";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getDashboardStyles } from "./_styles";

type ClinicStatus = "inwork" | "paused";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const SPECIALITIES = [
  "Médecine générale",
  "Cardiologie",
  "Dermatologie",
  "Pédiatrie",
  "Ophtalmologie",
  "Orthopédie",
  "Urologie",
  "Neurologie",
];

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function buildClinicName(inputName: string, doctors: any[], assignedDoctorId: string | null) {
  const trimmed = (inputName ?? "").trim();
  if (trimmed) return trimmed;

  const d = doctors.find((x: any) => x.id === assignedDoctorId);
  if (d?.full_name) return `Clinique (${d.full_name})`;
  return "Clinique";
}

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDashboardStyles(theme), [theme]);
  const { user } = useAuth();

  const doctors = (MOCK as any).adminUsers?.doctors ?? [];

  const [clinics, setClinics] = useState<any[]>(
    ((MOCK as any).adminClinics ?? []).map((c: any) => ({
      status: (c.status as ClinicStatus) ?? "inwork",
      speciality: c.speciality ?? "Médecine générale",
      workingDays: c.workingDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"],
      assignedDoctorId: c.assignedDoctorId ?? null,
      name: c.name ?? "",
      code: c.code ?? "",
      ...c,
    })),
  );

  const [assignClinicId, setAssignClinicId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string; // optional
    code: string;
    speciality: string;
    workingDays: string[];
    assignedDoctorId: string | null;
    status: ClinicStatus;
  }>({
    name: "",
    code: "",
    speciality: "Médecine générale",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    assignedDoctorId: null,
    status: "inwork",
  });

  const assignedCount = clinics.filter((c) => !!c.assignedDoctorId).length;
  const pausedCount = clinics.filter((c) => c.status === "paused").length;

  const openCreate = () => {
    setEditingClinicId(null);
    setForm({
      name: "",
      code: "",
      speciality: "Médecine générale",
      workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      assignedDoctorId: null,
      status: "inwork",
    });
    setModalOpen(true);
  };

  const openEdit = (clinic: any) => {
    setEditingClinicId(clinic.id);
    setForm({
      name: clinic.name ?? "",
      code: clinic.code ?? "",
      speciality: clinic.speciality ?? "Médecine générale",
      workingDays: clinic.workingDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"],
      assignedDoctorId: clinic.assignedDoctorId ?? null,
      status: (clinic.status as ClinicStatus) ?? "inwork",
    });
    setModalOpen(true);
  };

  const assignDoctor = (clinicId: string, doctorId: string | null) => {
    setClinics((prev) =>
      prev.map((c) => (c.id === clinicId ? { ...c, assignedDoctorId: doctorId } : c)),
    );
  };

  const toggleStatus = (clinicId: string) => {
    setClinics((prev) =>
      prev.map((c) =>
        c.id === clinicId
          ? { ...c, status: c.status === "paused" ? "inwork" : "paused" }
          : c,
      ),
    );
  };

  const upsertClinic = () => {
    const computedName = buildClinicName(form.name, doctors, form.assignedDoctorId);

    if (!editingClinicId) {
      const newClinic = {
        id: uid(),
        name: computedName,
        code: form.code?.trim() ?? "",
        speciality: form.speciality,
        workingDays: form.workingDays,
        assignedDoctorId: form.assignedDoctorId,
        status: form.status,
      };
      setClinics((prev) => [newClinic, ...prev]);
      setModalOpen(false);
      return;
    }

    setClinics((prev) =>
      prev.map((c) =>
        c.id === editingClinicId
          ? {
              ...c,
              name: computedName,
              code: form.code?.trim() ?? "",
              speciality: form.speciality,
              workingDays: form.workingDays,
              assignedDoctorId: form.assignedDoctorId,
              status: form.status,
            }
          : c,
      ),
    );
    setModalOpen(false);
    setEditingClinicId(null);
  };

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <View style={[styles.container, { flex: 1 }]}>


        <View style={styles.row}>
          {/* LEFT */}
          <View style={styles.leftColumn}>
            {/* Welcome */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Bonjour, Admin </Text>
              <Text style={styles.welcomeSubtitle}>
                Gérez vos cliniques, assignez des médecins, et suivez l’état d’activité.
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <ActionChip theme={theme} icon="add" label="Nouvelle clinique" onPress={openCreate} primary />
                <ActionChip theme={theme} icon="pulse" label={`${assignedCount}/${clinics.length} assignées`} onPress={() => {}} />
                <ActionChip theme={theme} icon="pause" label={`${pausedCount} en pause`} onPress={() => {}} />
              </View>
            </View>

            {/* Clinics grid */}
            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, paddingBottom: 16 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 0 }]}>
                  Mes cliniques
                </Text>

                <TouchableOpacity
                  onPress={openCreate}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                  }}
                >
                  <Ionicons name="add" size={18} color={theme.colors.primary} />
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>Créer</Text>
                </TouchableOpacity>
              </View>

               {/* ✅ give the grid area a bounded height */}
  <View style={{ height: 550 /* <-- adjust */}}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        paddingBottom: 20,
      }}
      showsVerticalScrollIndicator
    >
                {clinics.map((c) => {
                  const assigned = doctors.find((d: any) => d.id === c.assignedDoctorId);

                  const statusTone =
                    c.status === "paused"
                      ? {
                          bg: "rgba(245, 158, 11, 0.12)",
                          border: "rgba(245, 158, 11, 0.30)",
                          text: "#b45309",
                          label: "En pause",
                          icon: "pause",
                        }
                      : {
                          bg: "rgba(34, 197, 94, 0.12)",
                          border: "rgba(34, 197, 94, 0.28)",
                          text: "#15803d",
                          label: "En service",
                          icon: "checkmark-circle",
                        };

                  return (
                    <View
                      key={c.id}
                      style={{
                        // ✅ prevents “single card stretching across the row”
                        maxWidth: "100%" as any,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                        overflow: "hidden",
                      }}
                    >
                      <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
                              {c.name}
                            </Text>

                       

                            <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                              <Chip theme={theme} label={c.speciality ?? "Médecine générale"}  />
                              <Chip theme={theme} label={(c.workingDays ?? []).join(" • ")} />
                            </View>
                          </View>

                          <View
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: statusTone.bg,
                              borderWidth: 1,
                              borderColor: statusTone.border,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons name={statusTone.icon as any} size={14} color={statusTone.text} />
                            <Text style={{ fontWeight: "700", color: statusTone.text, fontSize: 12 }}>
                              {statusTone.label}
                            </Text>
                          </View>
                        </View>

                        {/* Assigned doctor */}
                        <View
                          style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                          }}
                        >
                          <Text style={{ color: theme.colors.muted, fontWeight: "700", marginBottom: 6 }}>
                            Médecin assigné
                          </Text>

                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <Text style={{ fontWeight: "600", color: theme.colors.text, flex: 1 }}>
                              {assigned ? `${assigned.full_name} • ${assigned.speciality}` : "Aucun"}
                            </Text>

                            <TouchableOpacity
                              onPress={() => setAssignClinicId(c.id)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.surface,
                              }}
                            >
                              <Text style={{ fontWeight: "900", color: theme.colors.primary }}>
                                Assigner
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Footer actions */}
                      <View
                        style={{
                          padding: 14,
                          borderTopWidth: 1,
                          borderTopColor: theme.colors.border,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => toggleStatus(c.id)}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <Ionicons
                            name={c.status === "paused" ? "play" : "pause"}
                            size={16}
                            color={theme.colors.text}
                          />
                          <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                            {c.status === "paused" ? "Reprendre" : "Mettre en pause"}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => openEdit(c)}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: "rgba(13,110,253,0.25)",
                            backgroundColor: "rgba(13,110,253,0.06)",
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                          <Text style={{ fontWeight: "900", color: theme.colors.primary }}>Modifier</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              </View>
            </View>
          </View>

          {/* RIGHT (like _doctor) */}
          <View style={[styles.rightColumn, { gap: 16 }]}>
            {/* Resume card with avatar */}
            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Image
                  source={{ uri: getCurrentRoleImage() }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 2,
                    borderColor: theme.colors.primary,
                  }}
                />

                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>
                    {user?.fullname ? `Admin ${user.fullname}` : "Admin"}
                  </Text>
                  <Text style={{ marginTop: 4, color: theme.colors.muted, fontWeight: "700" }}>
                    Gestionnaire des cliniques
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 16 }} />

              <StatRow theme={theme} label="Cliniques" value={String(clinics.length)} />
              <StatRow theme={theme} label="Assignées" value={String(assignedCount)} />
              <StatRow theme={theme} label="En pause" value={String(pausedCount)} />

              <Text style={{ marginTop: 12, marginBottom: 8, color: theme.colors.muted, fontWeight: "900" }}>
                Progression
              </Text>
              <ProgressBar
                theme={theme}
                value={Math.round((assignedCount / Math.max(1, clinics.length)) * 100)}
              />
            </View>

            {/* Recent activity */}
            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Activité récente</Text>

              <View style={{ gap: 12 }}>
                <ActivityItem theme={theme} icon="add-circle" title="Nouvelle clinique créée" time="Il y a 25 min" />
                <ActivityItem theme={theme} icon="person-add" title="Médecin assigné à une clinique" time="Il y a 2 h" />
                <ActivityItem theme={theme} icon="pause" title="Clinique mise en pause" time="Hier" />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Assign doctor modal */}
      <Modal transparent visible={!!assignClinicId} animationType="fade">
        <Pressable
          onPress={() => setAssignClinicId(null)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              width: "100%",
              maxWidth: 520,
              backgroundColor: theme.colors.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.colors.border,
              overflow: "hidden",
            }}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <Text style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>
                Assigner un médecin
              </Text>
              <Text style={{ marginTop: 6, color: theme.colors.muted }}>
                Choisissez un médecin pour cette clinique.
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ padding: 12, gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  if (!assignClinicId) return;
                  assignDoctor(assignClinicId, null);
                  setAssignClinicId(null);
                }}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontWeight: "900", color: theme.colors.text }}>Aucun</Text>
                <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
              </TouchableOpacity>

              {doctors.map((d: any) => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => {
                    if (!assignClinicId) return;
                    assignDoctor(assignClinicId, d.id);
                    setAssignClinicId(null);
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "900", color: theme.colors.text }}>{d.full_name}</Text>
                    <Text style={{ marginTop: 2, color: theme.colors.muted }}>{d.speciality}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <TouchableOpacity
                onPress={() => setAssignClinicId(null)}
                style={{
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: theme.colors.background,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "900", color: theme.colors.text }}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create / Edit modal */}
      <ClinicModal
        theme={theme}
        visible={modalOpen}
        title={editingClinicId ? "Modifier la clinique" : "Créer une clinique"}
        doctors={doctors}
        form={form}
        setForm={setForm}
        onClose={() => {
          setModalOpen(false);
          setEditingClinicId(null);
        }}
        onSubmit={upsertClinic}
      />
    </View>
  );
}

/* -------------------- small UI helpers -------------------- */

function ActionChip({ theme, icon, label, onPress, primary }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: primary ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.18)",
        backgroundColor: primary ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.10)",
      }}
    >
      <Ionicons name={icon} size={16} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "900" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Chip({ theme, label }: any) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text style={{ fontWeight: "900", fontSize: 12, color: theme.colors.text }}>{label}</Text>
    </View>
  );
}

function StatRow({ theme, label, value }: any) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

function ProgressBar({ theme, value }: { theme: any; value: number }) {
  return (
    <View
      style={{
        height: 10,
        borderRadius: 999,
        overflow: "hidden",
        backgroundColor: theme.colors.border,
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, value))}%`,
          borderRadius: 999,
          backgroundColor: theme.colors.success,
        }}
      />
    </View>
  );
}

function ActivityItem({ theme, icon, title, time }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.accent,
        }}
      >
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", color: theme.colors.text }}>{title}</Text>
        <Text style={{ marginTop: 2, color: theme.colors.muted, fontSize: 12 }}>{time}</Text>
      </View>
    </View>
  );
}

/* -------------------- Modal -------------------- */

function ClinicModal({
  theme,
  visible,
  title,
  doctors,
  form,
  setForm,
  onClose,
  onSubmit,
}: any) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            maxWidth: 720,
            backgroundColor: theme.colors.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            <Text style={{ fontWeight: "900", fontSize: 16, color: theme.colors.text }}>{title}</Text>
            <Text style={{ marginTop: 6, color: theme.colors.muted }}>
              Nom optionnel (si vide → Clinique (Nom du médecin)).
            </Text>
          </View>

          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Field
              theme={theme}
              label="Nom (optionnel)"
              value={form.name}
              onChangeText={(v: string) => setForm((p: any) => ({ ...p, name: v }))}
              placeholder="Clinique du Centre"
            />

            <Field
              theme={theme}
              label="Code (optionnel)"
              value={form.code}
              onChangeText={(v: string) => setForm((p: any) => ({ ...p, code: v }))}
              placeholder="CLN-001"
            />

            {/* Speciality */}
            <Text style={{ fontWeight: "900", color: theme.colors.text }}>Spécialité</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {SPECIALITIES.map((s) => {
                const active = form.speciality === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setForm((p: any) => ({ ...p, speciality: s }))}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primarySoft : theme.colors.background,
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: active ? theme.colors.primary : theme.colors.text }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Working days */}
            <Text style={{ fontWeight: "900", color: theme.colors.text }}>Jours ouvrés</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DAYS.map((d) => {
                const active = form.workingDays.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => {
                      setForm((p: any) => {
                        const next = new Set(p.workingDays);
                        if (next.has(d)) next.delete(d);
                        else next.add(d);
                        return { ...p, workingDays: Array.from(next) };
                      });
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primarySoft : theme.colors.background,
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: active ? theme.colors.primary : theme.colors.text }}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Assigned doctor */}
            <Text style={{ fontWeight: "900", color: theme.colors.text }}>Médecin à assigner</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setForm((p: any) => ({ ...p, assignedDoctorId: null }))}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: !form.assignedDoctorId ? theme.colors.primary : theme.colors.border,
                  backgroundColor: !form.assignedDoctorId ? theme.colors.primarySoft : theme.colors.background,
                }}
              >
                <Text style={{ fontWeight: "900", color: !form.assignedDoctorId ? theme.colors.primary : theme.colors.text }}>
                  Aucun
                </Text>
              </TouchableOpacity>

              {doctors.map((doc: any) => {
                const active = form.assignedDoctorId === doc.id;
                return (
                  <TouchableOpacity
                    key={doc.id}
                    onPress={() => setForm((p: any) => ({ ...p, assignedDoctorId: doc.id }))}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primarySoft : theme.colors.background,
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: active ? theme.colors.primary : theme.colors.text }}>
                      {doc.full_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status */}
            <Text style={{ fontWeight: "900", color: theme.colors.text }}>État</Text>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {(["inwork", "paused"] as ClinicStatus[]).map((s) => {
                const active = form.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setForm((p: any) => ({ ...p, status: s }))}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primarySoft : theme.colors.background,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Ionicons
                      name={s === "paused" ? "pause" : "checkmark-circle"}
                      size={16}
                      color={active ? theme.colors.primary : theme.colors.text}
                    />
                    <Text style={{ fontWeight: "900", color: active ? theme.colors.primary : theme.colors.text }}>
                      {s === "paused" ? "En pause" : "En service"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: theme.colors.border, flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "900", color: theme.colors.text }}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSubmit}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "900", color: "#fff" }}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ theme, label, value, onChangeText, placeholder }: any) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: "900", color: theme.colors.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          fontWeight: "700",
        }}
      />
    </View>
  );
}
