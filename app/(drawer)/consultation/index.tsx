// app/(drawer)/consultation/index.tsx
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";

// Tab pages (separate files)
import BilansTab from "./_tabs/_bilan";
import ConsultationHeader from "./_tabs/_consultation_header";
import DocumentsTab from "./_tabs/_documents";
import LettresTab from "./_tabs/_lettres";
import MaladiesTab from "./_tabs/_maladies";
import ObservationMedicalTab from "./_tabs/_observation";
import OrdonnancesTab from "./_tabs/_ordonnance";
import SymptomesTab from "./_tabs/_symptomes";



/* ================= TYPES ================= */

type Sex = "male" | "female";
type ApptStatus = "pending" | "in_consultation" | "completed" | "cancelled";
type ApptType = "regular" | "emergency";

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
}

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
}

interface PrescriptionDrug {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: string;
  consultation_id: string;
  patient_id: string;
  drugs: PrescriptionDrug[];
  template_name: string;
  signed_by: string;
}

// Main tab keys are English in code. Visible labels are French (matching the video UI).
type MainTabKey =
  | "observation"
  | "prescriptions"
  | "lab_tests"
  | "letters"
  | "diagnoses"
  | "symptoms"
  | "documents";

/* ================= UI CONST ================= */

const MAIN_TABS: Array<{ key: MainTabKey; label: string }> = [
  { key: "observation", label: "Observation médicale" },
  { key: "prescriptions", label: "Ordonnances" },
  { key: "lab_tests", label: "Bilans" },
  { key: "letters", label: "Lettres" },
  { key: "diagnoses", label: "Maladies" },
  { key: "symptoms", label: "Symptômes" },
  { key: "documents", label: "Documents" },
];

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

/* ================= PAGE ================= */

export default function ConsultationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const { user } = useAuth();

  const doctor: Partial<Doctor> | null = null; // TODO: Fetch from database when doctor profile is available
  const doctorSpeciality =
    (user as any)?.doctorProfile?.speciality ?? null;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  // Which main tab is open (code key). Labels shown to the user are in French.
  const [activeMainTab, setActiveMainTab] = useState<MainTabKey>("observation");

  // Shared states for tabs
  const [vitals, setVitals] = useState(initialVitals);
  const [parameters, setParameters] = useState(initialParams);
  const [observations, setObservations] = useState("");

  const [prescriptions] = useState<Prescription[]>([]);

  /* ================= LOAD ================= */

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

        setAppointment({
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
        });

        setConsultation({
          id: `consult_${details.id}`,
          appointment_id: String(details.id),
          diagnosis: [],
          observations: "",
          treatment_plan: "",
          follow_up: "",
          status: "open",
          vitals: { ...initialVitals },
          parameters: { ...initialParams },
        });
      } catch (e) {
        console.error("Load consultation details error:", e);
        if (!cancelled) {
          setAppointment(null);
          setConsultation(null);
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

  const currentPrescription = useMemo(() => {
    if (!consultation || !appointment?.patient) return null;
    return prescriptions.find((p) => p.consultation_id === consultation.id) || null;
  }, [consultation, appointment?.patient, prescriptions]);

  /* ================= SAVE ================= */
  const save = async () => {
    if (!consultation) return;

    const updated: Consultation = {
      ...consultation,
      observations,
      parameters: { ...parameters },
      vitals: {
        ...(consultation.vitals || {}),
        taille_cm: vitals.taille_cm,
        poids_kg: vitals.poids_kg,
        tension: vitals.tension,
        temperature_c: vitals.temperature_c,
      },
      status: "closed",
    };

    try {
      if (user?.id && appointment?.id) {
        await callRpc<boolean, Record<string, unknown>>("rpc_update_appointment", {
          p_requester_id: user.id,
          p_appointment_id: appointment.id,
          p_status: "completed",
        });
      }
      setAppointment((prev) => (prev ? { ...prev, status: "completed" } : prev));
      setConsultation(updated);
      Alert.alert("Succes", "Consultation sauvegardee");
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Impossible de sauvegarder la consultation");
    }
  };

  if (loading) {
    return (
      <View style={[styles.page, { backgroundColor: theme.colors.background, padding: 20 }]}> 
        <Text>Chargement de la consultation...</Text>
      </View>
    );
  }
  if (!appointment) {
    return (
      <View style={[styles.page, { backgroundColor: theme.colors.background, padding: 20 }]}>
        <Text>Consultation introuvable</Text>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      {/* Title row */}
      <ConsultationHeader
        theme={theme}
        title="CONSULTATION"
        stepText="1/4"
        onBack={() => router.push("/visits")}
        onLastVisit={() => Alert.alert("Dernière visite", "Prototype")}
        onSave={save}
        onClose={() => Alert.alert("Clôturer", "Prototype")}
        onPrint={() => Alert.alert("Imprimer", "Prototype")}
        status={appointment?.status === "completed" ? "closed" : "in_consultation"}
        patientName={`${appointment?.patient?.first_name ?? ""} ${appointment?.patient?.last_name ?? ""}`.trim()}
        patientMeta={`${appointment?.patient?.age ?? "-"} ans • ${appointment?.patient?.sex === "female" ? "F" : "M"} • ID: ${appointment?.patient?.id ?? "-"}`}
        visitMeta={`Visite #${appointment?.id ?? "-"} • ${appointment?.time ?? ""}`}
      />

      {/* Main tabs (simplified: wrapped layout, no horizontal scrolling) */}
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

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
        {activeMainTab === "observation" && (
          <ObservationMedicalTab
            theme={theme}
            doctorSpeciality={doctorSpeciality}
            vitals={vitals}
            setVitals={setVitals}
            parameters={parameters}
            setParameters={setParameters}
            observations={observations}
            setObservations={setObservations}
            onSave={save}
          />
        )}

        {activeMainTab === "prescriptions" && (
          <OrdonnancesTab
            theme={theme}
            signedBy={currentPrescription?.signed_by || (doctor as any)?.signature_numerique || "Médecin"}
          />
        )}

        {activeMainTab === "lab_tests" && (
          <BilansTab
            theme={theme}
            consultationId={consultation!.id}
            patientId={appointment!.patient!.id}
          />
        )}

        {activeMainTab === "letters" && (
          <LettresTab
            theme={theme}
            patient={appointment!.patient}
            doctor={doctor}
            consultationSummary={{
              observations,
              conclusion: parameters.conclusion,
            }}
          />
        )}

        {activeMainTab === "diagnoses" && (
          <MaladiesTab theme={theme} initialDiagnosisCodes={consultation?.diagnosis || []} />
        )}

        {activeMainTab === "symptoms" && <SymptomesTab theme={theme} />}

        {activeMainTab === "documents" && (
          <DocumentsTab
            theme={theme}
            consultationId={consultation!.id}
            patientId={appointment!.patient!.id}
          />
        )}

        <TouchableOpacity style={styles.backFooter} onPress={() => router.push("/visits")}>
          <Ionicons name="arrow-back-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.backFooterText}>Retour aux visites</Text>
        </TouchableOpacity>
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
    titlePillText: { color: "#fff", fontWeight: "900" },
    lastVisitText: { color: theme.colors.text, opacity: 0.7, fontWeight: "800" },

    tabsContainer: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 6,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    mainTab: {
      minWidth: 180,
      flexGrow: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 11,
      paddingHorizontal: 12,
    },
    mainTabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    mainTabText: {
      color: theme.colors.text,
      fontWeight: "900",
      textAlign: "center",
    },
    mainTabTextActive: {
      color: "#fff",
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


