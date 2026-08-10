import DatePickerField from "@/components/datepicker";
import { Dropdown } from "@/components/input_fields";
import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { useAuth } from "@/contexts/auth_context";
import { db } from "@/database/database_conn";
import { callRpc } from "@/services/backend";
import { getPatients } from "@/services/patients.services";
import { PAGE_GUTTER, getWebContainerFill } from "@/theme/layout";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  const { open_new } = useLocalSearchParams<{ open_new?: string }>();
  const didOpenFromQueryRef = useRef(false);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
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
      if (!user?.id || !user.clinic_id) return;

      const data = await callRpc<RpcGetAppointmentsResponse, Record<string, unknown>>(
        "rpc_get_appointments",
        {
          p_requester_id: user.id,
          p_start_date: toDayStart(new Date()).toISOString(),
          p_end_date: toDayEnd(new Date()).toISOString(),
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
  }, [user?.clinic_id, user?.id]);

  const fetchFormOptions = useCallback(async () => {
    try {
      if (!user?.id || !user.clinic_id) return;

      const [patientsResult, staffResult] = await Promise.all([
        getPatients({
          requesterId: user.id,
          clinicId: user.clinic_id,
          page: 1,
          itemsPerPage: 300,
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
  }, [user?.clinic_id, user?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchFormOptions();
  }, [fetchFormOptions]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchesStatus = filter === "all" ||
        (filter === "waiting_room"
          ? a.status === "pending" || a.status === "confirmed" || a.status === "in_consultation"
          : a.status === filter);
      const fullName = `${a.patient?.first_name ?? ""} ${a.patient?.last_name ?? ""}`.toLowerCase();
      const doctorName = String(a.doctor_name ?? "").toLowerCase();
      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        doctorName.includes(search.toLowerCase()) ||
        String(a.type).toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [appointments, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleAppointments = useMemo(
    () => filteredAppointments.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredAppointments, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [filter, search, pageSize]);

  const waitingRoomAppointments = useMemo(
    () => appointments.filter((a) => a.status === "pending" || a.status === "confirmed" || a.status === "in_consultation"),
    [appointments],
  );

  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "completed").length,
    [appointments],
  );

  const progress = appointments.length > 0 ? Math.round((completedCount / appointments.length) * 100) : 0;

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

  useEffect(() => {
    const shouldOpen = open_new === "1" || open_new === "true";
    if (!shouldOpen || didOpenFromQueryRef.current) return;
    didOpenFromQueryRef.current = true;
    openCreateForm();
  }, [open_new]);

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
      return true;
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Impossible de mettre a jour le statut");
      return false;
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
    const updated = await updateStatus(a.id, "confirmed");
    if (!updated) return;
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
  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <View style={styles.container}>
        <View style={styles.mainGrid}>
          <View style={styles.leftPanel}>
            <View style={styles.filterSection}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={23} color={theme.colors.textSecondary} />
                <TextInput
                  placeholder="Rechercher patient, médecin, type..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                />
                {!!search && <TouchableOpacity onPress={() => setSearch("")} style={styles.searchClearButton}><Ionicons name="close-circle" size={18} color={theme.colors.muted} /></TouchableOpacity>}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={openCreateForm}>
                <Ionicons name="add" size={22} color="#fff" />
                <Text style={styles.primaryButtonText}>Nouveau RDV</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
              {[
                { key: "all", label: "Tous" },
                { key: "pending", label: "En attente" },
                { key: "confirmed", label: "Confirmés" },
                { key: "completed", label: "Terminés" },
                { key: "cancelled", label: "Annulés" },
                { key: "no_show", label: "Absents" },
              ].map((tab) => (
                <TouchableOpacity key={tab.key} onPress={() => setFilter(tab.key)} style={[styles.tab, filter === tab.key && styles.tabActive]}>
                  <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.tableContainer}>
              <View style={[styles.tableRow, styles.header]}>
                <Text style={[styles.headerCell, styles.timeCell]}>Heure  ↕</Text>
                <Text style={[styles.headerCell, styles.patientCell]}>Patient</Text>
                <Text style={[styles.headerCell, styles.doctorCell]}>Médecin</Text>
                <Text style={[styles.headerCell, styles.typeCell]}>Type</Text>
                <Text style={[styles.headerCell, styles.statusCell]}>Statut</Text>
                <Text style={[styles.headerCell, styles.actionsCell]}>Actions</Text>
              </View>

              <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
                {visibleAppointments.map((a) => {
                  const meta = appointmentStatusMeta(a.status);
                  return (
                    <View key={a.id} style={styles.tableRow}>
                      <View style={[styles.timeCell, styles.timeWrap]}>
                        <View style={[styles.timeDot, { backgroundColor: a.status === "pending" || a.status === "confirmed" ? theme.colors.success : theme.colors.border }]} />
                        <Text style={styles.timeText}>{new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                      </View>
                      <View style={[styles.patientCell, styles.patientWrap]}>
                        <Avatar firstName={a.patient?.first_name} lastName={a.patient?.last_name} size={38} />
                        <View style={styles.patientCopy}>
                          <Text numberOfLines={1} style={styles.patientName}>{a.patient?.first_name} {a.patient?.last_name}</Text>
                          <Text numberOfLines={1} style={styles.patientId}>ID: {String(a.patient_id || "—").slice(0, 13)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.cellText, styles.doctorCell]} numberOfLines={1}>{a.doctor_name || "-"}</Text>
                      <View style={[styles.typeCell, styles.typeWrap]}>
                        <Ionicons name={a.type === "follow_up" ? "pulse-outline" : "person-circle-outline"} size={17} color={theme.colors.textSecondary} />
                        <Text numberOfLines={1} style={styles.cellText}>{appointmentTypeLabel(a.type)}</Text>
                      </View>
                      <View style={styles.statusCell}><View style={[styles.status, { backgroundColor: meta.soft }]}><Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text></View></View>
                      <View style={[styles.actionsCell, styles.actionsWrap]}>
                        <TouchableOpacity accessibilityLabel="Démarrer la consultation" style={styles.actionBtn} onPress={() => startConsultation(a)}><CalendarPlusIcon color={theme.colors.primary} /></TouchableOpacity>
                        <TouchableOpacity accessibilityLabel="Plus d’actions" style={styles.moreBtn} onPress={() => openRowActions(a)}><Ionicons name="ellipsis-vertical" size={19} color={theme.colors.textSecondary} /></TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                {filteredAppointments.length === 0 && <View style={styles.emptyTable}><Ionicons name="calendar-clear-outline" size={28} color={theme.colors.muted} /><Text style={styles.emptyText}>Aucun rendez-vous pour ce filtre.</Text></View>}
              </ScrollView>

              <View style={styles.tableFooter}>
                <Text style={styles.footerSummary}>Affichage {filteredAppointments.length ? (currentPage - 1) * pageSize + 1 : 0} – {Math.min(currentPage * pageSize, filteredAppointments.length)} sur {filteredAppointments.length} rendez-vous</Text>
                <View style={styles.pagination}>
                  <TouchableOpacity disabled={currentPage === 1} onPress={() => setPage((value) => Math.max(1, value - 1))} style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}><Ionicons name="chevron-back" size={17} color={theme.colors.text} /></TouchableOpacity>
                  {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map((value) => <TouchableOpacity key={value} onPress={() => setPage(value)} style={[styles.pageButton, currentPage === value && styles.pageButtonActive]}><Text style={[styles.pageButtonText, currentPage === value && styles.pageButtonTextActive]}>{value}</Text></TouchableOpacity>)}
                  <TouchableOpacity disabled={currentPage === totalPages} onPress={() => setPage((value) => Math.min(totalPages, value + 1))} style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}><Ionicons name="chevron-forward" size={17} color={theme.colors.text} /></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setPageSize((value) => value === 8 ? 12 : value === 12 ? 24 : 8)} style={styles.pageSizeButton}><Text style={styles.pageSizeText}>{pageSize} par page</Text><Ionicons name="chevron-down" size={15} color={theme.colors.text} /></TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.rightPanel}>
            <View style={styles.overviewHeader}>
              <View><Text style={styles.progressTitle}>Vue d’ensemble</Text><Text style={styles.progressText}>{completedCount} sur {appointments.length} patients traités aujourd’hui</Text></View>
              <Text style={styles.waitingProgressValue}>{progress}%</Text>
            </View>
            <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            <View style={styles.sideDivider} />
            <Text style={styles.waitingTitle}>Salle d’attente</Text>
            <Text style={styles.waitingSubtitle}>Patients en attente ou en consultation</Text>
            <ScrollView style={styles.waitingList} contentContainerStyle={styles.waitingListContent} showsVerticalScrollIndicator={false}>
              {waitingRoomAppointments.map((a) => (
                <TouchableOpacity key={a.id} onPress={() => openRowActions(a)} style={styles.waitingCard}>
                  <Avatar firstName={a.patient?.first_name} lastName={a.patient?.last_name} size={50} />
                  <View style={styles.waitingCopy}>
                    <Text numberOfLines={1} style={styles.waitingPatientName}>{a.patient?.first_name} {a.patient?.last_name}</Text>
                    <Text style={styles.waitingMeta}>{new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                    <Text numberOfLines={1} style={styles.waitingMeta}>{a.doctor_name || "-"}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {waitingRoomAppointments.length === 0 && <Text style={styles.emptyText}>Aucun patient en attente.</Text>}
            </ScrollView>
            <TouchableOpacity onPress={() => setFilter("waiting_room")} style={styles.waitingRoomButton}><Ionicons name="people-outline" size={18} color={theme.colors.primary} /><Text style={styles.waitingRoomButtonText}>Voir toute la salle d’attente</Text></TouchableOpacity>
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
                    options={["pending", "confirmed", "completed", "cancelled", "no_show", "in_consultation"]}
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

function appointmentStatusMeta(status: AppointmentStatus) {
  switch (status) {
    case "completed": return { label: "Terminé", color: "#15803D", soft: "#DCFCE7" };
    case "pending": return { label: "En attente", color: "#2563EB", soft: "#E6EFFF" };
    case "confirmed": return { label: "Confirmé", color: "#15803D", soft: "#DCFCE7" };
    case "cancelled": return { label: "Annulé", color: "#64748B", soft: "#EEF2F7" };
    case "no_show": return { label: "Absent", color: "#B45309", soft: "#FFF3DA" };
    case "in_consultation": return { label: "En consultation", color: "#6D28D9", soft: "#F0E9FF" };
    default: return { label: STATUS_LABELS[status] || status, color: "#64748B", soft: "#EEF2F7" };
  }
}

function CalendarPlusIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 23, height: 23, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="calendar-outline" size={23} color={color} />
      <View style={{ position: "absolute", top: 8, left: 7, width: 9, height: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <Ionicons name="add" size={11} color={color} />
      </View>
    </View>
  );
}

function appointmentTypeLabel(type: AppointmentType) {
  if (type === "follow_up") return "Suivi";
  if (type === "emergency") return "Urgence";
  if (type === "procedure") return "Procédure";
  return "Consultation";
}

const webShadow = Platform.OS === "web" ? ({ boxShadow: "0 5px 18px rgba(15,23,42,0.055)" } as any) : null;

const createStyles = (theme: any) => StyleSheet.create({
    page: { flex: 1 },
    container: { flex: 1, minHeight: 0, paddingHorizontal: PAGE_GUTTER, paddingTop: 24, paddingBottom: 24, ...getWebContainerFill() },
    mainGrid: { flex: 1, minHeight: 0, flexDirection: "row", gap: 22, flexWrap: "wrap" },
    leftPanel: { flex: 3, minWidth: 680, minHeight: 0 },
    rightPanel: { flex: 1, minWidth: 280, minHeight: 560, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.surface, padding: 20, ...webShadow },
    filterSection: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
    searchBox: { flex: 1, height: 50, flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surface, borderRadius: 9, paddingHorizontal: 18, borderWidth: 1, borderColor: theme.colors.border, gap: 10, ...webShadow },
    searchInput: { flex: 1, color: theme.colors.text, fontSize: 14, outlineStyle: "none" } as any,
    searchClearButton: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    primaryButton: { height: 50, minWidth: 170, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: theme.colors.primary, borderRadius: 9, paddingHorizontal: 20, ...webShadow },
    primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    tabs: { height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, marginBottom: 16, borderRadius: 8, backgroundColor: theme.colors.surface },
    tab: { flex: 1, height: 36, borderRadius: 7, alignItems: "center", justifyContent: "center" },
    tabActive: { backgroundColor: theme.colors.primary },
    tabText: { color: theme.colors.text, fontWeight: "600", fontSize: 12 },
    tabTextActive: { color: "#fff" },
    tableContainer: { flex: 1, minHeight: 510, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, overflow: "hidden", ...webShadow },
    tableScroll: { flex: 1, minHeight: 0 },
    tableRow: { minHeight: 72, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    header: { minHeight: 52, backgroundColor: theme.colors.backgroundAlt || theme.colors.background },
    headerCell: { color: theme.colors.text, fontSize: 11, fontWeight: "700" },
    cellText: { color: theme.colors.text, fontSize: 11 },
    timeCell: { width: 105 },
    patientCell: { flex: 1.55, minWidth: 190 },
    doctorCell: { flex: 1.2, minWidth: 135 },
    typeCell: { flex: 0.9, minWidth: 105 },
    statusCell: { flex: 0.85, minWidth: 90 },
    actionsCell: { width: 82 },
    timeWrap: { flexDirection: "row", alignItems: "center", gap: 9 },
    timeDot: { width: 8, height: 8, borderRadius: 4 },
    timeText: { color: theme.colors.text, fontSize: 11, fontWeight: "700" },
    patientWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
    patientCopy: { flex: 1, minWidth: 0 },
    patientName: { color: theme.colors.text, fontSize: 11, fontWeight: "700" },
    patientId: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 },
    typeWrap: { flexDirection: "row", alignItems: "center", gap: 7 },
    status: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: "center" },
    statusText: { fontSize: 10, fontWeight: "600", textAlign: "center" },
    actionsWrap: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
    moreBtn: { width: 24, height: 34, alignItems: "center", justifyContent: "center" },
    emptyTable: { minHeight: 260, alignItems: "center", justifyContent: "center", gap: 8 },
    emptyText: { color: theme.colors.textSecondary, fontSize: 12 },
    tableFooter: { minHeight: 70, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" },
    footerSummary: { flex: 1, minWidth: 220, color: theme.colors.text, fontSize: 11 },
    pagination: { flexDirection: "row", gap: 7 },
    pageButton: { width: 36, height: 36, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface },
    pageButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    pageButtonDisabled: { opacity: 0.4 },
    pageButtonText: { color: theme.colors.text, fontSize: 12, fontWeight: "600" },
    pageButtonTextActive: { color: "#fff" },
    pageSizeButton: { height: 40, paddingHorizontal: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 10 },
    pageSizeText: { color: theme.colors.text, fontSize: 11 },
    overviewHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
    progressTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
    progressText: { marginTop: 12, fontSize: 12, color: theme.colors.textSecondary },
    waitingProgressValue: { color: theme.colors.primary, fontSize: 25, fontWeight: "700" },
    progressBg: { height: 10, borderRadius: 5, backgroundColor: theme.colors.border, marginTop: 16, overflow: "hidden" },
    progressFill: { height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
    sideDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 30 },
    waitingTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
    waitingSubtitle: { marginTop: 10, fontSize: 12, color: theme.colors.textSecondary },
    waitingList: { flex: 1, minHeight: 0, marginTop: 18 },
    waitingListContent: { gap: 10, paddingBottom: 12 },
    waitingCard: { minHeight: 88, flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.primarySoft, padding: 11, borderRadius: 10 },
    waitingCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
    waitingPatientName: { color: theme.colors.text, fontSize: 12, fontWeight: "700" },
    waitingMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 11 },
    waitingRoomButton: { height: 48, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    waitingRoomButtonText: { color: theme.colors.primary, fontSize: 12, fontWeight: "700" },
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
    modalTitle: { fontWeight: "700", color: theme.colors.text },
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
