import { TopBar } from "@/components/top_bar";
import { Avatar } from "@/components/patient_avatar";
import { useAuth } from "@/contexts/auth_context";
import { createLabOrder, getLabOrders, saveLabResults } from "@/services/lab.services";
import { getPatients } from "@/services/patients.services";
import type { LabOrderRow, LabPriority, LabResultItemRow, LabSourceType } from "@/services/backend.types";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

type BadgeType = "gray" | "green" | "blue" | "orange" | "red" | "purple";
type UiStatus = "En attente" | "Prelevement fait" | "Resultat pret";
type UiPriority = "Urgent" | "Normal";
type UiSourceType = "Interne" | "Externe";
type ModalType = "request" | "manual" | "details" | "history" | "report" | null;
type RequestFilter = "all" | UiStatus;

type PatientOption = {
  id: string;
  label: string;
  age: number;
};

type LabRequest = {
  id: string;
  patientId: string;
  patient: string;
  age: number;
  doctor: string;
  tests: string;
  status: UiStatus;
  priority: UiPriority;
  date: string;
  type: UiSourceType;
  paymentStatus: string;
  clinicalContext: string;
  labComments: string;
  estimatedTotal: number;
  resultSummary: string;
  doctorNote: string;
  rows: ResultRow[];
  raw: LabOrderRow;
};

type ResultRow = {
  name: string;
  value: string;
  unit: string;
  normal: string;
  note: "Eleve" | "Normal" | "";
};

type RequestFormState = {
  patientId: string;
  patientQuery: string;
  priority: LabPriority;
  sourceType: LabSourceType;
  paymentStatus: "pending" | "paid";
  clinicalContext: string;
  labComments: string;
  selectedTests: string[];
};

type ResultDraftState = {
  rows: ResultRow[];
  conclusion: string;
  doctorNote: string;
};

const commonTests = [
  "FNS",
  "Glycemie",
  "CRP",
  "HbA1c",
  "Cholesterol",
  "Creatinine",
  "Uree",
  "Analyse urinaire",
  "TSH",
  "Vitamine D",
];

const TEST_META: Record<string, { unit: string; normal: string }> = {
  FNS: { unit: "g/dL", normal: "12 - 16" },
  Glycemie: { unit: "g/L", normal: "0.70 - 1.10" },
  CRP: { unit: "mg/L", normal: "< 5" },
  HbA1c: { unit: "%", normal: "4.0 - 5.6" },
  Cholesterol: { unit: "g/L", normal: "1.4 - 2.0" },
  Creatinine: { unit: "mg/L", normal: "6 - 12" },
  Uree: { unit: "g/L", normal: "0.15 - 0.45" },
  "Analyse urinaire": { unit: "", normal: "Selon lecture" },
  TSH: { unit: "mIU/L", normal: "0.4 - 4.0" },
  "Vitamine D": { unit: "ng/mL", normal: "30 - 100" },
};

const emptyRequestForm = (): RequestFormState => ({
  patientId: "",
  patientQuery: "",
  priority: "routine",
  sourceType: "internal",
  paymentStatus: "pending",
  clinicalContext: "",
  labComments: "",
  selectedTests: ["FNS", "Glycemie", "CRP"],
});

function normalizeTests(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((item) => String(item)).filter(Boolean);
  return [];
}

function normalizeResultRows(raw: unknown, tests: string[]): ResultRow[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item: any) => ({
      name: String(item?.name ?? ""),
      value: String(item?.value ?? ""),
      unit: String(item?.unit ?? ""),
      normal: String(item?.normal ?? ""),
      note: normalizeNote(item?.note, item?.value, item?.normal),
    }));
  }
  return tests.map((test) => ({
    name: test,
    value: "",
    unit: TEST_META[test]?.unit ?? "",
    normal: TEST_META[test]?.normal ?? "",
    note: "",
  }));
}

function normalizeNote(rawNote: unknown, value: unknown, normal: unknown): "Eleve" | "Normal" | "" {
  const normalized = String(rawNote ?? "").trim().toLowerCase();
  if (normalized.includes("elev")) return "Eleve";
  if (normalized === "normal") return "Normal";
  return deriveNote(String(value ?? ""), String(normal ?? ""));
}

function deriveNote(value: string, normal: string): "Eleve" | "Normal" | "" {
  const numericValue = Number(String(value).replace(",", "."));
  if (!Number.isFinite(numericValue)) return "";

  const rangeMatch = normal.match(/(-?\d+(?:[.,]\d+)?)\s*-\s*(-?\d+(?:[.,]\d+)?)/);
  if (rangeMatch) {
    const low = Number(rangeMatch[1].replace(",", "."));
    const high = Number(rangeMatch[2].replace(",", "."));
    if (Number.isFinite(low) && Number.isFinite(high)) {
      return numericValue >= low && numericValue <= high ? "Normal" : "Eleve";
    }
  }

  const ltMatch = normal.match(/<\s*(-?\d+(?:[.,]\d+)?)/);
  if (ltMatch) {
    const limit = Number(ltMatch[1].replace(",", "."));
    if (Number.isFinite(limit)) return numericValue < limit ? "Normal" : "Eleve";
  }

  return "";
}

function formatRequestDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusType(status: UiStatus): BadgeType {
  if (status === "Resultat pret") return "green";
  if (status === "Prelevement fait") return "blue";
  return "orange";
}

function toUiStatus(status: string): UiStatus {
  if (status === "completed") return "Resultat pret";
  if (status === "collected" || status === "partial") return "Prelevement fait";
  return "En attente";
}

function toUiPriority(priority: string): UiPriority {
  return priority === "urgent" || priority === "stat" ? "Urgent" : "Normal";
}

function toUiSourceType(sourceType: string): UiSourceType {
  return sourceType === "external" ? "Externe" : "Interne";
}

