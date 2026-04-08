// app/(drawer)/consultation/index.tsx
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { MOCK } from "@/data/mock";
import { useAuth } from "@/contexts/auth_context";

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

  // Consultation is only for doctors.
  useEffect(() => {
    if (user && user.role !== "doctor") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const doctor: Doctor | null = (MOCK as any).doctor ?? null;
  const doctorSpeciality =
    (user as any)?.doctorProfile?.speciality ?? (doctor as any)?.specialite;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);

  // Which main tab is open (code key). Labels shown to the user are in French.
  const [activeMainTab, setActiveMainTab] = useState<MainTabKey>("observation");

  // Shared states for tabs
  const [vitals, setVitals] = useState(initialVitals);
  const [parameters, setParameters] = useState(initialParams);
  const [observations, setObservations] = useState("");

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(
    () => ((MOCK as any).prescriptions as Prescription[]) || []
  );

  /* ================= LOAD ================= */

  useEffect(() => {
    const appt = (MOCK as any).appointments?.find((a: Appointment) => a.id === id) as
      | Appointment
      | undefined;
    if (!appt) return;

    const patient = (MOCK as any).patients?.find((p: Patient) => p.id === appt.patient_id) as
      | Patient
      | undefined;

    setAppointment({ ...appt, patient });

    const found = (MOCK as any).consultations?.find(
      (c: Consultation) => c.appointment_id === appt.id
    ) as Consultation | undefined;

    const consult: Consultation =
      found || {
        id: `c_${appt.id}`,
        appointment_id: appt.id,
        diagnosis: [],
        observations: "",
        treatment_plan: "",
        follow_up: "",
        status: "open",
        vitals: {},
        parameters: {},
      };

    setConsultation(consult);

    const mv = (consult.vitals || {}) as ConsultationVitals;

    setVitals({
      ...initialVitals,
      taille_cm: mv.taille_cm ?? (mv.height_cm != null ? String(mv.height_cm) : ""),
      poids_kg: mv.poids_kg ?? (mv.weight_kg != null ? String(mv.weight_kg) : ""),
      tension: mv.tension ?? (mv.blood_pressure != null ? String(mv.blood_pressure) : ""),
      temperature_c: mv.temperature_c ?? (mv.temperature != null ? String(mv.temperature) : ""),
    });

    setParameters({
      ...initialParams,
      ...(consult.parameters || {}),
    });

    setObservations(consult.observations || "");
  }, [id]);

  /* ================= ORDONNANCES HELPERS ================= */

  const currentPrescription = useMemo(() => {
    if (!consultation || !appointment?.patient) return null;
    return prescriptions.find((p) => p.consultation_id === consultation.id) || null;
  }, [consultation, appointment?.patient, prescriptions]);

  const ensurePrescription = () => {
    if (!consultation || !appointment?.patient) return null;

    let rx = prescriptions.find((p) => p.consultation_id === consultation.id);
    if (rx) return rx;

    rx = {
      id: `rx_${consultation.id}`,
      consultation_id: consultation.id,
      patient_id: appointment.patient.id,
      drugs: [],
      template_name: "Ordonnance libre",
      signed_by: doctor?.signature_numerique || "Médecin",
    };

    setPrescriptions((prev) => [...prev, rx!]);
    return rx;
  };

  const addDrug = (drug: PrescriptionDrug) => {
    const rx = ensurePrescription();
    if (!rx) return;

    if (!drug.name.trim()) {
      Alert.alert("Info", "Nom du médicament requis");
      return;
    }

    setPrescriptions((prev) =>
      prev.map((p) => (p.id === rx.id ? { ...p, drugs: [...p.drugs, { ...drug }] } : p))
    );
  };

  /* ================= SAVE ================= */

  const save = () => {
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

    setConsultation(updated);
    Alert.alert("Succès", "Consultation sauvegardée (prototype)");
  };

  if (!appointment) {
    return (
      <View style={[styles.page, { backgroundColor: theme.colors.background, padding: 20 }]}>
        <Text>Consultation introuvable</Text>
      </View>
    );
  }

  /* ================= UI ================= */

  const TAB_BAR_HEIGHT = 60; // Fixed height like the video

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


      {/* Main tabs */}
      <View style={{ height: TAB_BAR_HEIGHT }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: TAB_BAR_HEIGHT }}
          contentContainerStyle={styles.tabsContainer}
        >
          {MAIN_TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveMainTab(t.key)}
              style={[
                styles.mainTab,
                { height: TAB_BAR_HEIGHT - 10 },
                activeMainTab === t.key && styles.mainTabActive,
              ]}
            >
              <Text style={[styles.mainTabText, activeMainTab === t.key && styles.mainTabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
            signedBy={currentPrescription?.signed_by || doctor?.signature_numerique || "Médecin"}
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

    tabsContainer: { paddingHorizontal: 10, paddingTop: 10,alignItems: "stretch" },
    mainTab: {
      width: 200,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      marginRight: 10,
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.7,
    },
    mainTabActive: {
      opacity: 1,
    },
    mainTabText: {
      color: "#fff",
      fontWeight: "900",
      textAlign: "center",
      paddingHorizontal: 8,
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
