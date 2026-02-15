// app/home_clinic.tsx   (or app/(drawer)/home_clinic.tsx)
import { db } from "@/database/database_conn";
import { IS_DEMO } from "@/config/runtime";
import { useTheme } from "@/theme/theme_provider";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeClinic() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { theme } = useTheme();

  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;

    const loadClinic = async () => {
      setLoading(true);

      if (IS_DEMO) {
        setClinic({
          id: clinicId,
          active: true,
          speciality: { name: "Médecine générale" },
          clinic: { name: "Cabinet Démo", city: "Alger", state: "Alger" },
          doctor: { full_name: "Dr Karim Boumediene" },
        });
        setLoading(false);
        return;
      }

      const { data, error } = await db
        .from("virtual_clinics")
        .select(`
          id,
          active,
          created_at,
          speciality: doctor_specialities ( name ),
          clinic: clinics ( name, city, state ),
          doctor: profiles ( full_name )
        `)
        .eq("id", clinicId)
        .single();

      if (error) {
        console.error("Clinic load error:", error);
      } else {
        setClinic(data);
      }

      setLoading(false);
    };

    loadClinic();
  }, [clinicId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!clinic) {
    return <Text style={{ padding: 24 }}>Clinic not found</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HERO */}
      <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.title, { color: theme.colors.surface }]}>
          {clinic.speciality.name} Clinic
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.surface }]}>
          {clinic.clinic.name} · {clinic.clinic.city}, {clinic.clinic.state}
        </Text>

        <View style={styles.heroRow}>
          <Text style={[styles.badge, { backgroundColor: theme.colors.surface }]}>
            {clinic.active ? "ACTIVE" : "INACTIVE"}
          </Text>

          {clinic.doctor && (
            <Text style={[styles.badge, { backgroundColor: theme.colors.surface }]}>
              Dr. {clinic.doctor.full_name}
            </Text>
          )}
        </View>
      </View>

      {/* STATS */}
      <View style={styles.cardsRow}>
        <StatCard label="Appointments" value={124} />
        <StatCard label="Today" value={8} />
        <StatCard label="Completed" value={96} />
        <StatCard label="Cancelled" value={12} />
      </View>
    </ScrollView>
  );
}

/* ===== SMALL COMPONENT ===== */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: { padding: 24, gap: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hero: { borderRadius: 20, padding: 24 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { marginTop: 6, fontSize: 16, opacity: 0.9 },
  heroRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "700",
  },
  cardsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: {
    width: "47%",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  cardValue: { fontSize: 28, fontWeight: "800" },
  cardLabel: { marginTop: 4, opacity: 0.7 },
});
