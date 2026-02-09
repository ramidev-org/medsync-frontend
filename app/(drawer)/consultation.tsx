// app/(whatever)/consultation/[id].tsx
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import data from "@/data/preview_data.json";

// ✅ tab pages (separate files)
import BilansTab from "@/components/consultation_tabs/bilan";
import DocumentsTab from "@/components/consultation_tabs/documents";
import LettresTab from "@/components/consultation_tabs/lettres";
import MaladiesTab from "@/components/consultation_tabs/maladies";
import ObservationMedicalTab from "@/components/consultation_tabs/observation";
import OrdonnancesTab from "@/components/consultation_tabs/ordonnance";
import PlaceholderTab from "@/components/consultation_tabs/placeholder";
import SymptomesTab from "@/components/consultation_tabs/symptomes";


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

type MainTab =
  | "Observation médicale"
  | "Ordonnances"
  | "Bilans"
  | "Lettres"
  | "Maladies"
  | "Symptômes"
  | "Documents";

/* ================= UI CONST ================= */

const MAIN_TABS: MainTab[] = [
  "Observation médicale",
  "Ordonnances",
  "Bilans",
  "Lettres",
  "Maladies",
  "Symptômes",
  "Documents",
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

  const doctor: Doctor | null = (data as any).doctor ?? null;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("Observation médicale");

  // shared states for tabs
  const [vitals, setVitals] = useState(initialVitals);
  const [parameters, setParameters] = useState(initialParams);
  const [observations, setObservations] = useState("");

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(
    () => ((data as any).prescriptions as Prescription[]) || []
  );

  /* ================= LOAD ================= */

  useEffect(() => {
    const appt = (data as any).appointments?.find((a: Appointment) => a.id === id) as
      | Appointment
      | undefined;
    if (!appt) return;

    const patient = (data as any).patients?.find((p: Patient) => p.id === appt.patient_id) as
      | Patient
      | undefined;

    setAppointment({ ...appt, patient });

    const found = (data as any).consultations?.find(
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
      prev.map((p) =>
        p.id === rx.id ? { ...p, drugs: [...p.drugs, { ...drug }] } : p
      )
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

  const TAB_BAR_HEIGHT = 60; // ✅ fixed height (no dynamic)

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.titleText}>CONSULTATION</Text>
          <View style={styles.titlePill}>
            <Text style={styles.titlePillText}>1/4</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => Alert.alert("Dernière visite", "Prototype")}>
          <Text style={styles.lastVisitText}>Dernière visite</Text>
        </TouchableOpacity>
      </View>

      {/* Main tabs (fixed height tiles) */}
      <View style={{ height: TAB_BAR_HEIGHT }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ height: TAB_BAR_HEIGHT }}
          contentContainerStyle={styles.tabsContainer}
        >
          {MAIN_TABS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveMainTab(t)}
              style={[
                styles.mainTab,
                { height: TAB_BAR_HEIGHT - 10 },
                activeMainTab === t && styles.mainTabActive,
              ]}
            >
              <Text style={[styles.mainTabText, activeMainTab === t && styles.mainTabTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
        {activeMainTab === "Observation médicale" && (
          <ObservationMedicalTab
            theme={theme}
            vitals={vitals}
            setVitals={setVitals}
            parameters={parameters}
            setParameters={setParameters}
            observations={observations}
            setObservations={setObservations}
            onSave={save}
          />
        )}

        {activeMainTab === "Ordonnances" && (
          <OrdonnancesTab
            theme={theme}
            currentPrescription={currentPrescription}
            signedBy={currentPrescription?.signed_by || doctor?.signature_numerique || "Médecin"}
            onAddDrug={addDrug}
          />
        )}

        {activeMainTab === "Bilans" && (
          <BilansTab theme={theme} consultationId={consultation!.id} patientId={appointment!.patient!.id} />
        )}

        {activeMainTab === "Lettres" && (
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

        {activeMainTab === "Maladies" && (
          <MaladiesTab theme={theme} initialDiagnosisCodes={consultation?.diagnosis || []} />
        )}

        {activeMainTab === "Symptômes" && <SymptomesTab theme={theme} />}

        {activeMainTab === "Documents" && (
          <DocumentsTab theme={theme} consultationId={consultation!.id} patientId={appointment!.patient!.id} />
        )}


        {activeMainTab === "Bilans" && <PlaceholderTab theme={theme} title="Bilans" />}
        {activeMainTab === "Lettres" && <PlaceholderTab theme={theme} title="Lettres" />}
        {activeMainTab === "Maladies" && <PlaceholderTab theme={theme} title="Maladies" />}
        {activeMainTab === "Symptômes" && <PlaceholderTab theme={theme} title="Symptômes" />}
        {activeMainTab === "Documents" && <PlaceholderTab theme={theme} title="Documents" />}

        <TouchableOpacity style={styles.backFooter} onPress={() => router.push("/visits")}>
          <Ionicons name="arrow-back-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.backFooterText]}>Retour aux visites</Text>
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

    tabsContainer: { paddingHorizontal: 12, alignItems: "stretch" },
    mainTab: {
      width: 200,
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      marginRight: 10,
      padding: 8,
      justifyContent: "flex-start",
      opacity: 0.55,
    },
    mainTabActive: { opacity: 1 },
    mainTabText: { color: "#fff", fontWeight: "900" },
    mainTabTextActive: { color: "#fff" },

    backFooter: {
      marginTop: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      paddingVertical: 10,
    },
    backFooterText: { color: theme.colors.primary, fontWeight: "900", marginLeft: 8 },
  });
