// app/(drawer)/consultation/index.tsx
import { TopBar } from "@/components/top_bar";
import { PAGE_GUTTER, getWebContainerFill } from "@/theme/layout";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/contexts/auth_context";
import { useAppData } from "@/contexts/appData_context";
import { callRpc } from "@/services/backend";
import type { ConsultationSession } from "@/services/backend.types";
import { isDesktopApp } from "@/services/desktop_runtime";
import { cacheConsultation, getCachedConsultation } from "@/services/offline_cache";
import {
  enqueueOfflineRpc,
  isLikelyOfflineError,
} from "@/services/offline_queue";
import { printOrdonnanceA4 } from "@/services/print.services";

// Tab pages (separate files)
import ConsultationHeader from "./_tabs/_consultation_header";
import LettresTab from "./_tabs/_lettres";
import MaladiesTab from "./_tabs/_maladies";
import ObservationMedicalTab from "./_tabs/_observation";
import OrdonnancesTab from "./_tabs/_ordonnance";
import SymptomesTab from "./_tabs/_symptomes";
import TreatmentTab from "./_tabs/_treatment";
import { normalizeSpeciality } from "@/config/speciality";



/* ================= TYPES ================= */

type Sex = "male" | "female";
type ApptStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "in_consultation";
type ApptType = "consultation" | "follow_up" | "emergency" | "procedure" | "regular";

interface Doctor {
  id: string;
  nom_complet: string;
  specialite: string;
  tarif_consultation: number;
  signature_numerique: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number;
  sex: Sex;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  time: string;
  status: ApptStatus;
  type: ApptType;
  notes: string;
  patient?: Patient;
}

type RpcAppointmentDetails = {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  scheduled_at: string;
  status: string;
  type: string;
  notes: string | null;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  patient_phone?: string | null;
  patient_email?: string | null;
};

interface ConsultationVitals {
  taille_cm?: string;
  poids_kg?: string;
  tension?: string;
  temperature_c?: string;

  // Legacy/alternate naming support
  blood_pressure?: string;
  temperature?: number | string;
  weight_kg?: number | string;
  height_cm?: number | string;
}

interface ConsultationParameters {
  motif_consultation?: string;
  glycemie?: string;
  hba1c?: string;
  examen_clinique?: string;
  conclusion?: string;
  [key: string]: string | undefined;
}

type ObservationPayload = Record<string, unknown>;

interface Consultation {
  id: string;
  appointment_id: string;
  diagnosis: string[];
  observations: string;
  treatment_plan: string;
  follow_up: string;
  status: "open" | "closed";
  vitals?: ConsultationVitals;
  parameters?: ConsultationParameters;
  speciality_payload?: ObservationPayload;
}

type SelectedOrdonnanceDrug = {
  name: string;
  qty?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

type SelectedOrdonnance = {
  ref: string;
  drugs: SelectedOrdonnanceDrug[];
};

// Main tab keys are English in code. Visible labels are French (matching the video UI).
type MainTabKey =
  | "observation"
  | "treatment"
  | "prescriptions"
  | "letters"
  | "diagnoses"
  | "symptoms";

/* ================= UI CONST ================= */

const MAIN_TABS: { key: MainTabKey; label: string }[] = [
  { key: "observation", label: "Observation médicale" },
  { key: "treatment", label: "Traitements" },
  { key: "prescriptions", label: "Ordonnances" },
  { key: "letters", label: "Lettres" },
  { key: "diagnoses", label: "Maladies" },
  { key: "symptoms", label: "Symptômes" },
];

const WORKSPACE_OPTIONS = [
  { key: "general_medicine", label: "Medecine Generale" },
  { key: "analyses_medicales", label: "Analyses Medicales" },
  { key: "cardiology", label: "Cardiologie" },
  { key: "dermatology", label: "Dermatologie" },
  { key: "orthopedics", label: "Orthopedie" },
  { key: "dentistry", label: "Dentisterie" },
  { key: "gynecology", label: "Gynecologie" },
  { key: "pediatrics", label: "Pediatrie" },
  { key: "endocrinology_diabetes", label: "Endocrino / Diabete" },
  { key: "ent", label: "ORL" },
  { key: "ophthalmology", label: "Ophtalmologie" },
  { key: "pulmonology", label: "Pneumologie" },
  { key: "gastroenterology", label: "Gastroenterologie" },
] as const;

const WORKSPACE_OPTION_KEYS = new Set<string>(WORKSPACE_OPTIONS.map((option) => option.key));

function sanitizeWorkspaceKey(value: unknown): string {
  const key = String(value || "general_medicine");
  return WORKSPACE_OPTION_KEYS.has(key) ? key : "general_medicine";
}

const initialVitals = {
  taille_cm: "",
  poids_kg: "",
  tension: "",
  temperature_c: "",
};

const initialParams = {
  motif_consultation: "",
  glycemie: "",
  hba1c: "",
  examen_clinique: "",
  conclusion: "",
};

const OBSERVATION_VITAL_KEYS = new Set([
  "weight_kg",
  "poids_kg",
  "weight",
  "height_cm",
  "taille_cm",
  "height",
  "blood_pressure",
  "bloodPressure",
  "tension",
  "temperature_c",
  "temperature",
  "systolic_bp",
  "diastolic_bp",
  "spo2_percent",
  "oxygen_saturation",
  "bmi",
]);

function toTextValue(value: unknown): string {
  if (value == null) return "";
  return typeof value === "string" ? value : String(value);
}

function asObservationPayload(value: unknown): ObservationPayload {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ObservationPayload) : {};
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;

  const next = Number(normalized);
  return Number.isFinite(next) ? next : null;
}