function mapOrder(row: LabOrderRow): LabRequest {
  const tests = normalizeTests((row as any).requested_tests);
  const patientFirstName = String((row as any).patient_first_name ?? "").trim();
  const patientLastName = String((row as any).patient_last_name ?? "").trim();
  const doctorName = String((row as any).doctor_name ?? "").trim() || "Medecin";
  const patientName = `${patientFirstName} ${patientLastName}`.trim() || "Patient";
  const rows = normalizeResultRows((row as any).result_items, tests);

  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    patient: patientName,
    age: Number((row as any).patient_age ?? 0),
    doctor: doctorName,
    tests: tests.join(", "),
    status: toUiStatus(String(row.status ?? "")),
    priority: toUiPriority(String(row.priority ?? "")),
    date: formatRequestDate((row as any).requested_at ?? row.created_at),
    type: toUiSourceType(String((row as any).source_type ?? "")),
    paymentStatus: String((row as any).payment_status ?? "pending"),
    clinicalContext: String((row as any).clinical_context ?? ""),
    labComments: String((row as any).lab_comments ?? ""),
    estimatedTotal: Number((row as any).estimated_total ?? 0),
    resultSummary: String((row as any).result_summary ?? ""),
    doctorNote: String((row as any).doctor_note ?? ""),
    rows,
    raw: row,
  };
}

function paymentLabel(status: string) {
  if (status === "paid") return "Paye";
  if (status === "partial") return "Partiel";
  if (status === "cancelled") return "Annule";
  return "En attente";
}

function paymentSuccess(status: string) {
  return status === "paid";
}

function buildTimeline(request: LabRequest) {
  const steps: Array<{ label: string; time: string; done: boolean }> = [
    {
      label: "Demande creee",
      time: formatRequestDate(request.raw.requested_at),
      done: true,
    },
    {
      label: `Paiement ${paymentLabel(request.paymentStatus).toLowerCase()}`,
      time: formatRequestDate(request.raw.created_at),
      done: request.paymentStatus === "paid" || request.paymentStatus === "partial",
    },
    {
      label: "Prelevement sanguin fait",
      time: formatRequestDate(request.raw.sampled_at),
      done: !!request.raw.sampled_at,
    },
    {
      label: "Resultat rempli",
      time: formatRequestDate(request.raw.resulted_at),
      done: !!request.raw.resulted_at,
    },
    {
      label: "Validation medecin",
      time: formatRequestDate(request.raw.validated_at),
      done: !!request.raw.validated_at || request.raw.status === "completed",
    },
  ];
  return steps;
}

function Badge({ children, type = "gray" }: { children: ReactNode; type?: BadgeType }) {
  return <Text style={[styles.badge, badgeStyles[type]]}>{children}</Text>;
}

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function ActionButton({
  title,
  icon,
  variant = "primary",
  onPress,
  containerStyle,
  disabled,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "dark" | "light" | "blueLight";
  onPress?: () => void;
  containerStyle?: object;
  disabled?: boolean;
}) {
  const buttonStyle =
    variant === "primary"
      ? styles.buttonPrimary
      : variant === "dark"
      ? styles.buttonDark
      : variant === "blueLight"
      ? styles.buttonBlueLight
      : styles.buttonLight;

  const textStyle =
    variant === "primary" || variant === "dark"
      ? styles.buttonTextWhite
      : variant === "blueLight"
      ? styles.buttonTextBlue
      : styles.buttonTextDark;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        buttonStyle,
        containerStyle,
        pressed && !disabled && styles.pressed,
        disabled && { opacity: 0.6 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={textStyle.color as string} /> : null}
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}

function IconBox({
  icon,
  color,
  backgroundColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.iconBox, { backgroundColor }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  editable = true,
}: {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.textArea, !editable && styles.inputDisabled]}
      />
    </View>
  );
}

function SelectBox({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.selectBox} onPress={onPress}>
        <Text style={styles.selectText}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748B" />
      </Pressable>
    </View>
  );
}

