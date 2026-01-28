// app/(drawer)/HomeAdmin.tsx
import { TopBar } from "@/components/top_bar";
import { db } from "@/database/database_conn";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeAdmin() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();

  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for creating new clinic
  const [modalVisible, setModalVisible] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");

  // Load all virtual clinics
  const loadClinics = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("virtual_clinics")
      .select(`
        id,
        name,
        active,
        speciality_id,
        speciality: doctor_specialities(name)
      `)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setClinics(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClinics();
  }, []);

  // Create new clinic
  const createClinic = async () => {
    if (!newClinicName.trim()) {
      Alert.alert("Erreur", "Le nom du cabinet ne peut pas être vide.");
      return;
    }

    const { data, error } = await db
      .from("virtual_clinics")
      .insert({ name: newClinicName, active: true })
      .select()
      .single();

    if (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de créer le cabinet.");
    } else {
      Alert.alert("Succès", "Cabinet créé !");
      setNewClinicName("");
      setModalVisible(false);
      loadClinics();
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== HERO ===== */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.hero}
        >
          <Text style={styles.welcome}>BIENVENUE SUR VOTRE</Text>
          <Text style={styles.brand}>MEDSIGN CARE</Text>
          <Text style={styles.subtitle}>
            Choisissez votre cabinet parmi les cabinets ci-dessous ou ajoutez-en
            un autre.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderWidth: 2, borderColor: theme.colors.surface }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.colors.surface }]}>
                Ajouter un Cabinet
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ===== CABINETS ===== */}
        <View style={styles.cardsRow}>
          {loading ? (
            <Text>Loading clinics...</Text>
          ) : (
            clinics.map((clinic) => (
              <CabinetCard
                key={clinic.id}
                title={clinic.name}
                icon="medkit"
                active={clinic.active}
                theme={theme}
                onOpen={() => router.push(`/home_clinic?clinicId=${clinic.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ===== CREATE CLINIC MODAL ===== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Ajouter un nouveau cabinet
            </Text>
            <TextInput
              placeholder="Nom du cabinet"
              value={newClinicName}
              onChangeText={setNewClinicName}
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            />

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
                onPress={createClinic}
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.surface }]}>Créer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.primary }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  /* ================= CARD ================= */
  function CabinetCard({
    title,
    icon,
    active,
    theme,
    onOpen,
  }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    active?: boolean;
    theme: any;
    onOpen: () => void;
  }) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.cardIcon, { backgroundColor: theme.colors.accent }]}>
          <Ionicons name={icon} size={28} color={theme.colors.primary} />
        </View>

        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>

        <View
          style={[
            styles.status,
            { backgroundColor: active ? theme.colors.statusActive : theme.colors.statusInactive },
          ]}
        >
          <Text style={styles.statusText}>{active ? "ACTIF" : "INACTIF"}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.cardBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }]}
            onPress={onOpen}
          >
            <Text style={[styles.cardBtnText, { color: theme.colors.surface }]}>Ouvrir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

/* ================= STYLES ================= */
const getStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
      gap: 24,
    },
    hero: {
      borderRadius: 16,
      padding: 32,
      overflow: "hidden",
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    welcome: { fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
    brand: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4, letterSpacing: 1 },
    subtitle: { fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.9)", marginTop: 8 },
    heroButtons: { flexDirection: "row", gap: 12, marginTop: 20 },
    secondaryBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
    secondaryBtnText: { fontWeight: "700", fontSize: 15 },
    cardsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 8 },
    card: { borderRadius: 16, padding: 20, width: "31.5%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: theme.colors.border },
    cardTitle: { fontWeight: "700", marginTop: 12, fontSize: 16 },
    cardIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
    status: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 12 },
    statusText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
    cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 8 },
    cardBtn: { flex: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, alignItems: "center" },
    cardBtnText: { fontWeight: "700", fontSize: 13 },
    iconBtn: { padding: 8, borderRadius: 999, alignItems: "center", justifyContent: "center" },
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    modalContainer: { width: "80%", padding: 24, borderRadius: 16 },
    modalTitle: { fontSize: 18, fontWeight: "700" },
    input: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: "center" },
    modalBtnText: { fontWeight: "700", fontSize: 15 },
  });
