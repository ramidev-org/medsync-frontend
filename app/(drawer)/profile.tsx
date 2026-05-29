import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";

export default function ProfilePage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user, refreshUser } = useAuth();
  const { clinic, isClinicAdmin } = useAppData();
  const [isEditing, setIsEditing] = React.useState(false);
  const { width } = useWindowDimensions();
  const isCompact = width < 760;

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
  const [activeTab, setActiveTab] = React.useState<"personal" | "doctor" | "account">("personal");

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
      setIsEditing(false);
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
    <PageShell>
      <ScrollView contentContainerStyle={styles.pageContent}>
        <ThemedCard style={styles.layoutCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.identityRow, isCompact && styles.identityRowStack]}>
              <View style={styles.identityMain}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials || "U"}</Text>
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.heroName}>{fullName || "Unnamed user"}</Text>
                  <Text style={styles.heroSub}>{user?.email || "-"}</Text>
                  <View style={styles.badgeRow}>
                    <Badge label={String(user?.user_type ?? "assistant").toUpperCase()} theme={theme} />
                    {!!isClinicAdmin && <Badge label="CLINIC ADMIN" theme={theme} />}
                    <Badge label={clinic?.name ? String(clinic.name) : "No Clinic"} theme={theme} />
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsEditing((v) => !v)} style={[styles.editProfileBtn, isEditing && styles.iconEditBtnActive]}>
                <Ionicons name={isEditing ? "close" : "create-outline"} size={14} color={isEditing ? "#FFFFFF" : theme.colors.primary} />
                <Text style={[styles.editProfileText, isEditing && { color: "#FFFFFF" }]}>{isEditing ? "Close edit" : "Edit profile"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabsBar}>
              <TabButton active={activeTab === "personal"} onPress={() => setActiveTab("personal")} label="Personal details" />
              <TabButton active={activeTab === "doctor"} onPress={() => setActiveTab("doctor")} label={user?.user_type === "doctor" ? "Doctor details" : "Assistant details"} />
              <TabButton active={activeTab === "account"} onPress={() => setActiveTab("account")} label="Account settings" />
            </View>
          </View>

          <View style={styles.tabPanel}>
            {activeTab === "personal" && (
              <>
                <Text style={styles.sectionTitle}>Personal Details</Text>
                <View style={[styles.row, isCompact && styles.rowStack]}>
                  <View style={styles.fieldCol}>
                    <Field label="Full Name" value={fullName} onChangeText={setFullName} theme={theme} editable={isEditing} />
                  </View>
                  <View style={styles.fieldCol}>
                    <Field label="Username" value={username} onChangeText={setUsername} theme={theme} editable={isEditing} />
                  </View>
                </View>
                <View style={[styles.row, isCompact && styles.rowStack]}>
                  <View style={styles.fieldCol}>
                    <Field label="Email Address" value={user?.email ?? ""} onChangeText={() => {}} theme={theme} editable={false} />
                  </View>
                  <View style={styles.fieldCol}>
                    <Field label="Clinic" value={clinic?.name ? String(clinic.name) : "No Clinic"} onChangeText={() => {}} theme={theme} editable={false} />
                  </View>
                </View>
              </>
            )}

            {activeTab === "doctor" && user?.user_type === "doctor" && (
              <>
                <Text style={styles.sectionTitle}>Doctor Details</Text>
                <View style={[styles.row, isCompact && styles.rowStack]}>
                  <View style={styles.fieldCol}>
                    <Field label="Speciality" value={doctorSpeciality} onChangeText={setDoctorSpeciality} theme={theme} editable={isEditing} />
                  </View>
                  <View style={styles.fieldCol}>
                    <Field label="License Number" value={doctorLicense} onChangeText={setDoctorLicense} theme={theme} editable={isEditing} />
                  </View>
                </View>
                <View style={[styles.row, isCompact && styles.rowStack]}>
                  <View style={styles.fieldCol}>
                    <Field label="Years of Experience" value={doctorYears} onChangeText={setDoctorYears} theme={theme} keyboardType="numeric" editable={isEditing} />
                  </View>
                  <View style={styles.fieldCol}>
                    <Field label="Consultation Fee" value={doctorFee} onChangeText={setDoctorFee} theme={theme} keyboardType="numeric" editable={isEditing} />
                  </View>
                </View>
                <Field label="Bio" value={doctorBio} onChangeText={setDoctorBio} theme={theme} multiline editable={isEditing} />
              </>
            )}

            {activeTab === "doctor" && user?.user_type !== "doctor" && (
              <>
                <Text style={styles.sectionTitle}>Assistant Details</Text>
                <View style={[styles.row, isCompact && styles.rowStack]}>
                  <View style={styles.fieldCol}>
                    <Field label="Department" value={assistantDepartment} onChangeText={setAssistantDepartment} theme={theme} editable={isEditing} />
                  </View>
                  <View style={styles.fieldCol}>
                    <Field label="Shift Start (HH:MM)" value={assistantShiftStart} onChangeText={setAssistantShiftStart} theme={theme} editable={isEditing} />
                  </View>
                </View>
                <View style={[styles.row, isCompact && styles.rowStack]}>
                  <View style={styles.fieldCol}>
                    <Field label="Shift End (HH:MM)" value={assistantShiftEnd} onChangeText={setAssistantShiftEnd} theme={theme} editable={isEditing} />
                  </View>
                </View>
              </>
            )}

            {activeTab === "account" && (
              <>
                <Text style={styles.sectionTitle}>Account settings</Text>
                <View style={styles.settingsGrid}>
                  <View style={styles.settingsBox}>
                    <Text style={styles.settingsTitle}>Security</Text>
                    <TouchableOpacity style={styles.quickActionBtn}>
                      <Ionicons name="lock-closed-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.quickActionText}>Change Password</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.settingsBox}>
                    <Text style={styles.settingsTitle}>Danger zone</Text>
                    <TouchableOpacity style={styles.quickActionBtn}>
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                      <Text style={[styles.quickActionText, { color: "#DC2626" }]}>Remove account</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {isEditing && (
              <View style={styles.footerActions}>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={[styles.topAction, styles.actionGhost]}>
                  <Text style={[styles.topActionText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={saving} onPress={onSave} style={[styles.topAction, styles.actionPrimary, saving && { opacity: 0.7 }]}>
                  <Text style={[styles.topActionText, { color: theme.colors.textOnPrimary }]}>{saving ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ThemedCard>
      </ScrollView>
    </PageShell>
  );
}

function TabButton({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={[{ paddingVertical: 12, marginRight: 22, borderBottomWidth: 2 }, active ? { borderBottomColor: "#2563EB" } : { borderBottomColor: "transparent" }]}>
      <Text style={[{ fontWeight: "800", fontSize: 12 }, active ? { color: "#1D4ED8" } : { color: "#64748B" }]}>{label}</Text>
    </TouchableOpacity>
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
    <View style={{ borderWidth: 1, borderColor: "#A9CBFF", backgroundColor: "#EDF4FF", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: "#1E40AF", fontWeight: "900", fontSize: 11 }}>{label}</Text>
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
          minHeight: multiline ? 96 : 44,
          borderWidth: 1,
          borderColor: editable ? "#A9CBFF" : theme.colors.border,
          borderRadius: 6,
          backgroundColor: editable ? "#FFFFFF" : "#F8FAFC",
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
    pageContent: { paddingBottom: 24 },
    layoutCard: {
      padding: 0,
      borderWidth: 1,
      borderColor: "#D6E3F7",
      backgroundColor: "#FFFFFF",
      overflow: "hidden",
      minHeight: 620,
    },
    profileHeader: {
      paddingHorizontal: 28,
      paddingTop: 24,
      borderBottomWidth: 1,
      borderBottomColor: "#E2E8F0",
      backgroundColor: "#FFFFFF",
    },
    identityRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
    identityRowStack: { flexDirection: "column", alignItems: "stretch" },
    identityMain: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
    identityText: { flex: 1, paddingBottom: 4 },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#E8F1FF",
      borderWidth: 1,
      borderColor: "#A9CBFF",
    },
    editProfileBtn: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#A9CBFF",
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    editProfileText: { color: "#1D4ED8", fontWeight: "800", fontSize: 12 },
    iconEditBtnActive: {
      borderColor: "#1D4ED8",
      backgroundColor: "#2563EB",
    },
    avatarText: { color: theme.colors.primary, fontWeight: "900", fontSize: 28 },
    heroName: { color: "#0F172A", fontWeight: "900", fontSize: 24 },
    heroSub: { marginTop: 3, color: "#5B708E", fontWeight: "700" },
    badgeRow: { marginTop: 8, flexDirection: "row", gap: 8, flexWrap: "wrap" },
    quickActionBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
    quickActionText: { color: theme.colors.text, fontWeight: "700", fontSize: 13 },
    tabsBar: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
    tabPanel: { paddingHorizontal: 28, paddingTop: 22, paddingBottom: 26, backgroundColor: "#FFFFFF", minHeight: 420 },
    sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 22, marginBottom: 12 },
    row: { flexDirection: "row", gap: 16, flexWrap: "nowrap" },
    rowStack: { flexDirection: "column", gap: 0 },
    fieldCol: { flex: 1, minWidth: 0 },
    settingsGrid: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
    settingsBox: { borderWidth: 1, borderColor: "#D9E7FF", borderRadius: 8, padding: 14, backgroundColor: "#F8FBFF", marginTop: 4, minWidth: 240, flex: 1 },
    settingsTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13, marginBottom: 4 },
    footerActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 18 },
    topAction: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    topActionText: { fontWeight: "900", fontSize: 12 },
    actionGhost: { borderColor: "#A9CBFF", backgroundColor: "#FFFFFF" },
    actionPrimary: { borderColor: "#1D4ED8", backgroundColor: "#2563EB" },
  });