function extractObservationPayloadState(payload: ObservationPayload) {
  const systolic = toTextValue(payload.systolic_bp);
  const diastolic = toTextValue(payload.diastolic_bp);
  const bloodPressure = toTextValue(
    payload.blood_pressure ??
      payload.tension ??
      (systolic && diastolic ? `${systolic}/${diastolic}` : ""),
  );

  const nextVitals: ConsultationVitals = {
    taille_cm: toTextValue(payload.height_cm ?? payload.taille_cm),
    poids_kg: toTextValue(payload.weight_kg ?? payload.poids_kg),
    tension: bloodPressure,
    temperature_c: toTextValue(payload.temperature_c ?? payload.temperature),
  };

  const nextParameters: ConsultationParameters = { ...initialParams };
  for (const [key, rawValue] of Object.entries(payload)) {
    if (OBSERVATION_VITAL_KEYS.has(key)) continue;
    if (Array.isArray(rawValue)) continue;
    if (rawValue && typeof rawValue === "object") continue;
    nextParameters[key] = toTextValue(rawValue);
  }

  return { vitals: nextVitals, parameters: nextParameters };
}

function buildObservationPayload(vitals: ConsultationVitals, parameters: ConsultationParameters): ObservationPayload {
  const payload: ObservationPayload = {};

  for (const [key, rawValue] of Object.entries(parameters ?? {})) {
    const value = toTextValue(rawValue).trim();
    if (!value) continue;
    payload[key] = value;
  }

  const weight = parseOptionalNumber(vitals.poids_kg);
  if (weight != null) payload.weight_kg = weight;

  const height = parseOptionalNumber(vitals.taille_cm);
  if (height != null) payload.height_cm = height;

  const temperature = parseOptionalNumber(vitals.temperature_c);
  if (temperature != null) payload.temperature_c = temperature;

  const [sysRaw, diaRaw] = toTextValue(vitals.tension)
    .split("/")
    .map((part) => part.trim());
  const systolic = parseOptionalNumber(sysRaw);
  const diastolic = parseOptionalNumber(diaRaw);

  const bloodPressure = toTextValue(vitals.tension).trim();
  if (bloodPressure) payload.blood_pressure = bloodPressure;
  if (systolic != null) payload.systolic_bp = systolic;
  if (diastolic != null) payload.diastolic_bp = diastolic;

  return payload;
}

