import DatePickerField from "@/components/datepicker";
import { ThemedCard } from "@/components/default_card";
import { DateRangePickerField } from "@/components/datepicker";
import { Dropdown } from "@/components/input_fields";
import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { useAuth } from "@/contexts/auth_context";
import { db } from "@/database/database_conn";
import { callRpc } from "@/services/backend";
import { PAGE_GUTTER, getWebContainerFill } from "@/theme/layout";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirme",
  completed: "Termine",
  cancelled: "Annule",
  no_show: "Absent",
  in_consultation: "En consultation",
};

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "in_consultation";

type AppointmentType =
  | "consultation"
  | "follow_up"
  | "emergency"
  | "procedure"
  | "regular"
  | string;

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  age?: number;
};

type Appointment = {
  id: string;
  clinic_id?: string;
  patient_id: string;
  doctor_id?: string | null;
  doctor_name?: string;
  time: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes: string;
  patient?: Patient;
};

type RpcGetAppointmentsResponse = {
  appointments: {
    id: string;
    clinic_id?: string;
    patient_id: string;
    doctor_id?: string | null;
    scheduled_at: string;
    status: string;
    type: string;
    notes: string | null;
    patient_first_name?: string | null;
    patient_last_name?: string | null;
    patient_phone?: string | null;
    doctor_name?: string | null;
  }[];
  total: number;
  page: number;
  itemsPerPage: number;
};

type RpcGetPatientsResponse = {
  patients: {
    id: string;
    code?: string | null;
    first_name: string;
    last_name: string;
    phone?: string | null;
  }[];
  total: number;
};

type StaffRow = {
  id: string;
  full_name: string;
  user_type: "doctor" | "assistant";
  active: boolean;
};

function toDayStart(d: Date) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDayEnd(d: Date) {
  const next = new Date(d);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getTimeValue(iso?: string) {
  if (!iso) return "09:00";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function mergeDateAndTime(date: Date, hhmm: string) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  const d = new Date(date);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d.toISOString();
}

function shouldFallbackAppointmentRpc(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("appointment_status_enum = text") ||
    message.includes("rpc_create_appointment") ||
    message.includes("rpc_update_appointment") ||
    message.includes("rpc_cancel_appointment")
  );
}

