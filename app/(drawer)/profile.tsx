import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ProfilePage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user, refreshUser } = useAuth();
  const { clinic, isClinicAdmin } = useAppData();
  const router = useRouter();

  const [fullName, setFullName] = React.useState(user?.fullname ?? "");
  const [username, setUsername] = React.useState(user?.username ?? "");

  const [doctorSpeciality, setDoctorSpeciality] = React.useState(user?.doctorProfile?.speciality ?? "");
  const [doctorLicense, setDoctorLicense] = React.useState(user?.doctorProfile?.license_number ?? "");
  const [doctorYears, setDoctorYears] = React.useState(String(user?.doctorProfile?.years_of_experience ?? ""));
  const [doctorFee, setDoctorFee] = React.useState(String(user?.doctorProfile?.consultation_fee ?? ""));
  const [doctorBio, setDoctorBio] = React.useState(user?.doctorProfile?.bio ?? "");

  const [assistantDepartment, setAssistantDepartment] = React.useState(user?.assistantProfile?.department ?? "");
  const [assistantShiftStart, setAssistantShiftStart] = React.useState(user?.assistantProfile?.shift_start ?? "");
  const [assistantShiftEnd, setAssistantShiftEnd] = React.useState(user?.assistantProfile?.shift_end ?? "");

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setFullName(user?.fullname ?? "");
    setUsername(user?.username ?? "");
    setDoctorSpeciality(user?.doctorProfile?.speciality ?? "");
    setDoctorLicense(user?.doctorProfile?.license_number ?? "");
    setDoctorYears(String(user?.doctorProfile?.years_of_experience ?? ""));
    setDoctorFee(String(user?.doctorProfile?.consultation_fee ?? ""));
    setDoctorBio(user?.doctorProfile?.bio ?? "");
    setAssistantDepartment(user?.assistantProfile?.department ?? "");
    setAssistantShiftStart(user?.assistantProfile?.shift_start ?? "");
    setAssistantShiftEnd(user?.assistantProfile?.shift_end ?? "");
  }, [user]);

  const onSave = async () => {
    if (!user?.id) return;
    if (!fullName.trim()) {
      Alert.alert("Validation", "Full name is required.");
      return;
    }

    setSaving(true);
    try {
      await callRpc<boolean, Record<string, unknown>>("rpc_update_my_profile", {
        p_requester_id: user.id,
        p_full_name: fullName.trim(),
        p_username: username.trim() || null,
        p_doctor_speciality: doctorSpeciality.trim() || null,
        p_doctor_license_number: doctorLicense.trim() || null,
        p_doctor_years_of_experience: toIntOrNull(doctorYears),
        p_doctor_consultation_fee: toNumOrNull(doctorFee),
        p_doctor_bio: doctorBio.trim() || null,
        p_assistant_department: assistantDepartment.trim() || null,
        p_assistant_shift_start: assistantShiftStart.trim() || null,
        p_assistant_shift_end: assistantShiftEnd.trim() || null,
      });
      await refreshUser();
      Alert.alert("Saved", "Profile updated successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = (fullName || user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <PageShell title="Profile" subtitle="Identity, credentials, and role-specific details">
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <ThemedCard style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "U"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{fullName || "Unnamed user"}</Text>
            <Text style={styles.heroSub}>{user?.email || "-"}</Text>
            <View style={styles.badgeRow}>
              <Badge label={String(user?.user_type ?? "assistant").toUpperCase()} theme={theme} />
              {!!isClinicAdmin && <Badge label="CLINIC ADMIN" theme={theme} />}
              <Badge label={clinic?.name ? String(clinic.name) : "No Clinic"} theme={theme} />
            </View>
          </View>
        </ThemedCard>

        <ThemedCard style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Field label="Full Name" value={fullName} onChangeText={setFullName} theme={theme} />
          <Field label="Username" value={username} onChangeText={setUsername} theme={theme} />
          <Field label="Email (read-only)" value={user?.email ?? ""} onChangeText={() => {}} theme={theme} editable={false} />
        </ThemedCard>

        {user?.user_type === "doctor" ? (
          <ThemedCard style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor Details</Text>
            <Field label="Speciality" value={doctorSpeciality} onChangeText={setDoctorSpeciality} theme={theme} />
            <Field label="License Number" value={doctorLicense} onChangeText={setDoctorLicense} theme={theme} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label="Years of Experience" value={doctorYears} onChangeText={setDoctorYears} theme={theme} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Consultation Fee" value={doctorFee} onChangeText={setDoctorFee} theme={theme} keyboardType="numeric" />
              </View>
            </View>
            <Field label="Bio" value={doctorBio} onChangeText={setDoctorBio} theme={theme} multiline />
          </ThemedCard>
        ) : (
          <ThemedCard style={styles.section}>
            <Text style={styles.sectionTitle}>Assistant Details</Text>
            <Field label="Department" value={assistantDepartment} onChangeText={setAssistantDepartment} theme={theme} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label="Shift Start (HH:MM)" value={assistantShiftStart} onChangeText={setAssistantShiftStart} theme={theme} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Shift End (HH:MM)" value={assistantShiftEnd} onChangeText={setAssistantShiftEnd} theme={theme} />
              </View>
            </View>
          </ThemedCard>
        )}

        <ThemedCard style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.action} onPress={() => router.push("/settings")}>
            <Ionicons name="settings-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.actionText}>Open Settings</Text>
          </TouchableOpacity>
          {!!isClinicAdmin && (
            <TouchableOpacity style={styles.action} onPress={() => router.push("/users")}>
              <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.actionText}>Manage Team</Text>
            </TouchableOpacity>
          )}
        </ThemedCard>

        <TouchableOpacity disabled={saving} onPress={onSave} style={styles.saveBtn}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save Profile Changes"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </PageShell>
  );
}

function toNumOrNull(value: string) {
  const clean = String(value ?? "").trim();
  if (!clean) return null;
  const num = Number(clean);
  return Number.isFinite(num) ? num : null;
}

function toIntOrNull(value: string) {
  const clean = String(value ?? "").trim();
  if (!clean) return null;
  const num = Number(clean);
  return Number.isFinite(num) ? Math.round(num) : null;
}

function Badge({ label, theme }: { label: string; theme: any }) {
  return (
    <View style={{ borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800", fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  theme,
  editable = true,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: any;
  editable?: boolean;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ marginBottom: 6, color: theme.colors.textSecondary, fontWeight: "800" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          minHeight: multiline ? 88 : 44,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          backgroundColor: editable ? theme.colors.background : theme.colors.surfaceVariant,
          color: theme.colors.text,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontWeight: "700",
          textAlignVertical: multiline ? "top" : "center",
          opacity: editable ? 1 : 0.8,
        }}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    heroCard: { padding: 16, flexDirection: "row", gap: 12, alignItems: "center" },
    avatar: {
      width: 66,
      height: 66,
      borderRadius: 33,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    avatarText: { color: theme.colors.primary, fontWeight: "900", fontSize: 24 },
    heroName: { color: theme.colors.text, fontWeight: "900", fontSize: 18 },
    heroSub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700" },
    badgeRow: { marginTop: 8, flexDirection: "row", gap: 8, flexWrap: "wrap" },
    section: { padding: 16 },
    sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
    action: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.colors.background,
    },
    actionText: { color: theme.colors.text, fontWeight: "800" },
    saveBtn: {
      marginTop: 2,
      marginBottom: Platform.OS === "ios" ? 18 : 10,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    saveText: { color: "#fff", fontWeight: "900" },
  });