function formatVisitDateLabel(input?: string | null): string {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ================= PAGE ================= */

export default function ConsultationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const consultationTheme = theme;
  const styles = createStyles(consultationTheme);

  const { user } = useAuth();
  const { clinic } = useAppData();

  const doctor: Partial<Doctor> | null = user
    ? {
        id: String(user.id || ""),
        nom_complet: String((user as any).fullname || ""),
        specialite: String((user as any)?.doctorProfile?.speciality || ""),
        tarif_consultation: 0,
        signature_numerique: String((user as any).fullname || ""),
      }
    : null;
  const doctorSpeciality =
    (user as any)?.doctorProfile?.speciality ?? null;
  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<string>("general_medicine");

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  // Which main tab is open (code key). Labels shown to the user are in French.
  const [activeMainTab, setActiveMainTab] = useState<MainTabKey>("observation");

  // Shared states for tabs
  const [vitals, setVitals] = useState<ConsultationVitals>(initialVitals);
  const [parameters, setParameters] = useState<ConsultationParameters>(initialParams);
  const [observations, setObservations] = useState("");
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<SelectedOrdonnance | null>(null);
  const isClosed = consultation?.status === "closed" || appointment?.status === "completed";

  /* ================= LOAD ================= */

  const hydrateConsultation = (nextAppointment: Appointment, session: ConsultationSession) => {
    setAppointment(nextAppointment);

    if (!session?.consultation?.id) return;

    const sessionPayload = {
      ...asObservationPayload(session.consultation.speciality_payload),
      ...asObservationPayload(
        (session as ConsultationSession & { observations?: ObservationPayload | null }).observations,
      ),
    };

    setConsultation({
      id: String(session.consultation.id),
      appointment_id: String(session.consultation.appointment_id),
      diagnosis: (session.diagnoses || []).map((d) => String(d.code || d.label)).filter(Boolean),
      observations: String(session.consultation.observations ?? ""),
      treatment_plan: String(session.consultation.treatment_plan ?? ""),
      follow_up: String(session.consultation.follow_up ?? ""),
      status: (session.consultation.status as any) === "closed" ? "closed" : "open",
      vitals: { ...initialVitals },
      parameters: { ...initialParams },
      speciality_payload: sessionPayload,
    });
    setDiagnosisCodes((session.diagnoses || []).map((d) => String(d.code || d.label)).filter(Boolean));

    if (session.consultation.speciality_key) {
      setActiveWorkspaceKey(sanitizeWorkspaceKey(session.consultation.speciality_key));
    }

    setObservations(String(session.consultation.observations ?? ""));

    if (Object.keys(sessionPayload).length) {
      const nextState = extractObservationPayloadState(sessionPayload);
      setParameters(nextState.parameters);
      setVitals(nextState.vitals);
      setSelectedSymptoms(
        Array.isArray(sessionPayload.symptoms_selected)
          ? sessionPayload.symptoms_selected.map((item) => String(item)).filter(Boolean)
          : [],
      );
    } else if (session.parameters) {
      setParameters({
        motif_consultation: String(session.parameters.motif_consultation ?? ""),
        glycemie: String(session.parameters.glycemie ?? ""),
        hba1c: String(session.parameters.hba1c ?? ""),
        examen_clinique: String(session.parameters.examen_clinique ?? ""),
        conclusion: String(session.parameters.conclusion ?? ""),
      });
      setSelectedSymptoms([]);
    } else {
      setParameters({ ...initialParams });
      setSelectedSymptoms([]);
    }

    if (session.vitals) {
      const tension =
        session.vitals.systolic_bp != null && session.vitals.diastolic_bp != null
          ? `${session.vitals.systolic_bp}/${session.vitals.diastolic_bp}`
          : "";
      setVitals({
        taille_cm: session.vitals.height != null ? String(session.vitals.height) : "",
        poids_kg: session.vitals.weight != null ? String(session.vitals.weight) : "",
        tension,
        temperature_c: session.vitals.temperature != null ? String(session.vitals.temperature) : "",
      });
    } else {
      setVitals({ ...initialVitals });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!user?.id || !id) return;
        setLoading(true);

        const details = await callRpc<RpcAppointmentDetails, Record<string, unknown>>(
          "rpc_get_appointment_details",
          {
            p_requester_id: user.id,
            p_appointment_id: id,
          },
        );
        if (cancelled) return;

        const nextAppointment: Appointment = {
          id: String(details.id),
          patient_id: String(details.patient_id),
          time: String(details.scheduled_at),
          status: (details.status as ApptStatus) ?? "pending",
          type: (details.type as ApptType) ?? "regular",
          notes: String(details.notes ?? ""),
          patient: {
            id: String(details.patient_id),
            first_name: String(details.patient_first_name ?? ""),
            last_name: String(details.patient_last_name ?? ""),
            date_of_birth: "",
            age: 0,
            sex: "male",
            phone: String(details.patient_phone ?? ""),
            email: String(details.patient_email ?? ""),
            address: "",
            created_at: "",
          },
        };
        const session = await callRpc<ConsultationSession, Record<string, unknown>>("rpc_open_consultation", {
          p_requester_id: user.id,
          p_appointment_id: id,
        });
        hydrateConsultation(nextAppointment, session);
        await cacheConsultation(user.id, String(id), { appointment: nextAppointment, session });
      } catch (e) {
        console.error("Load consultation details error:", e);
        if (!cancelled) {
          const cached = isDesktopApp()
            ? await getCachedConsultation<{ appointment: Appointment; session: ConsultationSession }>(
                String(user?.id || ""),
                String(id || ""),
              )
            : null;

          if (cached?.appointment && cached.session) {
            hydrateConsultation(cached.appointment, cached.session);
            Alert.alert("Mode hors connexion", "Consultation chargee depuis le poste local.");
          } else {
            Alert.alert("Erreur", e instanceof Error ? e.message : "Impossible d'ouvrir la consultation");
            setAppointment(null);
            setConsultation(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  /* ================= ORDONNANCES HELPERS ================= */

  const currentObservationPayload = useMemo(() => {
    const payload = buildObservationPayload(vitals, parameters);
    if (selectedSymptoms.length) {
      payload.symptoms_selected = selectedSymptoms;
      payload.symptoms_summary = selectedSymptoms.join(", ");
    }
    return payload;
  }, [parameters, selectedSymptoms, vitals]);

  const handlePrintOrdonnance = () => {
    if (!selectedOrdonnance) {
      Alert.alert("Impression", "Aucune ordonnance sÃ©lectionnÃ©e.");
      return;
    }

    printOrdonnanceA4({
      reference: selectedOrdonnance.ref,
      clinicName: String((clinic as any)?.name || "Clinique"),
      clinicAddress: String((clinic as any)?.google_maps_address || (clinic as any)?.address || ""),
      clinicPhone: String((clinic as any)?.phone || ""),
      patientName: `${appointment?.patient?.first_name ?? ""} ${appointment?.patient?.last_name ?? ""}`.trim(),
      patientAge: appointment?.patient?.age != null ? `${appointment.patient.age} ans` : "",
      patientSex: appointment?.patient?.sex === "female" ? "F" : "M",
      doctorName: (doctor as any)?.nom_complet || "MÃ©decin",
      doctorSpeciality: (doctor as any)?.specialite || "",
      doctorLicenseNumber: String((user as any)?.doctorProfile?.license_number || ""),
      signedBy: (doctor as any)?.signature_numerique || "MÃ©decin",
      drugs: selectedOrdonnance.drugs,
    });
  };

  /* ================= SAVE ================= */
  const persistConsultation = async (closeAfterSave: boolean) => {
    if (!consultation) return;
    const specialityPayload: ObservationPayload = {
      ...buildObservationPayload(vitals, parameters),
    };
    if (selectedSymptoms.length) {
      specialityPayload.symptoms_selected = selectedSymptoms;
      specialityPayload.symptoms_summary = selectedSymptoms.join(", ");
    }

    const updated: Consultation = {
      ...consultation,
      diagnosis: diagnosisCodes,
      observations,
      parameters: { ...parameters },
      vitals: {
        ...(consultation.vitals || {}),
        taille_cm: vitals.taille_cm,
        poids_kg: vitals.poids_kg,
        tension: vitals.tension,
        temperature_c: vitals.temperature_c,
      },
      speciality_payload: specialityPayload,
      status: closeAfterSave ? "closed" : "open",
    };

    const [sysStr, diaStr] = String(vitals.tension || "").split("/").map((x) => x.trim());
    const systolic = sysStr && /^\d+$/.test(sysStr) ? Number(sysStr) : null;
    const diastolic = diaStr && /^\d+$/.test(diaStr) ? Number(diaStr) : null;
    const saveParams: Record<string, unknown> = {
      p_requester_id: user?.id,
      p_consultation_id: consultation.id,
      p_observations: observations,
      p_treatment_plan: updated.treatment_plan,
      p_follow_up: updated.follow_up,
      p_status: closeAfterSave ? "closed" : "open",
      p_vitals: {
        weight: vitals.poids_kg || null,
        height: vitals.taille_cm || null,
        temperature: vitals.temperature_c || null,
        systolic_bp: systolic,
        diastolic_bp: diastolic,
      },
      p_parameters: {
        ...parameters,
        motif_consultation: parameters.motif_consultation || null,
        glycemie: parameters.glycemie || null,
        hba1c: parameters.hba1c || null,
        examen_clinique: parameters.examen_clinique || null,
        conclusion: parameters.conclusion || null,
      },
      p_diagnoses: diagnosisCodes.map((code) => ({
        code,
        label: code,
      })),
      p_speciality_key: activeWorkspaceKey,
      p_speciality_payload: specialityPayload,
    };

    // Keep the latest draft available for the next desktop launch. This is a
    // no-op in the browser, which intentionally remains online-only.
    if (user?.id && appointment?.id) {
      await cacheConsultation(user.id, appointment.id, {
        appointment: {
          ...appointment,
          status: closeAfterSave ? "completed" : appointment.status,
        },
        session: {
          consultation: {
            id: updated.id,
            appointment_id: updated.appointment_id,
            observations: updated.observations,
            treatment_plan: updated.treatment_plan,
            follow_up: updated.follow_up,
            status: updated.status,
            speciality_key: activeWorkspaceKey,
            speciality_payload: specialityPayload,
          },
          diagnoses: diagnosisCodes.map((code) => ({ code, label: code })),
          parameters: updated.parameters,
          vitals: {
            weight: vitals.poids_kg || null,
            height: vitals.taille_cm || null,
            temperature: vitals.temperature_c || null,
            systolic_bp: systolic,
            diastolic_bp: diastolic,
          },
        },
      });
    }

    try {
      if (user?.id && appointment?.id) {
        await callRpc<boolean, Record<string, unknown>>("rpc_save_consultation", {
          ...saveParams,
        });

        if (closeAfterSave) {
          await callRpc<boolean, Record<string, unknown>>("rpc_close_consultation", {
            p_requester_id: user.id,
            p_consultation_id: consultation.id,
          });
        }
      }
      setAppointment((prev) =>
        prev
          ? {
              ...prev,
              status: closeAfterSave ? "completed" : prev.status === "pending" ? "in_consultation" : prev.status,
            }
          : prev,
      );
      setConsultation(updated);
      Alert.alert("Succes", closeAfterSave ? "Consultation cloturee" : "Consultation sauvegardee");
      if (closeAfterSave) {
        router.replace("/consultations");
      }
    } catch (e: any) {
      if (user?.id && appointment?.id && isDesktopApp() && isLikelyOfflineError(e)) {
        await enqueueOfflineRpc({
          ownerUserId: user.id,
          rpcName: "rpc_save_consultation",
          params: saveParams,
        });

        if (closeAfterSave) {
          await enqueueOfflineRpc({
            ownerUserId: user.id,
            rpcName: "rpc_close_consultation",
            params: {
              p_requester_id: user.id,
              p_consultation_id: consultation.id,
            },
          });
        }

        setAppointment((prev) =>
          prev
            ? {
                ...prev,
                status: closeAfterSave ? "completed" : prev.status === "pending" ? "in_consultation" : prev.status,
              }
            : prev,
        );
        setConsultation(updated);
        Alert.alert(
          "Enregistre sur ce poste",
          closeAfterSave
            ? "La consultation sera synchronisee automatiquement quand Internet reviendra."
            : "Le brouillon sera synchronise automatiquement quand Internet reviendra.",
        );
        return;
      }

      Alert.alert("Erreur", e?.message || "Impossible de sauvegarder la consultation");
    }
  };

  const saveDraft = async () => {
    await persistConsultation(false);
  };

  const closeConsultation = async () => {
    await persistConsultation(true);
  };

  if (loading) {
    return (
      <View style={[styles.page, { backgroundColor: consultationTheme.colors.background, padding: 20 }]}> 
        <Text>Chargement de la consultation...</Text>
      </View>
    );
  }
  if (!appointment) {
    return (
      <View style={[styles.page, { backgroundColor: consultationTheme.colors.background, padding: 20 }]}>
        <Text>Consultation introuvable</Text>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={[styles.page, { backgroundColor: consultationTheme.colors.backgroundAlt }]}>
      <TopBar theme={consultationTheme} />

      <View
        style={{
          paddingHorizontal: PAGE_GUTTER,
          position: "relative",
          zIndex: 40,
          ...(Platform.OS === "web" ? ({ overflow: "visible" } as any) : null),
        }}
      >
        <ConsultationHeader
          theme={consultationTheme}
          title="CONSULTATION"
          stepText="1/4"
          onBack={() => router.push("/visits")}
          onLastVisit={() => router.push("/consultations")}
          onSave={isClosed ? undefined : saveDraft}
          onClose={isClosed ? undefined : closeConsultation}
          onPrint={handlePrintOrdonnance}
          status={appointment?.status === "completed" ? "closed" : "in_consultation"}
          patientName={`${appointment?.patient?.first_name ?? ""} ${appointment?.patient?.last_name ?? ""}`.trim()}
          patientMeta={`${appointment?.patient?.age ?? "-"} ans • ${appointment?.patient?.sex === "female" ? "F" : "M"}`}
          workspaceLabel={WORKSPACE_OPTIONS.find((w) => w.key === activeWorkspaceKey)?.label || "Workspace"}
          workspaceOptions={[...WORKSPACE_OPTIONS]}
          onWorkspaceChange={isClosed ? undefined : (key) => setActiveWorkspaceKey(sanitizeWorkspaceKey(key))}
          visitMeta={`Visite • ${formatVisitDateLabel(appointment?.time)}`}
          consultationStats={{
            statusLabel: appointment?.status === "completed" ? "TERMINEE" : "EN COURS",
            specialtyLabel: WORKSPACE_OPTIONS.find((w) => w.key === activeWorkspaceKey)?.label || "Workspace",
            visitLabel: formatVisitDateLabel(appointment?.time),
          }}
        />
      </View>

      {/* Main tabs (simplified: wrapped layout, no horizontal scrolling) */}
      <View style={{ paddingHorizontal: PAGE_GUTTER, position: "relative", zIndex: 5 }}>
        <View style={styles.tabsContainer}>
          {MAIN_TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveMainTab(t.key)}
              style={[
                styles.mainTab,
                activeMainTab === t.key && styles.mainTabActive,
              ]}
            >
              <Text style={[styles.mainTabText, activeMainTab === t.key && styles.mainTabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: PAGE_GUTTER,
          paddingTop: 14,
          paddingBottom: 34,
          gap: 10,
          ...getWebContainerFill(),
        }}
      >
        <View style={styles.contentCard}>
          {isClosed ? (
            <View style={styles.readOnlyBanner}>
              <Ionicons name="lock-closed-outline" size={16} color={consultationTheme.colors.success} />
              <Text style={styles.readOnlyBannerText}>
                Consultation cloturee. Les modifications sont desactivees.
              </Text>
            </View>
          ) : null}
          <View style={{ display: activeMainTab === "observation" ? "flex" : "none" }}>
            <ObservationMedicalTab
              theme={consultationTheme}
              doctorSpeciality={doctorSpeciality}
              workspaceKey={activeWorkspaceKey}
              vitals={vitals}
              setVitals={isClosed ? (() => {}) as any : setVitals}
              parameters={parameters}
              setParameters={isClosed ? (() => {}) as any : setParameters}
              observations={observations}
              setObservations={isClosed ? (() => {}) as any : setObservations}
              onSave={isClosed ? undefined : saveDraft}
              workspaceMode
              patientId={appointment?.patient?.id}
              consultationId={consultation?.id}
              currentPayload={currentObservationPayload}
            />
          </View>

          <View style={{ display: activeMainTab === "treatment" ? "flex" : "none" }}>
            <TreatmentTab
              theme={consultationTheme}
              workspaceKey={activeWorkspaceKey}
            />
          </View>

          {activeMainTab === "prescriptions" && (
            <OrdonnancesTab
              theme={consultationTheme}
              requesterId={user?.id}
              consultationId={consultation?.id}
              patientId={appointment?.patient?.id}
              signedBy={(doctor as any)?.signature_numerique || "MÃ©decin"}
              readOnly={isClosed}
              onSelectedPrescriptionChange={(rx) => {
                if (!rx) return setSelectedOrdonnance(null);
                setSelectedOrdonnance({
                  ref: String(rx.ref || ""),
                  drugs: (rx.drugs || []).map((d) => ({
                    name: String(d.name || ""),
                    qty: d.qty ?? "",
                    dose: d.dose ?? "",
                    frequency: d.frequency ?? "",
                    duration: d.duration ?? "",
                    instructions: d.instructions ?? "",
                  })),
                });
              }}
              onPrint={(rx) => {
                if (!rx) return;
                printOrdonnanceA4({
                  reference: String(rx.ref || ""),
                  clinicName: String((clinic as any)?.name || "Clinique"),
                  clinicAddress: String((clinic as any)?.google_maps_address || (clinic as any)?.address || ""),
                  clinicPhone: String((clinic as any)?.phone || ""),
                  patientName: `${appointment?.patient?.first_name ?? ""} ${appointment?.patient?.last_name ?? ""}`.trim(),
                  patientAge: appointment?.patient?.age != null ? `${appointment.patient.age} ans` : "",
                  patientSex: appointment?.patient?.sex === "female" ? "F" : "M",
                  doctorName: (doctor as any)?.nom_complet || "MÃ©decin",
                  doctorSpeciality: (doctor as any)?.specialite || "",
                  doctorLicenseNumber: String((user as any)?.doctorProfile?.license_number || ""),
                  signedBy: (doctor as any)?.signature_numerique || "MÃ©decin",
                  drugs: (rx.drugs || []).map((d) => ({
                    name: String(d.name || ""),
                    qty: d.qty ?? "",
                    dose: d.dose ?? "",
                    frequency: d.frequency ?? "",
                    duration: d.duration ?? "",
                    instructions: d.instructions ?? "",
                  })),
                });
              }}
            />
          )}

          {activeMainTab === "letters" && (
          <LettresTab
            theme={consultationTheme}
            patient={appointment!.patient}
            doctor={doctor}
            consultationSummary={{
              observations,
              conclusion: parameters.conclusion || "",
            }}
          />
        )}

          {activeMainTab === "diagnoses" && (
            <MaladiesTab
              theme={consultationTheme}
              initialDiagnosisCodes={diagnosisCodes}
              onChangeDiagnosisCodes={isClosed ? undefined : setDiagnosisCodes}
              readOnly={isClosed}
            />
          )}

          {activeMainTab === "symptoms" && (
            <SymptomesTab
              theme={consultationTheme}
              value={selectedSymptoms}
              onChange={isClosed ? undefined : setSelectedSymptoms}
              readOnly={isClosed}
            />
          )}

        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
    },
    titleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    titleText: { fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
    titlePill: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    titlePillText: { color: theme.colors.textOnPrimary, fontWeight: "900" },
    lastVisitText: { color: theme.colors.text, opacity: 0.7, fontWeight: "800" },

    tabsContainer: {
      paddingHorizontal: 0,
      paddingTop: 10,
      paddingBottom: 4,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      backgroundColor: "transparent",
      ...(Platform.OS === "web"
        ? ({
            position: "sticky",
            top: 64,
            zIndex: 5,
            backgroundColor: theme.colors.backgroundAlt,
          } as any)
        : null),
    },
    mainTab: {
      minWidth: 170,
      flexGrow: 1,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surface,
    },
    mainTabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    mainTabText: {
      color: theme.colors.textSecondary,
      fontWeight: "900",
      textAlign: "center",
    },
    mainTabTextActive: {
      color: theme.colors.textOnPrimary,
    },
    contentCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      padding: 14,
      ...(Platform.OS === "web"
        ? ({
            boxShadow: "0 14px 30px rgba(15,23,42,0.07)",
          } as any)
        : null),
    },
    readOnlyBanner: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor: `${theme.colors.success}44`,
      backgroundColor: theme.colors.successSoft,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    readOnlyBannerText: {
      color: theme.colors.text,
      fontWeight: "800",
    },

    backFooter: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 10,
    },
    backFooterText: {
      color: theme.colors.primary,
      fontWeight: "900",
    },
  });