function LabModal({
  visible,
  title,
  subtitle,
  icon,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <IconBox icon={icon} color="#1D4ED8" backgroundColor="#EFF6FF" />
              <View style={styles.modalTitleTextWrap}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>{subtitle}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function LabWorkspaceScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const isWideDesktop = width >= 1280;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestFilter>("all");
  const [modal, setModal] = useState<ModalType>(null);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState<RequestFormState>(emptyRequestForm);
  const [resultDraft, setResultDraft] = useState<ResultDraftState>({ rows: [], conclusion: "", doctorNote: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const doctorName = String((user as any)?.fullname || "Medecin");

  const loadData = async () => {
    if (!user?.id || !user.clinic_id) return;
    setLoading(true);
    setError("");
    try {
      const [labOrders, patientRes] = await Promise.all([
        getLabOrders({ requesterId: user.id, limit: 100 }),
        getPatients({
          requesterId: user.id,
          clinicId: user.clinic_id,
          page: 1,
          itemsPerPage: 100,
        }).catch(() => ({ patients: [], total: 0 })),
      ]);

      const mappedRequests = (labOrders ?? []).map(mapOrder);
      const patientOptions = (patientRes?.patients ?? []).map((patient) => ({
        id: String(patient.id),
        label: `${patient.first_name} ${patient.last_name}`.trim(),
        age: Number(patient.age ?? 0),
      }));

      setRequests(mappedRequests);
      setPatients(patientOptions);
      setSelectedOrderId((current) => current ?? mappedRequests[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les analyses.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((item) => {
      const matchesFilter = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesQuery = !normalizedQuery
        ? true
        : `${item.patient} ${item.doctor} ${item.tests} ${item.status} ${item.type}`
            .toLowerCase()
            .includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [query, requests, statusFilter]);

  const selectedRequest =
    filteredRequests.find((item) => item.id === selectedOrderId) ||
    requests.find((item) => item.id === selectedOrderId) ||
    filteredRequests[0] ||
    requests[0] ||
    null;

  useEffect(() => {
    if (!selectedRequest) {
      setResultDraft({ rows: [], conclusion: "", doctorNote: "" });
      return;
    }
    setResultDraft({
      rows: selectedRequest.rows.map((row) => ({ ...row })),
      conclusion: selectedRequest.resultSummary,
      doctorNote: selectedRequest.doctorNote,
    });
  }, [selectedRequest?.id]);

  const pendingCount = useMemo(
    () => requests.filter((item) => statusType(item.status) === "orange").length,
    [requests],
  );
  const sampledCount = useMemo(
    () => requests.filter((item) => statusType(item.status) === "blue").length,
    [requests],
  );
  const readyCount = useMemo(
    () => requests.filter((item) => statusType(item.status) === "green").length,
    [requests],
  );

  const toggleTest = (test: string) => {
    setRequestForm((current) => ({
      ...current,
      selectedTests: current.selectedTests.includes(test)
        ? current.selectedTests.filter((item) => item !== test)
        : [...current.selectedTests, test],
    }));
  };

  const patientSuggestions = useMemo(() => {
    const normalized = requestForm.patientQuery.trim().toLowerCase();
    if (!normalized) return patients.slice(0, 6);
    return patients
      .filter((patient) => patient.label.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [patients, requestForm.patientQuery]);

  const selectedPatient = patients.find((patient) => patient.id === requestForm.patientId) || null;

  const openRequestModal = () => {
    setRequestForm(emptyRequestForm());
    setModal("request");
  };

  const openDetails = (requestId: string) => {
    setSelectedOrderId(requestId);
    setModal("details");
  };

  const estimatedTotal = requestForm.selectedTests.length * 800;

  const cyclePriority = () => {
    setRequestForm((current) => ({
      ...current,
      priority:
        current.priority === "routine"
          ? "urgent"
          : current.priority === "urgent"
          ? "stat"
          : "routine",
    }));
  };

  const cyclePaymentStatus = () => {
    setRequestForm((current) => ({
      ...current,
      paymentStatus: current.paymentStatus === "pending" ? "paid" : "pending",
    }));
  };

  const cycleSourceType = () => {
    setRequestForm((current) => ({
      ...current,
      sourceType: current.sourceType === "internal" ? "external" : "internal",
    }));
  };

  const handleCreateOrder = async () => {
    if (!user?.id) return;
    if (!requestForm.patientId) {
      Alert.alert("Analyses", "Choisissez un patient.");
      return;
    }
    if (!requestForm.selectedTests.length) {
      Alert.alert("Analyses", "Choisissez au moins une analyse.");
      return;
    }

    setSaving(true);
    try {
      const createdId = await createLabOrder({
        requesterId: user.id,
        patientId: requestForm.patientId,
        sourceType: requestForm.sourceType,
        priority: requestForm.priority,
        requestedTests: requestForm.selectedTests,
        clinicalContext: requestForm.clinicalContext,
        labComments: requestForm.labComments,
        paymentStatus: requestForm.paymentStatus,
        paymentNote: requestForm.paymentStatus === "paid" ? "Paye" : "A payer a la reception",
        estimatedTotal,
      });
      await loadData();
      setSelectedOrderId(createdId);
      setModal(null);
      Alert.alert("Succes", "Demande d'analyse creee.");
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible de creer la demande.");
    } finally {
      setSaving(false);
    }
  };

  const updateDraftRow = (index: number, patch: Partial<ResultRow>) => {
    setResultDraft((current) => {
      const nextRows = current.rows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const updated = { ...row, ...patch };
        return {
          ...updated,
          note: normalizeNote(updated.note, updated.value, updated.normal),
        };
      });
      return { ...current, rows: nextRows };
    });
  };

  const persistResults = async (status: "collected" | "completed") => {
    if (!user?.id || !selectedRequest) return;
    setSaving(true);
    try {
      const rows: LabResultItemRow[] = resultDraft.rows.map((row) => ({
        name: row.name,
        value: row.value || null,
        unit: row.unit || null,
        normal: row.normal || null,
        note: row.note || null,
      }));
      await saveLabResults({
        requesterId: user.id,
        labOrderId: selectedRequest.id,
        status,
        resultItems: rows,
        resultSummary: resultDraft.conclusion,
        doctorNote: resultDraft.doctorNote,
      });
      await loadData();
      setModal(null);
      Alert.alert("Succes", status === "completed" ? "Resultat valide." : "Brouillon sauvegarde.");
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible de sauvegarder le resultat.");
    } finally {
      setSaving(false);
    }
  };

  const historyItems = useMemo(() => {
    if (!selectedRequest) return [];
    return requests.filter((item) => item.patientId === selectedRequest.patientId);
  }, [requests, selectedRequest]);

  return (
    <View style={styles.screenRoot}>
      <TopBar theme={theme} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.page, isDesktop && styles.pageDesktop]} showsVerticalScrollIndicator={false}>
          <Card style={[styles.heroCard, isWideDesktop && styles.heroCardDesktop]}>
            <View style={{ flex: 1 }}>
              <View style={styles.brandPill}>
                <MaterialCommunityIcons name="flask-outline" size={16} color="#1D4ED8" />
                <Text style={styles.brandText}>MedSync</Text>
              </View>

              <Text style={styles.title}>Analyses medicales</Text>
              <Text style={styles.description}>
                Two simple workflows: request tests inside the clinic, or import external lab results for doctor review.
              </Text>
            </View>

            <View style={[styles.heroButtons, isDesktop && styles.heroButtonsDesktop, isWideDesktop && styles.heroButtonsWideDesktop]}>
              <ActionButton
                title="Demander analyse"
                icon="add"
                variant="primary"
                onPress={openRequestModal}
                containerStyle={isWideDesktop ? styles.heroActionButtonInline : styles.heroActionButton}
              />
              <ActionButton
                title="Remplir les resultats"
                icon="flask-outline"
                variant="dark"
                onPress={() => setModal("manual")}
                disabled={!selectedRequest}
                containerStyle={isWideDesktop ? styles.heroActionButtonInline : styles.heroActionButton}
              />
            </View>
          </Card>

          {!!error ? (
            <Card>
              <Text style={styles.alertTitle}>Erreur backend</Text>
              <Text style={styles.alertText}>{error}</Text>
            </Card>
          ) : null}

          <View style={[styles.statsGrid, isWideDesktop && styles.statsGridDesktop]}>
            <Pressable onPress={openRequestModal} style={({ pressed }) => [styles.statCard, isWideDesktop && styles.statCardDesktop, pressed && styles.pressed]}>
              <View style={styles.statHeader}>
                <IconBox icon="time-outline" color="#C2410C" backgroundColor="#FFF7ED" />
                <Badge type="orange">A faire</Badge>
              </View>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Demandes en attente</Text>
            </Pressable>

            <Pressable onPress={() => setModal("manual")} style={({ pressed }) => [styles.statCard, isWideDesktop && styles.statCardDesktop, pressed && styles.pressed]}>
              <View style={styles.statHeader}>
                <IconBox icon="flask-outline" color="#1D4ED8" backgroundColor="#EFF6FF" />
                <Badge type="blue">Saisie</Badge>
              </View>
              <Text style={styles.statNumber}>{sampledCount}</Text>
              <Text style={styles.statLabel}>Resultats a remplir</Text>
            </Pressable>

            <Pressable onPress={() => setModal("report")} style={({ pressed }) => [styles.statCard, isWideDesktop && styles.statCardDesktop, pressed && styles.pressed]}>
              <View style={styles.statHeader}>
                <IconBox icon="checkmark-circle-outline" color="#047857" backgroundColor="#ECFDF5" />
                <Badge type="green">Pret</Badge>
              </View>
              <Text style={styles.statNumber}>{readyCount}</Text>
              <Text style={styles.statLabel}>Resultats prets</Text>
            </Pressable>
          </View>

          <View style={[styles.mainGrid, isWideDesktop && styles.mainGridDesktop]}>
            <Card style={[styles.requestsCard, isWideDesktop && styles.requestsCardDesktop]}>
              <View style={[styles.cardHeader, isWideDesktop && styles.cardHeaderDesktop]}>
                <SectionTitle title="Demandes et resultats" subtitle="Internal requests and external imported results in one list." />
                <View style={styles.searchWrap}>
                  <Ionicons name="search" size={18} color="#94A3B8" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Rechercher patient ou analyse..."
                    placeholderTextColor="#94A3B8"
                    style={[styles.searchInput, isWideDesktop && styles.searchInputDesktop]}
                  />
                </View>
              </View>
              <View style={styles.filtersRow}>
                {(["all", "En attente", "Prelevement fait", "Resultat pret"] as const).map((item) => (
                  <Pressable key={item} onPress={() => setStatusFilter(item)} style={[styles.filterChip, statusFilter === item && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, statusFilter === item && styles.filterChipTextActive]}>{item === "all" ? "Tous" : item}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={loadData} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{loading ? "Chargement..." : "Actualiser"}</Text>
                </Pressable>
              </View>

              <View style={styles.requestList}>
                {!loading && filteredRequests.length === 0 ? (
                  <View style={styles.emptyStateWrap}>
                    <Ionicons name="search-outline" size={20} color="#94A3B8" />
                    <Text style={styles.emptyStateTitle}>Aucun resultat</Text>
                    <Text style={styles.emptyStateText}>Ajustez la recherche ou creez une nouvelle demande.</Text>
                  </View>
                ) : null}
                {filteredRequests.map((request) => (
                  <View key={request.id} style={[styles.requestItem, isWideDesktop && styles.requestItemDesktop]}>
                    <View style={styles.requestLeft}>
                      <Avatar name={request.patient} size={46} />
                      <View style={styles.requestInfo}>
                        <View style={styles.requestTitleRow}>
                          <Text style={styles.requestName}>{request.patient}</Text>
                          <Text style={styles.requestAge}>{request.age} ans</Text>
                        </View>

                        <View style={styles.badgeRow}>
                          <Badge type={request.type === "Externe" ? "purple" : "blue"}>{request.type}</Badge>
                          {request.priority === "Urgent" ? <Badge type="red">Urgent</Badge> : null}
                        </View>

                        <Text style={styles.requestTests}>{request.tests || "Aucune analyse"}</Text>
                        <Text style={styles.requestMeta}>{request.doctor} • {request.date}</Text>
                      </View>
                    </View>

                    <View style={[styles.requestActions, isWideDesktop && styles.requestActionsDesktop]}>
                      <Badge type={statusType(request.status)}>{request.status}</Badge>
                      <Pressable onPress={() => openDetails(request.id)} style={styles.openButton}>
                        <Text style={styles.openButtonText}>Ouvrir</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <View style={[styles.sideColumn, isWideDesktop && styles.sideColumnDesktop]}>
              <Card>
                <View style={styles.summaryHeader}>
                  <SectionTitle
                    title="Resume medecin"
                    subtitle={
                      selectedRequest
                        ? `${selectedRequest.patient} • ${selectedRequest.id.slice(0, 8).toUpperCase()}`
                        : "Aucune demande selectionnee"
                    }
                  />
                  <Badge type={selectedRequest ? statusType(selectedRequest.status) : "gray"}>
                    {selectedRequest ? selectedRequest.status : "Vide"}
                  </Badge>
                </View>

                <View style={styles.alertBox}>
                  <View style={styles.alertTitleRow}>
                    <Ionicons name="warning-outline" size={17} color="#92400E" />
                    <Text style={styles.alertTitle}>Points importants</Text>
                  </View>
                  <Text style={styles.alertText}>
                    {selectedRequest?.resultSummary || selectedRequest?.clinicalContext || "Selectionnez une demande pour voir le resume clinique et les resultats."}
                  </Text>
                </View>

                <View style={styles.resultList}>
                  {(selectedRequest?.rows ?? []).slice(0, 4).map((item) => (
                    <View key={item.name} style={styles.resultItem}>
                      <View>
                        <Text style={styles.resultName}>{item.name}</Text>
                        <Text style={styles.resultNormal}>Normal: {item.normal || "-"}</Text>
                      </View>
                      <View style={styles.resultRight}>
                        <Text style={styles.resultValue}>{item.value || "-"} {item.unit}</Text>
                        <Text style={item.note === "Normal" ? styles.resultNoteNormal : styles.resultNoteHigh}>
                          {item.note || " "}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.twoButtons}>
                  <ActionButton title="Rapport" icon="print-outline" variant="dark" onPress={() => setModal("report")} disabled={!selectedRequest} />
                  <ActionButton title="Historique" icon="time-outline" variant="blueLight" onPress={() => setModal("history")} disabled={!selectedRequest} />
                </View>
              </Card>
            </View>
          </View>
        </ScrollView>

        <RequestModal
          visible={modal === "request"}
          form={requestForm}
          setForm={setRequestForm}
          selectedPatient={selectedPatient}
          patientSuggestions={patientSuggestions}
          doctorName={doctorName}
          estimatedTotal={estimatedTotal}
          saving={saving}
          onToggleTest={toggleTest}
          onCyclePriority={cyclePriority}
          onCyclePaymentStatus={cyclePaymentStatus}
          onCycleSourceType={cycleSourceType}
          onCreate={handleCreateOrder}
          onClose={() => setModal(null)}
        />
        <ManualModal
          visible={modal === "manual"}
          request={selectedRequest}
          draft={resultDraft}
          setDraft={setResultDraft}
          saving={saving}
          onSaveDraft={() => persistResults("collected")}
          onValidate={() => persistResults("completed")}
          onClose={() => setModal(null)}
        />
        <DetailsModal visible={modal === "details"} request={selectedRequest} onClose={() => setModal(null)} setModal={setModal} />
        <HistoryModal visible={modal === "history"} request={selectedRequest} historyItems={historyItems} onOpen={openDetails} onClose={() => setModal(null)} />
        <ReportModal visible={modal === "report"} request={selectedRequest} onClose={() => setModal(null)} />
      </SafeAreaView>
    </View>
  );
}

function RequestModal({
  visible,
  form,
  setForm,
  selectedPatient,
  patientSuggestions,
  doctorName,
  estimatedTotal,
  saving,
  onToggleTest,
  onCyclePriority,
  onCyclePaymentStatus,
  onCycleSourceType,
  onCreate,
  onClose,
}: {
  visible: boolean;
  form: RequestFormState;
  setForm: React.Dispatch<React.SetStateAction<RequestFormState>>;
  selectedPatient: PatientOption | null;
  patientSuggestions: PatientOption[];
  doctorName: string;
  estimatedTotal: number;
  saving: boolean;
  onToggleTest: (test: string) => void;
  onCyclePriority: () => void;
  onCyclePaymentStatus: () => void;
  onCycleSourceType: () => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  return (
    <LabModal
      visible={visible}
      title="Nouvelle demande d'analyse"
      subtitle="For tests done inside the clinic: doctor request → payment → sample → result."
      icon="add"
      onClose={onClose}
    >
      <View style={styles.formGrid}>
        <InputField
          label="Patient"
          value={form.patientQuery}
          onChangeText={(value) => setForm((current) => ({ ...current, patientQuery: value, patientId: "" }))}
          placeholder="Rechercher un patient..."
        />
        {patientSuggestions.length ? (
          <View style={styles.suggestionsBox}>
            {patientSuggestions.map((patient) => (
              <Pressable
                key={patient.id}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    patientId: patient.id,
                    patientQuery: patient.label,
                  }))
                }
                style={styles.suggestionRow}
              >
                <Text style={styles.suggestionText}>{patient.label}</Text>
                <Text style={styles.suggestionMeta}>{patient.age} ans</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <InputField label="Medecin" value={doctorName} editable={false} />
        <View style={styles.formGridRow}>
          <SelectBox
            label="Priorite"
            value={form.priority === "urgent" ? "Urgent" : form.priority === "stat" ? "Stat" : "Normal"}
            onPress={onCyclePriority}
          />
          <SelectBox
            label="Paiement"
            value={form.paymentStatus === "paid" ? "Paye" : "A payer a la reception"}
            onPress={onCyclePaymentStatus}
          />
        </View>
        <SelectBox
          label="Type"
          value={form.sourceType === "external" ? "Externe" : "Interne"}
          onPress={onCycleSourceType}
        />
      </View>

      {selectedPatient ? (
        <Text style={styles.helperText}>Patient choisi: {selectedPatient.label}</Text>
      ) : null}

      <View style={styles.modalSection}>
        <Text style={styles.fieldLabel}>Choisir les analyses</Text>
        <View style={styles.chipsWrap}>
          {commonTests.map((test) => {
            const selected = form.selectedTests.includes(test);
            return (
              <Pressable
                key={test}
                onPress={() => onToggleTest(test)}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
              >
                <Text style={selected ? styles.chipTextSelected : styles.chipText}>{test}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <InputField
        label="Contexte clinique"
        value={form.clinicalContext}
        onChangeText={(value) => setForm((current) => ({ ...current, clinicalContext: value }))}
        multiline
      />
      <InputField
        label="Note pour laboratoire"
        value={form.labComments}
        onChangeText={(value) => setForm((current) => ({ ...current, labComments: value }))}
        multiline
      />

      <View style={styles.paymentSummary}>
        <Text style={styles.paymentTitle}>Resume paiement</Text>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Analyses selectionnees</Text>
          <Text style={styles.paymentValue}>{form.selectedTests.length}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Total estime</Text>
          <Text style={styles.paymentValue}>{estimatedTotal.toLocaleString("fr-FR")} DZD</Text>
        </View>
      </View>
      <View style={styles.modalFooter}>
        <ActionButton title={saving ? "Creation..." : "Creer la demande"} variant="primary" onPress={onCreate} containerStyle={styles.modalFooterButton} disabled={saving} />
        <ActionButton title="Annuler" variant="light" onPress={onClose} containerStyle={styles.modalFooterButton} />
      </View>
    </LabModal>
  );
}

function ManualModal({
  visible,
  request,
  draft,
  setDraft,
  saving,
  onSaveDraft,
  onValidate,
  onClose,
}: {
  visible: boolean;
  request: LabRequest | null;
  draft: ResultDraftState;
  setDraft: React.Dispatch<React.SetStateAction<ResultDraftState>>;
  saving: boolean;
  onSaveDraft: () => void;
  onValidate: () => void;
  onClose: () => void;
}) {
  return (
    <LabModal
      visible={visible}
      title="Remplir les resultats"
      subtitle="Simple manual entry when the clinic enters lab values itself."
      icon="flask-outline"
      onClose={onClose}
    >
      {!request ? (
        <Text style={styles.emptyStateText}>Selectionnez d{"'"}abord une demande d{"'"}analyse.</Text>
      ) : (
        <>
          <View style={styles.formGrid}>
            <InputField label="Patient" value={request.patient} editable={false} />
            <InputField label="Demande" value={`${request.id.slice(0, 8).toUpperCase()} - ${request.tests}`} editable={false} />
          </View>

          <View style={styles.resultEditBox}>
            {draft.rows.map((row, index) => (
              <View key={`${row.name}-${index}`} style={styles.resultEditRow}>
                <Text style={styles.resultEditName}>{row.name}</Text>
                <View style={styles.resultEditInputs}>
                  <TextInput
                    value={row.value}
                    onChangeText={(value) => {
                      const note = deriveNote(value, row.normal);
                      setDraft((current) => ({
                        ...current,
                        rows: current.rows.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, value, note } : item,
                        ),
                      }));
                    }}
                    style={[styles.smallInput, styles.valueInput]}
                  />
                  <TextInput
                    value={row.unit}
                    onChangeText={(unit) =>
                      setDraft((current) => ({
                        ...current,
                        rows: current.rows.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, unit } : item,
                        ),
                      }))
                    }
                    style={[styles.smallInput, styles.unitInput]}
                  />
                  <TextInput
                    value={row.normal}
                    onChangeText={(normal) => {
                      const note = deriveNote(row.value, normal);
                      setDraft((current) => ({
                        ...current,
                        rows: current.rows.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, normal, note } : item,
                        ),
                      }));
                    }}
                    style={[styles.smallInput, styles.normalInput]}
                  />
                </View>
                <Badge type={row.note === "Normal" ? "green" : row.note === "Eleve" ? "red" : "gray"}>
                  {row.note || "A verifier"}
                </Badge>
              </View>
            ))}
          </View>

          <InputField
            label="Conclusion / commentaire"
            value={draft.conclusion}
            onChangeText={(value) => setDraft((current) => ({ ...current, conclusion: value }))}
            multiline
          />
          <InputField
            label="Note medecin"
            value={draft.doctorNote}
            onChangeText={(value) => setDraft((current) => ({ ...current, doctorNote: value }))}
            multiline
          />
          <View style={styles.modalFooter}>
            <ActionButton title={saving ? "Sauvegarde..." : "Sauvegarder brouillon"} variant="light" onPress={onSaveDraft} containerStyle={styles.modalFooterButton} disabled={saving} />
            <ActionButton title="Valider resultat" variant="primary" onPress={onValidate} containerStyle={styles.modalFooterButton} disabled={saving} />
          </View>
        </>
      )}
    </LabModal>
  );
}

function DetailsModal({
  visible,
  request,
  onClose,
  setModal,
}: {
  visible: boolean;
  request: LabRequest | null;
  onClose: () => void;
  setModal: (modal: ModalType) => void;
}) {
  const steps = request ? buildTimeline(request) : [];

  return (
    <LabModal
      visible={visible}
      title="Details analyse"
      subtitle="One clean page to review request, payment, result, and actions."
      icon="eye-outline"
      onClose={onClose}
    >
      {!request ? (
        <Text style={styles.emptyStateText}>Aucune demande selectionnee.</Text>
      ) : (
        <>
          <View style={styles.infoGrid}>
            <InfoBox label="Patient" value={request.patient} />
            <InfoBox label="Type" value={request.type} />
            <InfoBox label="Paiement" value={paymentLabel(request.paymentStatus)} success={paymentSuccess(request.paymentStatus)} />
          </View>

          <View style={styles.timelineBox}>
            <Text style={styles.timelineTitle}>Timeline</Text>
            {steps.map((step) => (
              <View key={step.label} style={styles.timelineRow}>
                <View style={[styles.timelineDot, step.done ? styles.timelineDotDone : styles.timelineDotPending]} />
                <View>
                  <Text style={styles.timelineStep}>{step.label}</Text>
                  <Text style={styles.timelineTime}>{step.time}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.modalFooterThree}>
            <ActionButton title="Remplir resultat" variant="primary" onPress={() => setModal("manual")} containerStyle={styles.modalFooterThirdButton} />
            <ActionButton title="Voir rapport" variant="dark" onPress={() => setModal("report")} containerStyle={styles.modalFooterThirdButton} />
            <ActionButton title="Historique" variant="light" onPress={() => setModal("history")} containerStyle={styles.modalFooterThirdButton} />
          </View>
        </>
      )}
    </LabModal>
  );
}

function HistoryModal({
  visible,
  request,
  historyItems,
  onOpen,
  onClose,
}: {
  visible: boolean;
  request: LabRequest | null;
  historyItems: LabRequest[];
  onOpen: (requestId: string) => void;
  onClose: () => void;
}) {
  return (
    <LabModal
      visible={visible}
      title="Historique des analyses"
      subtitle="Patient lab history with internal and external results."
      icon="time-outline"
      onClose={onClose}
    >
      {!request ? (
        <Text style={styles.emptyStateText}>Aucune demande selectionnee.</Text>
      ) : (
        <>
          <View style={styles.blueInfoBox}>
            <Text style={styles.blueInfoText}>
              <Text style={styles.bold}>{request.patient}</Text> has {historyItems.length} lab records. This helps the doctor compare current and old results quickly.
            </Text>
          </View>

          <View style={styles.historyList}>
            {historyItems.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyTopRow}>
                  <View style={styles.historyTextWrap}>
                    <Text style={styles.historyTitle}>{item.tests || "Analyses"}</Text>
                    <Text style={styles.historyMeta}>{item.date} • {item.type}</Text>
                  </View>
                  <Pressable style={styles.openButton} onPress={() => onOpen(item.id)}>
                    <Text style={styles.openButtonText}>Ouvrir</Text>
                  </Pressable>
                </View>
                <Text style={styles.historySummary}>{item.resultSummary || item.clinicalContext || "Aucun resume disponible."}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </LabModal>
  );
}

function ReportModal({
  visible,
  request,
  onClose,
}: {
  visible: boolean;
  request: LabRequest | null;
  onClose: () => void;
}) {
  return (
    <LabModal
      visible={visible}
      title="Rapport / resume medecin"
      subtitle="A printable report with values, abnormal flags, and doctor summary."
      icon="document-text-outline"
      onClose={onClose}
    >
      {!request ? (
        <Text style={styles.emptyStateText}>Aucune demande selectionnee.</Text>
      ) : (
        <>
          <View style={styles.reportBox}>
            <View style={styles.reportHeader}>
              <View>
                <Text style={styles.reportClinic}>MedSync Clinic</Text>
                <Text style={styles.reportSubtitle}>Rapport d{"'"}analyses medicales</Text>
              </View>
              <MaterialCommunityIcons name="flask-outline" size={32} color="#2563EB" />
            </View>

            <View style={styles.reportInfoGrid}>
              <ReportInfo label="Patient" value={request.patient} />
              <ReportInfo label="Medecin" value={request.doctor} />
              <ReportInfo label="Date" value={request.date} />
            </View>

            <View style={styles.reportResultsBox}>
              {request.rows.map((row) => (
                <View key={row.name} style={styles.reportResultRow}>
                  <Text style={styles.reportResultName}>{row.name}</Text>
                  <Text style={styles.reportResultValue}>{row.value || "-"} {row.unit}</Text>
                  <Text style={styles.reportResultNormal}>{row.normal || "-"}</Text>
                  <Text style={row.note === "Normal" ? styles.resultNoteNormal : styles.resultNoteHigh}>{row.note || " "}</Text>
                </View>
              ))}
            </View>

            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>Resume automatique propose</Text>
              <Text style={styles.alertText}>
                {request.resultSummary || request.doctorNote || "Resultat a interpreter selon les symptomes du patient et l'historique medical."}
              </Text>
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Note medecin</Text>
              <Text style={styles.noteText}>{request.doctorNote || "Aucune note medecin."}</Text>
            </View>
          </View>
          <View style={styles.modalFooterThree}>
            <ActionButton title="Imprimer" icon="print-outline" variant="dark" containerStyle={styles.modalFooterThirdButton} />
            <ActionButton title="PDF" icon="download-outline" variant="light" containerStyle={styles.modalFooterThirdButton} />
            <ActionButton title="Envoyer" icon="send-outline" variant="blueLight" containerStyle={styles.modalFooterThirdButton} />
          </View>
        </>
      )}
    </LabModal>
  );
}

function InfoBox({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, success && styles.successText]}>{value}</Text>
    </View>
  );
}

function ReportInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reportInfoItem}>
      <Text style={styles.reportInfoLabel}>{label}</Text>
      <Text style={styles.reportInfoValue}>{value}</Text>
    </View>
  );
}

const COLORS = {
  page: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  softBorder: "#F1F5F9",
  text: "#0F172A",
  muted: "#64748B",
  lightMuted: "#94A3B8",
  blue: "#2563EB",
  dark: "#0F172A",
};

const badgeStyles = StyleSheet.create({
  gray: { backgroundColor: "#F1F5F9", color: "#334155" },
  green: { backgroundColor: "#ECFDF5", color: "#047857" },
  blue: { backgroundColor: "#EFF6FF", color: "#1D4ED8" },
  orange: { backgroundColor: "#FFF7ED", color: "#C2410C" },
  red: { backgroundColor: "#FEF2F2", color: "#B91C1C" },
  purple: { backgroundColor: "#F5F3FF", color: "#6D28D9" },
});

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  page: {
    padding: 18,
    gap: 18,
    paddingBottom: 40,
  },
  pageDesktop: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
      },
    }),
  },
  heroCard: {
    gap: 10,
  },
  heroCardDesktop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  brandPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  brandText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 13,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  description: {
    color: COLORS.muted,
    lineHeight: 22,
    fontSize: 14,
    marginTop: 6,
  },
  heroButtons: {
    marginTop: 8,
    gap: 10,
  },
  heroButtonsDesktop: {
    width: "100%",
  },
  heroButtonsWideDesktop: {
    width: 560,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  heroActionButton: {
    width: "100%",
  },
  heroActionButtonInline: {
    flex: 1,
    minWidth: 230,
  },
  buttonBase: {
    minHeight: 46,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: COLORS.blue,
  },
  buttonDark: {
    backgroundColor: COLORS.dark,
  },
  buttonLight: {
    backgroundColor: "#F1F5F9",
  },
  buttonBlueLight: {
    backgroundColor: "#EFF6FF",
  },
  buttonTextWhite: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonTextDark: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonTextBlue: {
    color: "#1D4ED8",
    fontWeight: "600",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  statsGrid: {
    gap: 12,
  },
  statsGridDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  statCardDesktop: {
    flex: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "600",
    overflow: "hidden",
  },
  statNumber: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "700",
  },
  statLabel: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  mainGrid: {
    gap: 16,
  },
  mainGridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  requestsCard: {
    padding: 0,
    overflow: "hidden",
  },
  requestsCardDesktop: {
    flex: 1,
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
    gap: 14,
  },
  cardHeaderDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
  },
  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  searchWrap: {
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.page,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  searchInputDesktop: {
    minWidth: 210,
  },
  requestList: {
    gap: 0,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.blue,
  },
  filterChipText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 12,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  emptyStateWrap: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    backgroundColor: COLORS.page,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  emptyStateTitle: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyStateText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  requestItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
    gap: 14,
  },
  requestItemDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  requestLeft: {
    flexDirection: "row",
    gap: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  requestInfo: {
    flex: 1,
    gap: 5,
  },
  requestTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  requestName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  requestAge: {
    color: COLORS.lightMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 2,
  },
  requestTests: {
    color: COLORS.muted,
    fontSize: 14,
  },
  requestMeta: {
    color: COLORS.lightMuted,
    fontSize: 12,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  requestActionsDesktop: {
    flexWrap: "nowrap",
    justifyContent: "flex-end",
  },
  openButton: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  openButtonText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  sideColumn: {
    gap: 16,
  },
  sideColumnDesktop: {
    width: 390,
    maxWidth: 390,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  alertBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  alertTitle: {
    color: "#92400E",
    fontWeight: "700",
    fontSize: 14,
  },
  alertText: {
    color: "#92400E",
    lineHeight: 20,
    fontSize: 13,
  },
  resultList: {
    gap: 10,
  },
  resultItem: {
    backgroundColor: COLORS.page,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  resultName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  resultNormal: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
  },
  resultRight: {
    alignItems: "flex-end",
  },
  resultValue: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
  },
  resultNoteNormal: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 3,
  },
  resultNoteHigh: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 3,
  },
  twoButtons: {
    marginTop: 16,
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    padding: 14,
    justifyContent: "center",
  },
  modalCard: {
    maxHeight: "84%",
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 24,
    overflow: "hidden",
  },
  modalHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  modalTitleTextWrap: {
    flex: 1,
  },
  modalTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 18,
  },
  modalSubtitle: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    maxHeight: 520,
  },
  modalBody: {
    padding: 18,
    gap: 16,
  },
  formGrid: {
    gap: 14,
  },
  formGridRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  fieldWrap: {
    gap: 7,
  },
  fieldLabel: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  input: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.page,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 14,
  },
  inputDisabled: {
    opacity: 0.8,
  },
  textArea: {
    minHeight: 86,
    paddingTop: 10,
  },
  selectBox: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.page,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 220,
    flex: 1,
  },
  selectText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: -4,
  },
  suggestionsBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  suggestionText: {
    color: COLORS.text,
    fontWeight: "700",
  },
  suggestionMeta: {
    color: COLORS.muted,
    fontSize: 12,
  },
  modalSection: {
    gap: 10,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: COLORS.blue,
  },
  chipText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  paymentSummary: {
    backgroundColor: COLORS.page,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  paymentTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 15,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  paymentValue: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalFooterThree: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalFooterButton: {
    flex: 1,
  },
  modalFooterThirdButton: {
    flex: 1,
  },
  resultEditBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  resultEditRow: {
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
  },
  resultEditName: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
  },
  resultEditInputs: {
    flexDirection: "row",
    gap: 8,
  },
  smallInput: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  valueInput: { flex: 0.8 },
  unitInput: { flex: 0.9 },
  normalInput: { flex: 1.4 },
  infoGrid: {
    gap: 12,
  },
  infoBox: {
    backgroundColor: COLORS.page,
    borderRadius: 18,
    padding: 14,
  },
  infoLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  infoValue: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 15,
    marginTop: 4,
  },
  successText: {
    color: "#059669",
  },
  timelineBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 14,
  },
  timelineTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 15,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    marginTop: 2,
  },
  timelineDotDone: {
    backgroundColor: "#10B981",
  },
  timelineDotPending: {
    backgroundColor: "#CBD5E1",
  },
  timelineStep: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
  },
  timelineTime: {
    color: COLORS.muted,
    marginTop: 3,
    fontSize: 12,
  },
  blueInfoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 14,
  },
  blueInfoText: {
    color: "#1E40AF",
    lineHeight: 20,
    fontSize: 13,
  },
  bold: {
    fontWeight: "700",
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  historyTextWrap: {
    flex: 1,
  },
  historyTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
  },
  historyMeta: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 12,
  },
  historySummary: {
    color: COLORS.muted,
    lineHeight: 20,
    fontSize: 13,
  },
  reportBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 16,
  },
  reportHeader: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  reportClinic: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  reportSubtitle: {
    color: COLORS.muted,
    marginTop: 3,
    fontSize: 13,
  },
  reportInfoGrid: {
    gap: 12,
  },
  reportInfoItem: {
    gap: 4,
  },
  reportInfoLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  reportInfoValue: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
  },
  reportResultsBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  reportResultRow: {
    padding: 12,
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
  },
  reportResultName: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
  },
  reportResultValue: {
    color: COLORS.text,
    fontSize: 13,
  },
  reportResultNormal: {
    color: COLORS.muted,
    fontSize: 12,
  },
  noteBox: {
    backgroundColor: COLORS.page,
    borderRadius: 18,
    padding: 14,
  },
  noteTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 14,
  },
  noteText: {
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 20,
    fontSize: 13,
  },
});
