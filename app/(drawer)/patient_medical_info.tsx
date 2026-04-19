// pages/PatientMedicalDocument.tsx
import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";


interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number;
  sex: "male" | "female";
  marital_status?: "single" | "married" | "divorced";
  phone: string;
  email?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  place_of_birth?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

interface MedicalInfo {
  id: string;
  patient_id: string;
  height?: number;
  weight?: number;
  blood_type?: string;
  allergies?: string[];
  chronic_diseases?: string[];
  medications?: string[];
  disabilities?: string[];
  created_at: string;
  updated_at?: string;
}



export default function PatientMedicalDocument() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();

  const { theme } = useTheme();
  const { session } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientData = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://cxycroqsgmtasgibapen.functions.supabase.co/get-patient-medical?patient_id=${patientId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement des données");
      }

      setPatient(data.patient);
      setMedicalInfo(data.medical_info);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      Alert.alert("Erreur", "Impossible de charger les informations du patient");
    } finally {
      setIsLoading(false);
    }
  }, [patientId, session?.access_token]);

  useEffect(() => {
    if (!patientId) return;
    fetchPatientData();
  }, [fetchPatientData, patientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getSexLabel = (sex: "male" | "female") => {
    return sex === "male" ? "Masculin" : "Féminin";
  };

  const getMaritalStatusLabel = (status?: "single" | "married" | "divorced") => {
    if (!status) return "-";
    const labels = {
      single: "Célibataire",
      married: "Marié(e)",
      divorced: "Divorcé(e)",
    };
    return labels[status];
  };

  const getBMI = () => {
    if (!medicalInfo?.height || !medicalInfo?.weight) return null;
    const heightM = medicalInfo.height / 100;
    const bmi = medicalInfo.weight / (heightM * heightM);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Insuffisance pondérale", color: "#f59e0b" };
    if (bmi < 25) return { label: "Poids normal", color: "#10b981" };
    if (bmi < 30) return { label: "Surpoids", color: "#f59e0b" };
    return { label: "Obésité", color: "#ef4444" };
  };

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <TopBar theme={theme} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du dossier médical...</Text>
        </View>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.container}>
        <TopBar theme={theme} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Patient non trouvé</Text>
        </View>
      </View>
    );
  }

  const bmi = getBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <View style={styles.container}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Print Button */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Dossier Médical</Text>
            <Text style={styles.pageSubtitle}>Document confidentiel</Text>
          </View>
          <TouchableOpacity style={styles.printButton}>
            <Ionicons name="print" size={20} color="#fff" />
            <Text style={styles.printButtonText}>Imprimer</Text>
          </TouchableOpacity>
        </View>

        {/* Patient Identity Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Informations Personnelles</Text>
          </View>

          <View style={styles.patientHeader}>
            <Avatar
              firstName={patient.first_name}
              lastName={patient.last_name}
              size={80}
              borderRadius={16}
            />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {patient.last_name.toUpperCase()} {patient.first_name}
              </Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.infoText}>
                  {formatDate(patient.date_of_birth)} ({patient.age} ans)
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.infoText}>{patient.phone}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridContainer}>
            <InfoItem
              label="Sexe"
              value={getSexLabel(patient.sex)}
              icon="male-female"
              theme={theme}
            />
            <InfoItem
              label="État civil"
              value={getMaritalStatusLabel(patient.marital_status)}
              icon="heart"
              theme={theme}
            />
            <InfoItem
              label="Lieu de naissance"
              value={patient.place_of_birth || "-"}
              icon="location"
              theme={theme}
            />
            <InfoItem
              label="Email"
              value={patient.email || "-"}
              icon="mail"
              theme={theme}
            />
          </View>

          {(patient.address_street || patient.address_city || patient.address_state) && (
            <>
              <View style={styles.divider} />
              <View style={styles.addressSection}>
                <Text style={styles.sectionLabel}>Adresse</Text>
                <Text style={styles.addressText}>
                  {[patient.address_street, patient.address_city, patient.address_state]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Medical Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Informations Médicales</Text>
          </View>

          <View style={styles.gridContainer}>
            <MetricCard
              label="Taille"
              value={medicalInfo?.height ? `${medicalInfo.height} cm` : "-"}
              icon="resize"
              theme={theme}
            />
            <MetricCard
              label="Poids"
              value={medicalInfo?.weight ? `${medicalInfo.weight} kg` : "-"}
              icon="barbell"
              theme={theme}
            />
            <MetricCard
              label="Groupe sanguin"
              value={medicalInfo?.blood_type || "-"}
              icon="water"
              theme={theme}
              color="#ef4444"
            />
            {bmi && bmiCategory && (
              <MetricCard
                label="IMC"
                value={bmi}
                subtitle={bmiCategory.label}
                icon="analytics"
                theme={theme}
                color={bmiCategory.color}
              />
            )}
          </View>
        </View>

        {/* Allergies */}
        {medicalInfo?.allergies && medicalInfo.allergies.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning" size={24} color="#ef4444" />
              <Text style={[styles.cardTitle, { color: "#ef4444" }]}>Allergies</Text>
            </View>
            <View style={styles.tagContainer}>
              {medicalInfo.allergies.map((allergy, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: "#fee2e2" }]}>
                  <Text style={[styles.tagText, { color: "#991b1b" }]}>{allergy}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Chronic Diseases */}
        {medicalInfo?.chronic_diseases && medicalInfo.chronic_diseases.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="medkit" size={24} color="#f59e0b" />
              <Text style={styles.cardTitle}>Maladies Chroniques</Text>
            </View>
            <View style={styles.listContainer}>
              {medicalInfo.chronic_diseases.map((disease, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listText}>{disease}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Medications */}
        {medicalInfo?.medications && medicalInfo.medications.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flask" size={24} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Médications Actuelles</Text>
            </View>
            <View style={styles.listContainer}>
              {medicalInfo.medications.map((medication, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listText}>{medication}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Disabilities */}
        {medicalInfo?.disabilities && medicalInfo.disabilities.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="accessibility" size={24} color="#06b6d4" />
              <Text style={styles.cardTitle}>Handicaps / Limitations</Text>
            </View>
            <View style={styles.listContainer}>
              {medicalInfo.disabilities.map((disability, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listText}>{disability}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Emergency Contact */}
        {patient.emergency_contact_name && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="call" size={24} color="#ef4444" />
              <Text style={styles.cardTitle}>Contact d&apos;Urgence</Text>
            </View>
            <View style={styles.emergencyContact}>
              <Text style={styles.emergencyName}>{patient.emergency_contact_name}</Text>
              {patient.emergency_contact_relationship && (
                <Text style={styles.emergencyRelation}>
                  {patient.emergency_contact_relationship}
                </Text>
              )}
              {patient.emergency_contact_phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={16} color={theme.colors.primary} />
                  <Text style={styles.emergencyPhone}>{patient.emergency_contact_phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Insurance */}
        {patient.insurance_provider && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={styles.cardTitle}>Assurance</Text>
            </View>
            <View style={styles.insuranceInfo}>
              <Text style={styles.insuranceProvider}>{patient.insurance_provider}</Text>
              {patient.insurance_policy_number && (
                <Text style={styles.insurancePolicy}>N° {patient.insurance_policy_number}</Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Document généré le {formatDate(new Date().toISOString())}
          </Text>
          <Text style={styles.footerText}>Confidentiel - Usage médical uniquement</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper Components
const InfoItem = ({ label, value, icon, theme }: any) => (
  <View style={{ flex: 1, minWidth: 200 }}>
    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
      {label}
    </Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text style={{ fontSize: 15, color: theme.colors.text, fontWeight: "500" }}>{value}</Text>
    </View>
  </View>
);

const MetricCard = ({ label, value, subtitle, icon, theme, color }: any) => (
  <View
    style={{
      flex: 1,
      minWidth: 140,
      padding: 16,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }}
  >
    <Ionicons name={icon} size={24} color={color || theme.colors.primary} style={{ marginBottom: 8 }} />
    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>{label}</Text>
    <Text style={{ fontSize: 24, fontWeight: "700", color: theme.colors.text }}>{value}</Text>
    {subtitle && (
      <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 }}>
        {subtitle}
      </Text>
    )}
  </View>
);

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    },
    errorText: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.error,
    },
    scrollContent: {
      padding: 24,
      maxWidth: 1200,
      width: "100%",
      alignSelf: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    pageTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    pageSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    printButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },
    printButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.text,
    },
    patientHeader: {
      flexDirection: "row",
      gap: 20,
      marginBottom: 20,
    },
    patientInfo: {
      flex: 1,
      gap: 8,
    },
    patientName: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.text,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 20,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    addressSection: {
      marginTop: 8,
    },
    addressText: {
      fontSize: 15,
      color: theme.colors.text,
      lineHeight: 22,
    },
    tagContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    tagText: {
      fontSize: 14,
      fontWeight: "600",
    },
    listContainer: {
      gap: 12,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    bulletPoint: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
      marginTop: 7,
    },
    listText: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      lineHeight: 22,
    },
    emergencyContact: {
      gap: 8,
    },
    emergencyName: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
    },
    emergencyRelation: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emergencyPhone: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    insuranceInfo: {
      gap: 6,
    },
    insuranceProvider: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
    },
    insurancePolicy: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    footer: {
      marginTop: 40,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      alignItems: "center",
      gap: 4,
    },
    footerText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });
