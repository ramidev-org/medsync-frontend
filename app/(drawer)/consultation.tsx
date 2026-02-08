import { ThemedCard } from "@/components/default_card";
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import data from "@/data/preview_data.json";

// Types
interface Appointment {
  id: string;
  patient_id: string;
  time: string;
  status: string;
  type: string;
  notes: string;
  patient?: any;
}

interface Consultation {
  id: string;
  appointment_id: string;
  diagnosis: string[];
  observations: string;
  treatment_plan: string;
  follow_up: string;
  status: string;
}

export default function ConsultationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [observations, setObservations] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUp, setFollowUp] = useState("");

  useEffect(() => {
    const appt = data.appointments.find(a => a.id === id);
    if (!appt) return;
    const patient = data.patients.find(p => p.id === appt.patient_id);
    appt.patient = patient;
    setAppointment(appt);

    let existing = data.consultations.find(c => c.appointment_id === appt.id);
    if (!existing) {
      existing = {
        id: `c${data.consultations.length + 1}`,
        appointment_id: appt.id,
        diagnosis: [],
        observations: "",
        treatment_plan: "",
        follow_up: "",
        status: "open",
      };
      data.consultations.push(existing);
    }

    setConsultation(existing);
    setObservations(existing.observations);
    setDiagnosis(existing.diagnosis.join(","));
    setTreatmentPlan(existing.treatment_plan);
    setFollowUp(existing.follow_up);
  }, [id]);

  const saveConsultation = () => {
    if (!consultation || !appointment) return;

    consultation.observations = observations;
    consultation.diagnosis = diagnosis.split(",").map(d => d.trim());
    consultation.treatment_plan = treatmentPlan;
    consultation.follow_up = followUp;
    consultation.status = "closed";

    const appt = data.appointments.find(a => a.id === appointment.id);
    if (appt) appt.notes = observations;

    Alert.alert("Succès", "La consultation a été sauvegardée.");
    setConsultation({ ...consultation });
  };

  const styles = createStyles(theme);

  if (!appointment) return <Text>Rendez-vous introuvable</Text>;

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <TouchableOpacity
        style={{ margin: 16, flexDirection: "row", alignItems: "center", gap: 6 }}
        onPress={() => router.push("/visits")}  // ← navigate explicitly to VisitsPage}
      >
        <Ionicons name="arrow-back-outline" size={20} color={theme.colors.primary} />
        <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>Retour</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Patient Info */}
        <ThemedCard style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <Text style={styles.patientName}>
            {appointment.patient?.first_name} {appointment.patient?.last_name}
          </Text>
          <Text style={styles.patientInfo}>Téléphone: {appointment.patient?.phone || "-"}</Text>
          <Text style={styles.patientInfo}>Age: {appointment.patient?.age}</Text>
        </ThemedCard>

        {/* Consultation Form */}
        <ThemedCard>
          <Text style={styles.sectionTitle}>Consultation</Text>

          <Text style={styles.label}>Observations</Text>
          <TextInput
            style={styles.input}
            multiline
            value={observations}
            onChangeText={setObservations}
            placeholder="Entrez vos observations..."
          />

          <Text style={styles.label}>Diagnostic (ICD codes, séparés par virgule)</Text>
          <TextInput
            style={styles.input}
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="Ex: A00,B01"
          />

          <Text style={styles.label}>Plan de traitement</Text>
          <TextInput
            style={styles.input}
            multiline
            value={treatmentPlan}
            onChangeText={setTreatmentPlan}
            placeholder="Entrez le plan de traitement..."
          />

          <Text style={styles.label}>Suivi / Recommandations</Text>
          <TextInput
            style={styles.input}
            value={followUp}
            onChangeText={setFollowUp}
            placeholder="Ex: Rendez-vous dans 7 jours"
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveConsultation}>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Sauvegarder la consultation</Text>
          </TouchableOpacity>
        </ThemedCard>
      </ScrollView>

      
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
    patientName: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
    patientInfo: { fontSize: 13, color: "#6b7280", marginBottom: 2 },
    label: { fontSize: 13, fontWeight: "600", marginTop: 12, marginBottom: 6 },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      minHeight: 40,
      textAlignVertical: "top",
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 20,
      gap: 8,
    },
    saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  });
