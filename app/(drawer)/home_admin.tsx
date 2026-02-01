// app/(drawer)/HomeAdmin.tsx
import { TopBar } from "@/components/top_bar";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { createVirtualClinic, getDoctorsByAdmin, getVirtualClinics } from "@/services/admin.services";

import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function HomeAdmin() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const { user } = useAuth();
  const { specialities,clinic, loading: loadingSpecialities } = useAppData();

  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  /* ===== Dialog State ===== */
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [specialityId, setSpecialityId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ===== Load Clinics ===== */
  const loadClinics = async () => {
    setLoading(true);
    const data = await getVirtualClinics(user!.id);
    if (data) setClinics(data);
    setLoading(false);
  };

  /* ===== Load Doctors ===== */
  const loadDoctors = async () => {
    setLoadingDoctors(true);
    const data = await getDoctorsByAdmin(user!.id);
    if (data) setDoctors(data);
    setLoadingDoctors(false);
  };

  useEffect(() => {
    loadClinics();
    loadDoctors();
  }, []);

  /* ===== Create Clinic ===== */
  const createClinicHandler = async () => {
    if (!specialityId ) return;

    setSaving(true);

    const { error } = await createVirtualClinic({
      clinic_id: user!.clinic_id, // auto pick admin's clinic
      speciality_id: specialityId,
      doctor_id: doctorId!,
      created_by_admin: user!.id,
      active:active
    });

    setSaving(false);

    if (!error) {
      setNewClinicName("");
      setSpecialityId(null);
      setDoctorId(null);
      setActive(true);
      setDialogVisible(false);
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
            Choisissez votre cabinet ou créez-en un nouveau.
          </Text>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.colors.surface }]}
            onPress={() => setDialogVisible(true)}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.colors.surface }]}>
              ➕ Ajouter un cabinet
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ===== CABINETS ===== */}
        <View style={styles.cardsRow}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            clinics.map((clinic) => (
              <CabinetCard
                key={clinic.id}
                title={clinic.speciality?.name || "Spécialité inconnue"}    // show speciality
                subtitle={clinic.doctor?.profile?.full_name || "Aucun médecin"} // show doctor name
                icon="medkit"
                active={clinic.active}
                theme={theme}
                onOpen={() => router.push(`/home_clinic?clinicId=${clinic.id}`)}
              />
            ))

          )}
        </View>
      </ScrollView>

      {/* ===== CREATE VIRTUAL CLINIC DIALOG ===== */}
      <Modal transparent visible={dialogVisible} animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: theme.colors.text }]}>
              Ajouter un nouveau cabinet virtuel
            </Text>

            {/* ===== Speciality Dropdown ===== */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6, color: theme.colors.text }}>
                Spécialité
              </Text>
              <View style={styles.select}>
                {loadingSpecialities ? (
                  <Text>Chargement...</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 160 }}>
                    {specialities.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.selectItem,
                          specialityId === s.id && { backgroundColor: theme.colors.primary + "20" },
                        ]}
                        onPress={() => setSpecialityId(s.id)}
                      >
                        <Text style={{ color: theme.colors.text }}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* ===== Doctor Dropdown ===== */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6, color: theme.colors.text }}>
                Médecin (optionnel)
              </Text>
              <View style={styles.select}>
                {loadingDoctors ? (
                  <Text>Chargement...</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 160 }}>
                    {doctors.map((d) => (
                      <TouchableOpacity
                        key={d.profile.id}
                        style={[
                          styles.selectItem,
                          doctorId === d.profile.id && { backgroundColor: theme.colors.primary + "20" },
                        ]}
                        onPress={() => setDoctorId(d.profile.id)}
                      >
                        <Text style={{ color: theme.colors.text }}>{d.profile.full_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* ===== Active Toggle ===== */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
              <Text style={{ color: theme.colors.text, fontWeight: "600", marginRight: 8 }}>
                Actif
              </Text>
              <Switch
                value={active}
                onValueChange={setActive}
                thumbColor={active ? theme.colors.primary : "#ccc"}
                trackColor={{ false: "#ccc", true: theme.colors.primary + "50" }}
              />
            </View>

            {/* ===== Dialog Actions ===== */}
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.colors.primary }]}
                onPress={() => {
                  setDialogVisible(false);
                  setNewClinicName("");
                  setSpecialityId(null);
                  setDoctorId(null);
                  setActive(true);
                }}
              >
                <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.colors.primary }]}
                onPress={createClinicHandler}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text style={{ color: theme.colors.surface, fontWeight: "700" }}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  /* ===== CARD ===== */
  function CabinetCard({ title, subtitle, icon, active, theme, onOpen }: any) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.cardIcon, { backgroundColor: theme.colors.accent }]}>
          <Ionicons name={icon} size={26} color={theme.colors.primary} />
        </View>

        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={{ color: theme.colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>

        <View
          style={[
            styles.status,
            { backgroundColor: active ? theme.colors.statusActive : theme.colors.statusInactive },
          ]}
        >
          <Text style={styles.statusText}>{active ? "ACTIF" : "INACTIF"}</Text>
        </View>

        <TouchableOpacity style={[styles.cardBtn, { backgroundColor: theme.colors.primary }]} onPress={onOpen}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Ouvrir</Text>
        </TouchableOpacity>
      </View>
    );
  }

}

/* ===== STYLES ===== */
const getStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: { padding: 24, gap: 24 },
    hero: { borderRadius: 16, padding: 32 },
    welcome: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
    brand: { color: "#fff", fontSize: 32, fontWeight: "800" },
    subtitle: { color: "rgba(255,255,255,0.9)", marginTop: 8 },
    secondaryBtn: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 999,
      borderWidth: 2,
      alignSelf: "flex-start",
    },
    secondaryBtnText: { fontWeight: "700" },
    cardsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    card: { width: "31.5%", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
    cardIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
    cardTitle: { fontWeight: "700", marginTop: 12 },
    status: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginTop: 10 },
    statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },

    cardBtn: { marginTop: 16, borderRadius: 999, paddingVertical: 10, alignItems: "center" },

    /* Dialog */
    dialogOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
    dialog: { width: 360, borderRadius: 16, padding: 24 },
    dialogTitle: { fontSize: 18, fontWeight: "800" },
    input: { marginTop: 16, borderWidth: 1, borderRadius: 12, padding: 12 },
    dialogActions: { flexDirection: "row", gap: 12, marginTop: 20, justifyContent: "flex-end" },
    cancelBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1 },
    confirmBtn: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999 },
    select: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 8 },
    selectItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  });
