import { ThemedCard } from "@/components/default_card";
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Mock JSON import
import doctorData from "@/data/preview_data.json";

interface Availability {
  jour: string;
  de: string;
  a: string;
}

interface Doctor {
  id: string;
  nom_complet: string;
  specialite: string;
  tarif_consultation: number;
  disponibilite: Availability[];
  signature_numerique: string;
  avatar?: string;
}

export default function DoctorProfilePage() {
  const { theme } = useTheme();
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    setDoctor(doctorData.doctor);
  }, []);

  const handleChange = (field: keyof Doctor, value: any) => {
    if (!doctor) return;
    setDoctor({ ...doctor, [field]: value });
  };

  const handleSave = () => {
    console.log("Saving doctor profile:", doctor);
    alert("Profil sauvegardé (mockup)");
  };

  if (!doctor) return null;

  const styles = createStyles(theme);

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View style={styles.container}>
          {/* Left Column: Avatar + Save */}
          <ThemedCard style={styles.leftCard}>
            <Image
              source={{ uri: doctor.avatar || "https://i.pravatar.cc/100" }}
              style={styles.avatar}
            />
            <Text style={styles.doctorName}>{doctor.nom_complet}</Text>
            <Text style={styles.doctorSpecialty}>{doctor.specialite}</Text>
            <Text style={styles.signature}>Signature: {doctor.signature_numerique}</Text>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveText}>Enregistrer</Text>
            </TouchableOpacity>
          </ThemedCard>

          {/* Right Column: Info + Availability */}
          <View style={styles.rightColumn}>
            {/* Profile Info */}
            <ThemedCard style={styles.card}>
              <Text style={styles.sectionTitle}>Informations</Text>

              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={styles.input}
                value={doctor.nom_complet}
                onChangeText={(text) => handleChange("nom_complet", text)}
              />

              <Text style={styles.label}>Spécialité</Text>
              <TextInput
                style={styles.input}
                value={doctor.specialite}
                onChangeText={(text) => handleChange("specialite", text)}
              />

              <Text style={styles.label}>Tarif consultation</Text>
              <TextInput
                style={styles.input}
                value={doctor.tarif_consultation.toString()}
                keyboardType="numeric"
                onChangeText={(text) => handleChange("tarif_consultation", Number(text))}
              />

              <Text style={styles.label}>Signature numérique</Text>
              <TextInput
                style={styles.input}
                value={doctor.signature_numerique}
                onChangeText={(text) => handleChange("signature_numerique", text)}
              />
            </ThemedCard>

            {/* Availability */}
            <ThemedCard style={styles.card}>
              <Text style={styles.sectionTitle}>Disponibilités</Text>
              {doctor.disponibilite.map((d, idx) => (
                <View key={idx} style={styles.availabilityRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={d.jour}
                    onChangeText={(text) => {
                      const dispo = [...doctor.disponibilite];
                      dispo[idx].jour = text;
                      handleChange("disponibilite", dispo);
                    }}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={d.de}
                    onChangeText={(text) => {
                      const dispo = [...doctor.disponibilite];
                      dispo[idx].de = text;
                      handleChange("disponibilite", dispo);
                    }}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={d.a}
                    onChangeText={(text) => {
                      const dispo = [...doctor.disponibilite];
                      dispo[idx].a = text;
                      handleChange("disponibilite", dispo);
                    }}
                  />
                </View>
              ))}
            </ThemedCard>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: { flexDirection: "row", gap: 16 },

    leftCard: {
      padding: 20,
      width: 300,
      alignItems: "center",
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
    },
    doctorName: { fontSize: 20, fontWeight: "700", marginBottom: 4, textAlign: "center" },
    doctorSpecialty: { fontSize: 16, color: theme.colors.primary, marginBottom: 4, textAlign: "center" },
    signature: { fontSize: 16, color: "#6b7280", marginBottom: 16, textAlign: "center" },

    rightColumn: { flex: 1, flexDirection: "column", gap: 16 },

    card: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
    label: { fontSize: 14, fontWeight: "500", marginTop: 12, marginBottom: 4 },
    input: {
      backgroundColor: theme.colors.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      fontSize: 14,
      marginBottom: 8,
    },
    availabilityRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      padding: 12,
      borderRadius: 12,
      gap: 8,
    },
    saveText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  });
