// app/screens/HomeClinic.tsx
import { db } from "@/database/database_conn";
import { useTheme } from "@/theme/theme_provider";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeClinic({ virtualClinicId }: { virtualClinicId: string }) {
  const { theme } = useTheme();
  const [clinic, setClinic] = useState<any>(null);

  useEffect(() => {
    const loadClinic = async () => {
      const { data, error } = await db
        .from("virtual_clinics")
        .select(`
            id,
            speciality_id,
            speciality: doctor_specialities(name),
            clinic: clinics(name, state, city)
        `)
        .eq("id", virtualClinicId)
        .maybeSingle();

        if (error) {
        console.error(error);
        } else if (!data) {
        console.warn("No clinic found for this user");
        } else {
        setClinic(data);
        }

    };

    loadClinic();
  }, [virtualClinicId]);

  if (!clinic) return <Text>Loading your clinic...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.title, { color: theme.colors.surface }]}>
          {clinic.speciality.name} Clinic
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.surface }]}>
          Main Clinic: {clinic.clinic.name} ({clinic.clinic.city}, {clinic.clinic.state})
        </Text>
      </View>

      <View style={styles.cardsRow}>
        <Text>Appointments, Visits, Payments...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 24 },
  hero: { borderRadius: 16, padding: 24 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 16, marginTop: 8 },
  cardsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 16 },
});
