import { ThemedCard } from "@/components/common/default_card";
import { PageShell } from "@/components/layout/page_shell";
import { DEFAULT_AVATAR_COLOR, UserAvatar, normalizeAvatarColor } from "@/components/common/user_avatar";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";

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
  const [avatarColor, setAvatarColor] = React.useState(user?.avatarColor ?? DEFAULT_AVATAR_COLOR);

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
  const [colorDialogOpen, setColorDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setFullName(user?.fullname ?? "");
    setUsername(user?.username ?? "");
    setAvatarColor(user?.avatarColor ?? DEFAULT_AVATAR_COLOR);
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
        p_avatar_color: normalizeAvatarColor(avatarColor),
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

  return (
    <PageShell>
      <ScrollView contentContainerStyle={styles.pageContent}>
        <ThemedCard style={styles.layoutCard}>
          <View style={styles.profileHeader}>
            <View style={[styles.identityRow, isCompact && styles.identityRowStack]}>
              <View style={styles.identityMain}>
                <UserAvatar name={fullName || user?.email || "User"} avatarColor={avatarColor} size={92} />
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
                    <Text style={styles.colorLabel}>Avatar Color</Text>
                    <TouchableOpacity
                      onPress={() => isEditing && setColorDialogOpen(true)}
                      disabled={!isEditing}
                      style={[styles.colorPickerCard, !isEditing && styles.colorPickerCardDisabled]}
                    >
                      <View style={[styles.colorPreview, { backgroundColor: normalizeAvatarColor(avatarColor) }]} />
                      <View style={styles.colorPickerTextWrap}>
                        <Text style={styles.colorValue}>{normalizeAvatarColor(avatarColor)}</Text>
                        <Text style={styles.colorHelper}>Open color picker to choose your avatar style.</Text>
                      </View>
                      <Ionicons name="color-palette-outline" size={18} color="#2563EB" />
                    </TouchableOpacity>
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
      <Modal visible={colorDialogOpen} transparent animationType="fade" onRequestClose={() => setColorDialogOpen(false)}>
        <Pressable style={styles.dialogBackdrop} onPress={() => setColorDialogOpen(false)}>
          <Pressable style={styles.dialogCard} onPress={() => {}}>
            <View style={styles.dialogHeader}>
              <View>
                <Text style={styles.dialogTitle}>Choose Avatar Color</Text>
                <Text style={styles.dialogSub}>Pick the color that should represent you across the app.</Text>
              </View>
              <TouchableOpacity onPress={() => setColorDialogOpen(false)} style={styles.dialogCloseBtn}>
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dialogPreviewRow}>
              <UserAvatar name={fullName || user?.email || "User"} avatarColor={avatarColor} size={62} />
              <View style={styles.dialogPreviewCopy}>
                <Text style={styles.dialogPreviewLabel}>Selected color</Text>
                <Text style={styles.dialogPreviewValue}>{normalizeAvatarColor(avatarColor)}</Text>
              </View>
            </View>

            <View style={styles.colorGrid}>
              {AVATAR_COLOR_PRESETS.map((color) => {
                const active = normalizeAvatarColor(avatarColor) === color;
                return (
                  <TouchableOpacity
                    key={color}
                    onPress={() => {
                      setAvatarColor(color);
                      setColorDialogOpen(false);
                    }}
                    style={[
                      styles.colorGridItem,
                      { backgroundColor: color, borderColor: active ? "#0F172A" : "#D6E3F7" },
                    ]}
                  >
                    {active ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </PageShell>
  );
}

function TabButton({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={[{ paddingVertical: 12, marginRight: 22, borderBottomWidth: 2 }, active ? { borderBottomColor: "#2563EB" } : { borderBottomColor: "transparent" }]}>
      <Text style={[{ fontWeight: "600", fontSize: 12 }, active ? { color: "#1D4ED8" } : { color: "#64748B" }]}>{label}</Text>
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
      <Text style={{ color: "#1E40AF", fontWeight: "700", fontSize: 11 }}>{label}</Text>
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
      <Text style={{ marginBottom: 6, color: theme.colors.textSecondary, fontWeight: "600" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize="characters"
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

const AVATAR_COLOR_PRESETS = [
  "#2DA8D8",
  "#1D4ED8",
  "#0891B2",
  "#38BDF8",
  "#0EA5E9",
  "#06B6D4",
  "#2563EB",
  "#3B82F6",
  "#0F766E",
  "#14B8A6",
  "#22C55E",
  "#84CC16",
  "#F59E0B",
  "#7C3AED",
  "#A855F7",
  "#EC4899",
  "#EA580C",
  "#EF4444",
  "#64748B",
];

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
    editProfileText: { color: "#1D4ED8", fontWeight: "600", fontSize: 12 },
    iconEditBtnActive: {
      borderColor: "#1D4ED8",
      backgroundColor: "#2563EB",
    },
    heroName: { color: "#0F172A", fontWeight: "700", fontSize: 24 },
    heroSub: { marginTop: 3, color: "#5B708E", fontWeight: "700" },
    badgeRow: { marginTop: 8, flexDirection: "row", gap: 8, flexWrap: "wrap" },
    quickActionBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
    quickActionText: { color: theme.colors.text, fontWeight: "700", fontSize: 13 },
    tabsBar: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
    tabPanel: { paddingHorizontal: 28, paddingTop: 22, paddingBottom: 26, backgroundColor: "#FFFFFF", minHeight: 420 },
    sectionTitle: { color: theme.colors.text, fontWeight: "700", fontSize: 22, marginBottom: 12 },
    row: { flexDirection: "row", gap: 16, flexWrap: "nowrap" },
    rowStack: { flexDirection: "column", gap: 0 },
    fieldCol: { flex: 1, minWidth: 0 },
    colorLabel: { marginTop: 12, marginBottom: 6, color: theme.colors.textSecondary, fontWeight: "600" },
    colorPickerCard: {
      minHeight: 56,
      borderWidth: 1,
      borderColor: "#A9CBFF",
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    colorPickerCardDisabled: {
      backgroundColor: "#F8FAFC",
      borderColor: theme.colors.border,
      opacity: 0.8,
    },
    colorPreview: {
      width: 34,
      height: 34,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: "rgba(15, 23, 42, 0.12)",
    },
    colorPickerTextWrap: { flex: 1 },
    colorValue: { color: theme.colors.text, fontWeight: "700", fontSize: 14 },
    colorHelper: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    dialogBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.42)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    dialogCard: {
      width: "100%",
      maxWidth: 520,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "#D6E3F7",
      backgroundColor: "#FFFFFF",
      padding: 20,
    },
    dialogHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
    dialogTitle: { color: theme.colors.text, fontWeight: "700", fontSize: 20 },
    dialogSub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 },
    dialogCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#D6E3F7",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F8FBFF",
    },
    dialogPreviewRow: {
      marginTop: 18,
      marginBottom: 18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#D6E3F7",
      backgroundColor: "#F8FBFF",
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    dialogPreviewCopy: { flex: 1 },
    dialogPreviewLabel: { color: theme.colors.textSecondary, fontWeight: "600", fontSize: 12 },
    dialogPreviewValue: { marginTop: 4, color: theme.colors.text, fontWeight: "700", fontSize: 16 },
    colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    colorGridItem: {
      width: 54,
      height: 54,
      borderRadius: 16,
      borderWidth: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    settingsGrid: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
    settingsBox: { borderWidth: 1, borderColor: "#D9E7FF", borderRadius: 8, padding: 14, backgroundColor: "#F8FBFF", marginTop: 4, minWidth: 240, flex: 1 },
    settingsTitle: { color: theme.colors.text, fontWeight: "700", fontSize: 13, marginBottom: 4 },
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
    topActionText: { fontWeight: "700", fontSize: 12 },
    actionGhost: { borderColor: "#A9CBFF", backgroundColor: "#FFFFFF" },
    actionPrimary: { borderColor: "#1D4ED8", backgroundColor: "#2563EB" },
  });