export default function VisitsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    return next;
  });
  const [toDate, setToDate] = useState(() => {
    const next = new Date();
    next.setHours(23, 59, 0, 0);
    return next;
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [patientOptions, setPatientOptions] = useState<{ id: string; label: string }[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<{ id: string; label: string }[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [actionsTarget, setActionsTarget] = useState<Appointment | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [patientLabel, setPatientLabel] = useState("");
  const [doctorLabel, setDoctorLabel] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("consultation");
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus>("pending");
  const [appointmentNotes, setAppointmentNotes] = useState("");

  const patientLabelById = useMemo(
    () => Object.fromEntries(patientOptions.map((p) => [p.id, p.label])),
    [patientOptions],
  );

  const doctorLabelById = useMemo(
    () => Object.fromEntries(doctorOptions.map((d) => [d.id, d.label])),
    [doctorOptions],
  );

  const fetchAppointments = useCallback(async () => {
    try {
      if (!user?.id) return;

      const data = await callRpc<RpcGetAppointmentsResponse, Record<string, unknown>>(
        "rpc_get_appointments",
        {
          p_requester_id: user.id,
          p_start_date: fromDate.toISOString(),
          p_end_date: toDate.toISOString(),
          p_page: 1,
          p_items_per_page: 300,
        },
      );

      const rows = data?.appointments ?? [];
      setAppointments(
        rows.map((a) => ({
          id: String(a.id),
          clinic_id: a.clinic_id ? String(a.clinic_id) : undefined,
          patient_id: String(a.patient_id ?? ""),
          doctor_id: a.doctor_id ? String(a.doctor_id) : null,
          doctor_name: a.doctor_name ? String(a.doctor_name) : "-",
          time: String(a.scheduled_at ?? ""),
          status: (a.status as AppointmentStatus) ?? "pending",
          type: String(a.type ?? "consultation"),
          notes: String(a.notes ?? ""),
          patient: {
            id: String(a.patient_id ?? ""),
            first_name: String(a.patient_first_name ?? ""),
            last_name: String(a.patient_last_name ?? ""),
            phone: a.patient_phone ? String(a.patient_phone) : undefined,
          },
        })),
      );
    } catch (e: any) {
      console.error("Load appointments error:", e);
      setAppointments([]);
      Alert.alert("Erreur", e?.message || "Impossible de charger les rendez-vous");
    }
  }, [fromDate, toDate, user?.id]);

  const fetchFormOptions = useCallback(async () => {
    try {
      if (!user?.id) return;

      const [patientsResult, staffResult] = await Promise.all([
        callRpc<RpcGetPatientsResponse, Record<string, unknown>>("rpc_get_patients", {
          p_requester_id: user.id,
          p_page: 1,
          p_items_per_page: 300,
        }),
        callRpc<StaffRow[], Record<string, unknown>>("rpc_get_clinic_staff", {
          p_requester_id: user.id,
        }),
      ]);

      const patients = (patientsResult?.patients ?? []).map((p) => ({
        id: String(p.id),
        label: `${p.first_name} ${p.last_name}${p.code ? ` (${p.code})` : ""}`,
      }));

      const doctors = (staffResult ?? [])
        .filter((s) => s.user_type === "doctor" && s.active)
        .map((s) => ({ id: String(s.id), label: String(s.full_name || "Medecin") }));

      setPatientOptions(patients);
      setDoctorOptions(doctors);
    } catch (e) {
      console.error("Load options error:", e);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchFormOptions();
  }, [fetchFormOptions]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchesStatus = filter === "all" || a.status === filter;
      const fullName = `${a.patient?.first_name ?? ""} ${a.patient?.last_name ?? ""}`.toLowerCase();
      const doctorName = String(a.doctor_name ?? "").toLowerCase();
      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        doctorName.includes(search.toLowerCase()) ||
        String(a.type).toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [appointments, filter, search]);

  const waitingRoomAppointments = useMemo(
    () => appointments.filter((a) => a.status === "pending" || a.status === "confirmed" || a.status === "in_consultation"),
    [appointments],
  );

  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "completed").length,
    [appointments],
  );

  const progress = appointments.length > 0 ? Math.round((completedCount / appointments.length) * 100) : 0;

  const resetDateRange = useCallback(() => {
    const nextStart = new Date();
    nextStart.setHours(0, 0, 0, 0);
    const nextEnd = new Date();
    nextEnd.setHours(23, 59, 0, 0);
    setFromDate(nextStart);
    setToDate(nextEnd);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setPatientLabel("");
    setDoctorLabel("");
    setAppointmentDate(new Date());
    setAppointmentTime("09:00");
    setAppointmentType("consultation");
    setAppointmentStatus("pending");
    setAppointmentNotes("");
  };

  const openCreateForm = () => {
    setFormMode("create");
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (a: Appointment) => {
    setFormMode("edit");
    setEditingId(a.id);
    setPatientLabel(patientLabelById[a.patient_id] ?? `${a.patient?.first_name ?? ""} ${a.patient?.last_name ?? ""}`.trim());
    setDoctorLabel((a.doctor_id && doctorLabelById[a.doctor_id]) || a.doctor_name || "");
    setAppointmentDate(new Date(a.time));
    setAppointmentTime(getTimeValue(a.time));
    setAppointmentType(a.type);
    setAppointmentStatus(a.status);
    setAppointmentNotes(a.notes ?? "");
    setIsFormOpen(true);
  };

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      if (!user?.id) return;
      try {
        await callRpc<boolean, Record<string, unknown>>("rpc_update_appointment", {
          p_requester_id: user.id,
          p_appointment_id: id,
          p_status: status,
        });
      } catch (error) {
        if (!shouldFallbackAppointmentRpc(error)) throw error;
        const { error: updateError } = await db
          .from("appointments")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (updateError) throw updateError;
      }
      await fetchAppointments();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Impossible de mettre a jour le statut");
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      if (!user?.id) return;
      try {
        await callRpc<boolean, Record<string, unknown>>("rpc_cancel_appointment", {
          p_requester_id: user.id,
          p_appointment_id: id,
        });
      } catch (error) {
        if (!shouldFallbackAppointmentRpc(error)) throw error;
        const { error: cancelError } = await db
          .from("appointments")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", id);
        if (cancelError) throw cancelError;
      }
      await fetchAppointments();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Impossible d'annuler le rendez-vous");
    }
  };

  const startConsultation = async (a: Appointment) => {
    await updateStatus(a.id, "confirmed");
    router.push(`/consultation?id=${a.id}`);
  };

  const openRowActions = (a: Appointment) => {
    setActionsTarget(a);
    setIsActionsMenuOpen(true);
  };

  const submitForm = async () => {
    try {
      if (!user?.id) return;

      const patientId = patientOptions.find((p) => p.label === patientLabel)?.id;
      const doctorId = doctorOptions.find((d) => d.label === doctorLabel)?.id;

      if (!patientId) {
        Alert.alert("Validation", "Veuillez selectionner un patient");
        return;
      }

      if (!doctorId) {
        Alert.alert("Validation", "Veuillez selectionner un medecin");
        return;
      }

      const scheduledAt = mergeDateAndTime(appointmentDate, appointmentTime);
      if (!scheduledAt) {
        Alert.alert("Validation", "Heure invalide. Utilisez HH:mm (ex: 14:30)");
        return;
      }

      setIsSubmitting(true);

      if (formMode === "create") {
        try {
          await callRpc<string, Record<string, unknown>>("rpc_create_appointment", {
            p_requester_id: user.id,
            p_patient_id: patientId,
            p_doctor_id: doctorId,
            p_scheduled_at: scheduledAt,
            p_status: appointmentStatus,
            p_type: appointmentType,
            p_notes: appointmentNotes || null,
          });
        } catch (error) {
          if (!shouldFallbackAppointmentRpc(error)) throw error;
          const { error: insertError } = await db.from("appointments").insert({
            clinic_id: user.clinic_id,
            patient_id: patientId,
            doctor_id: doctorId,
            scheduled_at: scheduledAt,
            status: appointmentStatus,
            type: appointmentType,
            notes: appointmentNotes || null,
          });
          if (insertError) throw insertError;
        }
      } else {
        if (!editingId) return;
        try {
          await callRpc<boolean, Record<string, unknown>>("rpc_update_appointment", {
            p_requester_id: user.id,
            p_appointment_id: editingId,
            p_doctor_id: doctorId,
            p_scheduled_at: scheduledAt,
            p_status: appointmentStatus,
            p_type: appointmentType,
            p_notes: appointmentNotes || null,
          });
        } catch (error) {
          if (!shouldFallbackAppointmentRpc(error)) throw error;
          const { error: updateError } = await db
            .from("appointments")
            .update({
              doctor_id: doctorId,
              scheduled_at: scheduledAt,
              status: appointmentStatus,
              type: appointmentType,
              notes: appointmentNotes || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingId);
          if (updateError) throw updateError;
        }
      }

      setIsFormOpen(false);
      resetForm();
      await fetchAppointments();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Echec de sauvegarde du rendez-vous");
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(theme);
  const TABLE_FIXED_HEIGHT = 560;
  const RIGHT_CARD_HEIGHT = TABLE_FIXED_HEIGHT + 126;

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.left}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.filterSection}>
              <View style={styles.searchFieldWrap}>
                <View style={styles.fieldLabelSpacer} />
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={20} color="#9ca3af" />
                  <TextInput
                    placeholder="Rechercher patient, medecin, type..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                  />
                  {search ? (
                    <TouchableOpacity
                      onPress={() => setSearch("")}
                      style={styles.searchClearButton}
                      hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <DateRangePickerField
                label="Plage de date"
                startDate={fromDate}
                endDate={toDate}
                setStartDate={setFromDate}
                setEndDate={setToDate}
                onClear={resetDateRange}
              />

              <TouchableOpacity style={styles.primaryButton} onPress={openCreateForm}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Nouveau RDV</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.tabs, { backgroundColor: theme.colors.surfaceVariant }]}> 
              {[
                { key: "all", label: "Tous" },
                { key: "pending", label: "En attente" },
                { key: "confirmed", label: "Confirmes" },
                { key: "completed", label: "Termine" },
                { key: "cancelled", label: "Annule" },
                { key: "no_show", label: "Absents" },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setFilter(tab.key)}
                  style={[styles.tab, filter === tab.key && { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.tabText, filter === tab.key && { color: "#fff" }]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.tableContainer, { height: TABLE_FIXED_HEIGHT }]}>
              <View style={[styles.tableRow, styles.header]}>
                <Text style={[styles.cell, { flex: 0.6 }]}>Avatar</Text>
                <Text style={[styles.cell, { flex: 1.2 }]}>Patient</Text>
                <Text style={[styles.cell, { flex: 1.2 }]}>Medecin</Text>
                <Text style={[styles.cell, { flex: 0.9 }]}>Heure</Text>
                <Text style={[styles.cell, { flex: 0.9 }]}>Type</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: "center" }]}>Status</Text>
                <Text style={{ flex: 1.25, textAlign: "center" }}>Actions</Text>
              </View>

              <ScrollView style={{ maxHeight: TABLE_FIXED_HEIGHT - 68 }}>
                {filteredAppointments.map((a) => (
                  <View key={a.id} style={styles.tableRow}>
                    <View style={{ flex: 0.6 }}>
                      <Avatar firstName={a.patient?.first_name || "P"} lastName={a.patient?.last_name || "-"} size={46} borderRadius={10} />
                    </View>

                    <Text style={[styles.cell, { flex: 1.2 }]}>{a.patient?.first_name} {a.patient?.last_name}</Text>
                    <Text style={[styles.cell, { flex: 1.2 }]} numberOfLines={1}>{a.doctor_name || "-"}</Text>
                    <Text style={[styles.cell, { flex: 0.9 }]}>
                      {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <Text style={[styles.cell, { flex: 0.9 }]}>{a.type}</Text>

                    <View style={{ flex: 1 }}>
                      <View style={[styles.status, statusColor(a.status)]}>
                        <Text style={styles.statusText}>{STATUS_LABELS[a.status]}</Text>
                      </View>
                    </View>

                    <View style={[styles.row, { flex: 1.25, justifyContent: "center", gap: 8 }]}>
                      <TouchableOpacity style={[styles.actionBtn, styles.primaryActionBtn]} onPress={() => startConsultation(a)}>
                        <Ionicons name="medkit-outline" size={16} color="#fff" />
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.actionBtn} onPress={() => openRowActions(a)}>
                        <Ionicons name="ellipsis-horizontal" size={16} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {filteredAppointments.length === 0 && (
                  <View style={{ padding: 20 }}>
                    <Text style={{ color: theme.colors.textSecondary }}>Aucun rendez-vous pour ce filtre.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </ScrollView>
          </View>

          <View style={styles.right}>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <ThemedCard style={{ height: RIGHT_CARD_HEIGHT }}>
              <View style={styles.waitingProgressTop}>
                <View>
                  <Text style={styles.progressTitle}>Etat d&apos;avancement</Text>
                  <Text style={styles.progressText}>{completedCount} sur {appointments.length} patients traites</Text>
                </View>
                <Text style={[styles.waitingProgressValue, { color: theme.colors.primary }]}>{progress}%</Text>
              </View>
              <View style={[styles.progressBg, { backgroundColor: theme.colors.border, marginBottom: 14 }]}> 
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
              </View>

              <Text style={styles.waitingTitle}>Salle d&apos;attente</Text>
              <Text style={styles.waitingSubtitle}>Patients en attente ou en consultation</Text>
              <ScrollView style={{ marginTop: 16 }} contentContainerStyle={{ paddingBottom: 8 }}>
                {waitingRoomAppointments.map((a) => (
                  <View key={a.id} style={styles.waitingCard}>
                    <Avatar firstName={a.patient?.first_name || "P"} lastName={a.patient?.last_name || "-"} size={56} borderRadius={12} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontWeight: "600" }}>{a.patient?.first_name} {a.patient?.last_name}</Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>
                        {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>{a.doctor_name || "-"}</Text>
                    </View>
                  </View>
                ))}

                {waitingRoomAppointments.length === 0 && (
                  <Text style={{ color: theme.colors.textSecondary }}>Aucun patient en attente.</Text>
                )}
              </ScrollView>
            </ThemedCard>
            </ScrollView>
          </View>
        </View>
      </View>

      <Modal visible={isFormOpen} transparent animationType="fade" onRequestClose={() => setIsFormOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formMode === "create" ? "Nouveau rendez-vous" : "Modifier rendez-vous"}</Text>
              <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Dropdown
                label="Patient"
                value={patientLabel}
                options={patientOptions.map((p) => p.label)}
                onChange={setPatientLabel}
                placeholder="Selectionner un patient"
                required
              />

              <Dropdown
                label="Medecin"
                value={doctorLabel}
                options={doctorOptions.map((d) => d.label)}
                onChange={setDoctorLabel}
                placeholder="Selectionner un medecin"
                required
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <DatePickerField label="Date" date={appointmentDate} setDate={setAppointmentDate} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Heure (HH:mm)</Text>
                  <TextInput
                    value={appointmentTime}
                    onChangeText={setAppointmentTime}
                    placeholder="09:30"
                    style={styles.fieldInput}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Dropdown
                    label="Type"
                    value={appointmentType}
                    options={["consultation", "follow_up", "emergency", "procedure"]}
                    onChange={(v) => setAppointmentType(v as AppointmentType)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Dropdown
                    label="Statut"
                    value={appointmentStatus}
                    options={["pending", "confirmed", "completed", "cancelled", "no_show"]}
                    onChange={(v) => setAppointmentStatus(v as AppointmentStatus)}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                value={appointmentNotes}
                onChangeText={setAppointmentNotes}
                multiline
                placeholder="Notes de rendez-vous"
                style={[styles.fieldInput, { minHeight: 100, textAlignVertical: "top" }]}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsFormOpen(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={submitForm} disabled={isSubmitting}>
                <Text style={styles.saveBtnText}>{isSubmitting ? "Sauvegarde..." : "Enregistrer"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isActionsMenuOpen} transparent animationType="fade" onRequestClose={() => setIsActionsMenuOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.actionsMenuCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Actions rendez-vous</Text>
              <TouchableOpacity onPress={() => setIsActionsMenuOpen(false)}>
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 14, gap: 10 }}>
              <Text style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>
                {`${actionsTarget?.patient?.first_name ?? ""} ${actionsTarget?.patient?.last_name ?? ""}`.trim() || "Patient"}
              </Text>

              <TouchableOpacity
                style={styles.actionsMenuBtn}
                onPress={() => {
                  if (!actionsTarget) return;
                  setIsActionsMenuOpen(false);
                  openEditForm(actionsTarget);
                }}
              >
                <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.actionsMenuText}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionsMenuBtn}
                onPress={() => {
                  if (!actionsTarget) return;
                  setIsActionsMenuOpen(false);
                  startConsultation(actionsTarget);
                }}
              >
                <Ionicons name="medkit-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.actionsMenuText}>Demarrer consultation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionsMenuBtn}
                onPress={() => {
                  if (!actionsTarget) return;
                  setIsActionsMenuOpen(false);
                  updateStatus(actionsTarget.id, "completed");
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success} />
                <Text style={styles.actionsMenuText}>Marquer termine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionsMenuBtn}
                onPress={() => {
                  if (!actionsTarget) return;
                  setIsActionsMenuOpen(false);
                  cancelAppointment(actionsTarget.id);
                }}
              >
                <Ionicons name="close-circle-outline" size={16} color={theme.colors.error} />
                <Text style={[styles.actionsMenuText, { color: theme.colors.error }]}>Annuler le RDV</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function statusColor(status: string): ViewStyle {
  switch (status) {
    case "completed":
      return { backgroundColor: "#22c55e" };
    case "pending":
      return { backgroundColor: "#60a5fa" };
    case "confirmed":
      return { backgroundColor: "#38bdf8" };
    case "cancelled":
      return { backgroundColor: "#9ca3af" };
    case "no_show":
      return { backgroundColor: "#f59e0b" };
    case "in_consultation":
      return { backgroundColor: "#38bdf8" };
    default:
      return {};
  }
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: {
      paddingHorizontal: PAGE_GUTTER,
      paddingTop: 18,
      paddingBottom: 30,
      ...getWebContainerFill(),
    },
    row: { flexDirection: "row", gap: 18 },
    left: { flex: 2.25, padding: 0 },
    right: { flex: 1, padding: 0 },

    filterSection: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 12,
      marginBottom: 16,
    },
    searchFieldWrap: {
      flex: 1.45,
      minWidth: 340,
    },
    fieldLabelSpacer: {
      height: 22,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 10,
      paddingHorizontal: 12,
      minHeight: 42,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14 },
    searchClearButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 42,
    },
    primaryButtonText: { color: "#fff", fontWeight: "700" },

    tabs: { flexDirection: "row", borderRadius: 12, padding: 6, marginBottom: 16 },
    tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
    tabText: { fontWeight: "600" },

    progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    progressTitle: { fontWeight: "600" },
    progressValue: { fontSize: 24, fontWeight: "700" },
    progressBg: { height: 10, borderRadius: 10 },
    progressFill: { height: 10, borderRadius: 10 },
    progressText: { marginTop: 12, fontSize: 13, color: "#6b7280" },

    tableContainer: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    cell: { fontSize: 13 },
    header: { backgroundColor: "#f3f4f6" },
    status: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginHorizontal: 10,
      alignItems: "center",
    },
    statusText: { color: "#fff", fontSize: 12, fontWeight: "500", textAlign: "center" },

    actionBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    primaryActionBtn: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },

    waitingTitle: { fontSize: 16, fontWeight: "700" },
    waitingSubtitle: { fontSize: 13, color: "#6b7280" },
    waitingProgressTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    waitingProgressValue: {
      fontSize: 24,
      fontWeight: "800",
    },
    waitingCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f0f8fd",
      padding: 12,
      borderRadius: 12,
      marginBottom: 10,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 780,
      backgroundColor: "#fff",
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalHeader: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalTitle: { fontWeight: "900", color: theme.colors.text },
    modalFooter: {
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    cancelBtnText: { fontWeight: "700", color: theme.colors.text },
    saveBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    saveBtnText: { color: "#fff", fontWeight: "700" },
    actionsMenuCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: "#fff",
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionsMenuBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.surface,
    },
    actionsMenuText: {
      color: theme.colors.text,
      fontWeight: "700",
    },

    formRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
    fieldLabel: { fontWeight: "700", color: theme.colors.text, marginBottom: 8 },
    fieldInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      marginBottom: 12,
    },
  });
