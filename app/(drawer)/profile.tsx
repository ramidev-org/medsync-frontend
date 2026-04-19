import { ThemedCard } from "@/components/default_card";
import { TopBar } from "@/components/top_bar";
import { useAuth } from "@/contexts/auth_context";
import { useAppData } from "@/contexts/appData_context";
import { MOCK } from "@/data/mock";
import { specialityLabelFr, normalizeSpeciality } from "@/config/speciality";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// NOTE: This route is kept as "profile" for backward compatibility,
// but it behaves as a role-based Settings page.

export default function SettingsPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const { isClinicAdmin } = useAppData();
  const role = (user?.role as any) ?? "reception";

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Paramètres</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{role.toUpperCase()}</Text>
          </View>
        </View>

        {role === "doctor" && (
          <>
            <DoctorSettings theme={theme} />
            {isClinicAdmin && <ClinicAdminSettings theme={theme} />}
          </>
        )}
        {role === "reception" && <ReceptionSettings theme={theme} />}
      </ScrollView>
    </View>
  );
}

function DoctorSettings({ theme }: any) {
  const { user } = useAuth();
  const current = (user as any)?.doctorProfile?.speciality ?? "Médecine générale";

  const [fullname, setFullname] = useState(user?.fullname ?? "");
  const [speciality, setSpeciality] = useState(String(current));
  const [fee, setFee] = useState(String((user as any)?.doctorProfile?.consultation_fee ?? 2000));

  const key = normalizeSpeciality(speciality);

  return (
    <View style={{ gap: 16 }}>
      <ThemedCard style={{ padding: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
          Profil médecin
        </Text>
        <Text style={{ marginTop: 4, color: theme.colors.muted }}>
          Ces champs sont en mode prototype (démo)
        </Text>

        <Field label="Nom complet" value={fullname} onChangeText={setFullname} theme={theme} />
        <Field label="Spécialité" value={speciality} onChangeText={setSpeciality} theme={theme} />
        <Text style={{ marginTop: 6, color: theme.colors.muted, fontWeight: "700" }}>
          Détectée: {specialityLabelFr(key)}
        </Text>
        <Field label="Tarif consultation" value={fee} onChangeText={setFee} theme={theme} keyboardType="numeric" />

        <PrimaryButton label="Enregistrer" icon="save-outline" theme={theme} onPress={() => {}} />
      </ThemedCard>

      <ThemedCard style={{ padding: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
          Préférences
        </Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          <SettingRow label="Notifications" value="Activées" theme={theme} />
          <SettingRow label="Langue" value="Français" theme={theme} />
        </View>
      </ThemedCard>
    </View>
  );
}

function ReceptionSettings({ theme }: any) {
  const { user } = useAuth();
  const [department, setDepartment] = useState(
    String((user as any)?.receptionProfile?.department ?? "Accueil"),
  );
  const [shiftStart, setShiftStart] = useState(
    String((user as any)?.receptionProfile?.shift_start ?? "08:00"),
  );
  const [shiftEnd, setShiftEnd] = useState(
    String((user as any)?.receptionProfile?.shift_end ?? "16:00"),
  );

  return (
    <View style={{ gap: 16 }}>
      <ThemedCard style={{ padding: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
          Profil réception
        </Text>
        <Text style={{ marginTop: 4, color: theme.colors.muted }}>
          Ces champs sont en mode prototype (démo)
        </Text>

        <Field label="Département" value={department} onChangeText={setDepartment} theme={theme} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Début" value={shiftStart} onChangeText={setShiftStart} theme={theme} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Fin" value={shiftEnd} onChangeText={setShiftEnd} theme={theme} />
          </View>
        </View>
        <PrimaryButton label="Enregistrer" icon="save-outline" theme={theme} onPress={() => {}} />
      </ThemedCard>

      <ThemedCard style={{ padding: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
          Préférences
        </Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          <SettingRow label="Notifications" value="Activées" theme={theme} />
          <SettingRow label="Langue" value="Français" theme={theme} />
        </View>
      </ThemedCard>
    </View>
  );
}

function ClinicAdminSettings({ theme }: any) {
  const clinics = (MOCK as any).adminClinics ?? [];
  const [orgName, setOrgName] = useState("Mon Organisation");

  return (
    <View style={{ gap: 16 }}>
      <ThemedCard style={{ padding: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
          Organisation
        </Text>
        <Text style={{ marginTop: 4, color: theme.colors.muted }}>
          Paramètres admin clinique (prototype)
        </Text>
        <Field label="Nom" value={orgName} onChangeText={setOrgName} theme={theme} />
        <PrimaryButton label="Enregistrer" icon="save-outline" theme={theme} onPress={() => {}} />
      </ThemedCard>

      <ThemedCard style={{ padding: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
          Cliniques
        </Text>
        <Text style={{ marginTop: 4, color: theme.colors.muted }}>
          {clinics.length} clinique(s)
        </Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {clinics.slice(0, 4).map((c: any) => (
            <View
              key={c.id}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 14,
                padding: 14,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text style={{ fontWeight: "900", color: theme.colors.text }}>{c.name}</Text>
              <Text style={{ marginTop: 3, color: theme.colors.muted }}>{c.address}, {c.city}</Text>
            </View>
          ))}
        </View>
      </ThemedCard>
    </View>
  );
}

function Field({ label, value, onChangeText, theme, keyboardType }: any) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontWeight: "800", color: theme.colors.text, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: theme.colors.text,
        }}
      />
    </View>
  );
}

function SettingRow({ label, value, theme }: any) {
  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    }}>
      <Text style={{ fontWeight: "800", color: theme.colors.text }}>{label}</Text>
      <Text style={{ color: theme.colors.muted, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function PrimaryButton({ label, icon, onPress, theme }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        borderRadius: 14,
      }}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "900" }}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: {
      padding: 24,
      gap: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.colors.text,
    },
    rolePill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rolePillText: {
      fontWeight: "900",
      color: theme.colors.primary,
      fontSize: 12,
    },
  });
