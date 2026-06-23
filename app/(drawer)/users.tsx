import { PageShell } from "@/components/page_shell";
import { UserAvatar } from "@/components/user_avatar";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { db } from "@/database/database_conn";
import { callRpc } from "@/services/backend";
import type {
  CreateStaffInviteResult,
  StaffInviteRow,
  UserType,
} from "@/services/backend.types";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type StaffRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_color?: string | null;
  user_type: UserType;
  active?: boolean | null;
};

const roleLabel = (value: UserType) => (value === "doctor" ? "Doctor" : "Assistant");

const formatInviteUrl = (result: CreateStaffInviteResult) => {
  const explicitUrl = result.invite_url || result.url || result.link;
  if (explicitUrl) return String(explicitUrl);

  const token = result.invite_token || result.token;
  if (!token || typeof window === "undefined") return "";

  return `${window.location.origin}/accept-invite?token=${encodeURIComponent(String(token))}`;
};

const createInviteToken = () =>
  `invite_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const formatDate = (value: string | null | undefined) => {
  if (!value) return "No expiry set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const clampRatio = (current: number, total: number | null | undefined) => {
  if (!total || total <= 0) return 0;
  return Math.min(Math.max(current / total, 0), 1);
};

export default function UsersPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { user, session } = useAuth();
  const { clinic, isClinicAdmin, subscription } = useAppData();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [invites, setInvites] = useState<StaffInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserType>("assistant");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const [selectedMember, setSelectedMember] = useState<StaffRow | null>(null);

  useEffect(() => {
    if (!user || user.user_type !== "doctor" || !isClinicAdmin) {
      router.replace("/dashboard");
      return;
    }
    void loadTeamData();
  }, [user, isClinicAdmin, router]);

  const doctors = useMemo(() => rows.filter((row) => row.user_type === "doctor"), [rows]);
  const assistants = useMemo(
    () => rows.filter((row) => row.user_type === "assistant"),
    [rows],
  );
  const activePendingInvites = useMemo(
    () =>
      invites.filter((invite) => {
        if (invite.accepted_at) return false;
        if (!invite.expires_at) return true;
        const expiresAt = new Date(invite.expires_at).getTime();
        return !Number.isNaN(expiresAt) && expiresAt > Date.now();
      }),
    [invites],
  );
  const doctorSlotsLeft = Math.max(
    (subscription?.max_doctors ?? 0) - (subscription?.current_doctors ?? doctors.length),
    0,
  );
  const assistantSlotsLeft = Math.max(
    (subscription?.max_assistants ?? 0) -
      (subscription?.current_assistants ?? assistants.length),
    0,
  );
  const doctorUsageRatio = clampRatio(
    subscription?.current_doctors ?? doctors.length,
    subscription?.max_doctors,
  );
  const assistantUsageRatio = clampRatio(
    subscription?.current_assistants ?? assistants.length,
    subscription?.max_assistants,
  );

  async function loadTeamData() {
    if (!user?.id || !user.clinic_id) return;

    setLoading(true);
    try {
      const [staff, invitesResult] = await Promise.all([
        callRpc<StaffRow[], Record<string, unknown>>("rpc_get_clinic_staff", {
          p_requester_id: user.id,
        }),
        db
          .from("staff_invites")
          .select(
            "id, clinic_id, email, user_type, invited_by, expires_at, accepted_at, created_at",
          )
          .eq("clinic_id", user.clinic_id)
          .order("created_at", { ascending: false }),
      ]);

      setRows(staff ?? []);
      setInvites((invitesResult.data as StaffInviteRow[] | null) ?? []);
    } catch {
      setRows([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateInvite = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    setSuccess("");
    setLatestInviteUrl("");

    if (!normalizedEmail) {
      setError("Staff email is required.");
      return;
    }

    if (role === "doctor" && subscription?.max_doctors != null && doctorSlotsLeft <= 0) {
      setError("Doctor license limit reached.");
      return;
    }

    if (
      role === "assistant" &&
      subscription?.max_assistants != null &&
      assistantSlotsLeft <= 0
    ) {
      setError("Assistant license limit reached.");
      return;
    }

    setSubmitting(true);
    try {
      const inviteToken = createInviteToken();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

      const inviteId = await callRpc<string, Record<string, unknown>>(
        "rpc_create_staff_invite",
        {
          p_requester_id: user?.id,
          p_email: normalizedEmail,
          p_user_type: role,
          p_token_hash: inviteToken,
          p_expires_at: expiresAt,
        },
      );

      const result: CreateStaffInviteResult = {
        invite_id: inviteId,
        invite_token: inviteToken,
        expires_at: expiresAt,
      };

      const inviteUrl = formatInviteUrl(result ?? {});
      setSuccess(
        inviteUrl
          ? "Invite created. Share the secure link with your teammate."
          : "Invite created successfully.",
      );
      setLatestInviteUrl(inviteUrl);
      setEmail("");
      await loadTeamData();
    } catch (inviteError: any) {
      setError(inviteError?.message || "Failed to create invite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Clinic Team"
      subtitle="Invite staff, track seat usage, and keep access under control."
    >
      <View style={styles.statsGrid}>
        <StatCard
          label="Doctors"
          value={`${doctors.length}/${subscription?.max_doctors ?? "—"}`}
          note={
            subscription?.max_doctors != null
              ? `${doctorSlotsLeft} seat${doctorSlotsLeft === 1 ? "" : "s"} left`
              : "Seat limit unavailable"
          }
          icon="medkit-outline"
          progress={doctorUsageRatio}
          tone="primary"
          styles={styles}
          theme={theme}
        />
        <StatCard
          label="Assistants"
          value={`${assistants.length}/${subscription?.max_assistants ?? "—"}`}
          note={
            subscription?.max_assistants != null
              ? `${assistantSlotsLeft} seat${assistantSlotsLeft === 1 ? "" : "s"} left`
              : "Seat limit unavailable"
          }
          icon="people-outline"
          progress={assistantUsageRatio}
          tone="teal"
          styles={styles}
          theme={theme}
        />
        <StatCard
          label="Invites in flight"
          value={`${activePendingInvites.length}`}
          note="Secure links waiting to be accepted"
          icon="mail-open-outline"
          progress={activePendingInvites.length > 0 ? 0.66 : 0}
          tone="amber"
          styles={styles}
          theme={theme}
        />
      </View>

      <View style={styles.topGrid}>
        <View style={styles.inviteCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Invite a staff member</Text>
            </View>
            <View style={styles.cardIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primary} />
            </View>
          </View>

          {!!error ? <Text style={[styles.banner, styles.bannerBad]}>{error}</Text> : null}
          {!!success ? <Text style={[styles.banner, styles.bannerOk]}>{success}</Text> : null}

          <View style={styles.roleRow}>
            <RoleOption
              label="Assistant"
              detail={`${assistantSlotsLeft} seat${assistantSlotsLeft === 1 ? "" : "s"} left`}
              active={role === "assistant"}
              disabled={subscription?.max_assistants != null && assistantSlotsLeft <= 0}
              onPress={() => setRole("assistant")}
              styles={styles}
              theme={theme}
            />
            <RoleOption
              label="Doctor"
              detail={`${doctorSlotsLeft} seat${doctorSlotsLeft === 1 ? "" : "s"} left`}
              active={role === "doctor"}
              disabled={subscription?.max_doctors != null && doctorSlotsLeft <= 0}
              onPress={() => setRole("doctor")}
              styles={styles}
              theme={theme}
            />
          </View>

          <View style={styles.inputStack}>
            <Text style={styles.inputLabel}>Staff email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="staff@clinic.com"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={handleCreateInvite}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Create invite link</Text>
              </>
            )}
          </TouchableOpacity>

          {!!latestInviteUrl ? (
            <View style={styles.linkCard}>
              <Text style={styles.linkLabel}>Latest invite link</Text>
              <Text style={styles.linkValue}>{latestInviteUrl}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.pendingCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Pending invites</Text>
            </View>
            <Text style={styles.sectionCount}>{activePendingInvites.length}</Text>
          </View>

          {activePendingInvites.length === 0 ? (
            <EmptyState
              title="No pending invites"
              body="Fresh invite links will appear here after you create them."
              icon="mail-open-outline"
              styles={styles}
              theme={theme}
            />
          ) : (
            activePendingInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteRow}>
                <View style={styles.inviteRowMain}>
                  <View style={styles.inviteIconWrap}>
                    <Ionicons
                      name={
                        invite.user_type === "doctor"
                          ? "medkit-outline"
                          : "person-add-outline"
                      }
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.personCopy}>
                    <View style={styles.personTitleRow}>
                      <Text style={styles.personName}>{invite.email}</Text>
                      <View style={[styles.statusBadge, styles.statusBadgePending]}>
                        <Text style={[styles.statusBadgeText, styles.statusBadgePendingText]}>
                          Pending
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.personMeta}>
                      {roleLabel(invite.user_type)} {"\u2022"} Expires {formatDate(invite.expires_at)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.directoryGrid}>
          <View style={[styles.directoryCard, styles.directoryCardWide]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Active team members</Text>
              </View>
              <Text style={styles.sectionCount}>{rows.length}</Text>
            </View>

            {rows.length > 0 ? (
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadText, styles.memberCol]}>Member</Text>
                <Text style={[styles.tableHeadText, styles.roleCol]}>Role</Text>
                <Text style={[styles.tableHeadText, styles.seatCol]}>Seat</Text>
                <Text style={[styles.tableHeadText, styles.statusCol]}>Active</Text>
                <Text style={[styles.tableHeadText, styles.actionCol]}>Action</Text>
              </View>
            ) : null}

            {rows.length === 0 ? (
              <EmptyState
                title="No staff added yet"
                body="Invite your first teammate to start building the clinic team."
                icon="people-outline"
                styles={styles}
                theme={theme}
              />
            ) : (
              rows.map((item) => (
                <View key={item.id} style={styles.personRow}>
                  <View style={[styles.personMain, styles.memberCol]}>
                    <UserAvatar
                      name={item.full_name || item.email || "User"}
                      avatarColor={item.avatar_color ?? null}
                      size={44}
                    />

                    <View style={styles.personCopy}>
                      <View style={styles.personTitleRow}>
                        <Text style={styles.personName}>
                          {item.full_name || item.email || "Unknown"}
                        </Text>
                      </View>
                      <Text style={styles.personMeta}>{item.email || "no-email"}</Text>
                    </View>
                  </View>

                  <View style={[styles.cell, styles.roleCol]}>
                    <View
                      style={[
                        styles.roleBadge,
                        item.user_type === "doctor"
                          ? styles.roleBadgeDoctor
                          : styles.roleBadgeAssistant,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          item.user_type === "doctor"
                            ? styles.roleBadgeDoctorText
                            : styles.roleBadgeAssistantText,
                        ]}
                      >
                        {roleLabel(item.user_type)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.cell, styles.seatCol]}>
                    <Text style={styles.cellText}>
                      {item.user_type === "doctor"
                        ? "Clinical lead seat"
                        : "Assistant workspace seat"}
                    </Text>
                  </View>

                  <View style={[styles.cell, styles.statusCol]}>
                    <View
                      style={[
                        styles.statusBadge,
                        item.active ? styles.statusBadgeActive : styles.statusBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.active
                            ? styles.statusBadgeActiveText
                            : styles.statusBadgeInactiveText,
                        ]}
                      >
                        {item.active ? "Enabled" : "Paused"}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.cell, styles.actionCol]}>
                    <ActionButton
                      icon="settings-outline"
                      label="Manage"
                      onPress={() => setSelectedMember(item)}
                      styles={styles}
                      theme={theme}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      <Modal
        visible={!!selectedMember}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMember(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMember(null)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Team member settings</Text>
                <Text style={styles.modalSubtitle}>
                  Review current access and workspace role.
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedMember(null)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {selectedMember ? (
              <View style={styles.modalBody}>
                <View style={styles.modalIdentity}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {getInitials(
                        selectedMember.full_name || selectedMember.email || "User",
                      )}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalName}>
                      {selectedMember.full_name || selectedMember.email || "Unknown"}
                    </Text>
                    <Text style={styles.modalEmail}>{selectedMember.email || "no-email"}</Text>
                  </View>
                </View>

                <View style={styles.modalGrid}>
                  <SettingItem
                    label="Access"
                    value={selectedMember.active ? "Enabled" : "Paused"}
                    styles={styles}
                  />
                  <SettingItem
                    label="Role"
                    value={roleLabel(selectedMember.user_type)}
                    styles={styles}
                  />
                  <SettingItem
                    label="Seat"
                    value={
                      selectedMember.user_type === "doctor"
                        ? "Clinical lead seat"
                        : "Assistant workspace seat"
                    }
                    styles={styles}
                  />
                  <SettingItem
                    label="Next step"
                    value="Use profile or services pages for current edits"
                    styles={styles}
                  />
                </View>

                <View style={styles.modalActions}>
                  <ActionButton
                    icon="person-outline"
                    label="Open profile"
                    onPress={() => {
                      setSelectedMember(null);
                      router.push("/profile");
                    }}
                    styles={styles}
                    theme={theme}
                  />
                  <ActionButton
                    icon="medical-outline"
                    label="Open services"
                    onPress={() => {
                      setSelectedMember(null);
                      router.push("/services");
                    }}
                    styles={styles}
                    theme={theme}
                  />
                </View>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
  progress,
  tone,
  styles,
  theme,
}: any) {
  const toneStyle =
    tone === "teal"
      ? styles.statCardTeal
      : tone === "amber"
        ? styles.statCardAmber
        : styles.statCardPrimary;

  return (
    <View style={[styles.statCard, toneStyle]}>
      <View style={styles.statCardTop}>
        <View style={styles.statIconWrap}>
          <Ionicons name={icon} size={18} color={theme.colors.primary} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statNote}>{note}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 8)}%` }]} />
      </View>
    </View>
  );
}

function RoleOption({ label, detail, active, disabled, onPress, styles }: any) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.roleCard,
        active && styles.roleCardActive,
        disabled && styles.roleCardDisabled,
      ]}
    >
      <Text style={[styles.roleCardTitle, active && styles.roleCardTitleActive]}>{label}</Text>
      <Text style={styles.roleCardDetail}>{detail}</Text>
    </Pressable>
  );
}

function DataPill({ label, tone, styles }: any) {
  const toneStyle =
    tone === "success"
      ? [styles.dataPill, styles.dataPillSuccess]
      : tone === "neutral"
        ? [styles.dataPill, styles.dataPillNeutral]
        : [styles.dataPill, styles.dataPillPrimary];

  const textStyle =
    tone === "success"
      ? styles.dataPillSuccessText
      : tone === "neutral"
        ? styles.dataPillNeutralText
        : styles.dataPillPrimaryText;

  return (
    <View style={toneStyle}>
      <Text style={[styles.dataPillText, textStyle]}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress, styles, theme }: any) {
  return (
    <Pressable onPress={onPress} style={styles.actionButton}>
      <Ionicons name={icon} size={15} color={theme.colors.primary} />
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

function SettingItem({ label, value, styles }: any) {
  return (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

function EmptyState({ title, body, icon, styles, theme }: any) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{body}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    statCard: {
      flex: 1,
      minWidth: 220,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: 8,
    },
    statCardPrimary: { backgroundColor: theme.colors.surface },
    statCardTeal: { backgroundColor: "#F2FBF8" },
    statCardAmber: { backgroundColor: "#FFF9F0" },
    statCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    statIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySoft,
    },
    statLabel: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },
    statValue: { color: theme.colors.text, fontWeight: "900", fontSize: 24 },
    statNote: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    progressTrack: {
      height: 7,
      borderRadius: 999,
      backgroundColor: theme.colors.border,
      overflow: "hidden",
      marginTop: 2,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    topGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      marginTop: 14,
      alignItems: "flex-start",
    },
    inviteCard: {
      flex: 1.1,
      minWidth: 320,
      maxWidth: 720,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 18,
      gap: 14,
    },
    pendingCard: {
      flex: 1,
      minWidth: 340,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
      alignSelf: "stretch",
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    cardTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 19 },
    cardIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySoft,
    },
    banner: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontWeight: "800",
      fontSize: 13,
    },
    bannerOk: { backgroundColor: "#DCFCE7", color: "#166534" },
    bannerBad: { backgroundColor: "#FEE2E2", color: "#991B1B" },
    roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    roleCard: {
      flex: 1,
      minWidth: 150,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundAlt,
      padding: 14,
      gap: 4,
    },
    roleCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    roleCardDisabled: { opacity: 0.55 },
    roleCardTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
    roleCardTitleActive: { color: theme.colors.primary },
    roleCardDetail: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    inputStack: { gap: 7 },
    inputLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "800",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    inputWrap: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundAlt,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      fontWeight: "700",
      paddingVertical: 13,
    },
    primaryButton: {
      minHeight: 50,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
    },
    primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: 14 },
    buttonDisabled: { opacity: 0.7 },
    linkCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#BFDBFE",
      backgroundColor: "#EFF6FF",
      padding: 14,
      gap: 6,
    },
    linkLabel: {
      color: "#1D4ED8",
      fontWeight: "900",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    linkValue: { color: "#0F172A", fontWeight: "700", lineHeight: 20 },
    center: { padding: 30, alignItems: "center" },
    directoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 14 },
    directoryCard: {
      flex: 1,
      minWidth: 320,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    directoryCardWide: {
      minWidth: 680,
    },
    tableHead: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.colors.backgroundAlt,
    },
    tableHeadText: {
      color: theme.colors.textSecondary,
      fontWeight: "900",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    memberCol: { flex: 2.4, minWidth: 260 },
    roleCol: { flex: 1.1, minWidth: 100 },
    seatCol: { flex: 1.6, minWidth: 160 },
    statusCol: { flex: 0.9, minWidth: 90 },
    actionCol: { flex: 0.9, minWidth: 96 },
    sectionHeader: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 14,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 18 },
    sectionCount: {
      color: theme.colors.primary,
      fontWeight: "900",
      fontSize: 22,
      minWidth: 34,
      textAlign: "right",
    },
    personRow: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    inviteRow: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    personMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    inviteRowMain: { flexDirection: "row", gap: 12, alignItems: "center" },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: theme.colors.primary, fontWeight: "900", fontSize: 16 },
    inviteIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    personCopy: { flex: 1, minWidth: 0 },
    personTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    personName: { color: theme.colors.text, fontWeight: "900", fontSize: 15, flexShrink: 1 },
    personMeta: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
      marginTop: 4,
      fontSize: 12,
    },
    cell: {
      justifyContent: "center",
      alignItems: "flex-start",
    },
    cellText: {
      color: theme.colors.text,
      fontWeight: "700",
      fontSize: 13,
      lineHeight: 18,
    },
    roleBadge: {
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    roleBadgeDoctor: { backgroundColor: "#DBEAFE" },
    roleBadgeAssistant: { backgroundColor: "#ECFDF5" },
    roleBadgeText: { fontWeight: "900", fontSize: 11 },
    roleBadgeDoctorText: { color: "#1D4ED8" },
    roleBadgeAssistantText: { color: "#047857" },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    statusBadgeText: { fontWeight: "900", fontSize: 11 },
    statusBadgeActive: { backgroundColor: "#DCFCE7" },
    statusBadgeInactive: { backgroundColor: "#E2E8F0" },
    statusBadgePending: { backgroundColor: "#FEF3C7" },
    statusBadgeActiveText: { color: "#166534" },
    statusBadgeInactiveText: { color: "#475569" },
    statusBadgePendingText: { color: "#92400E" },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundAlt,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    actionButtonText: {
      color: theme.colors.primary,
      fontWeight: "800",
      fontSize: 12,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.32)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 620,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20,
      gap: 18,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    modalTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 20 },
    modalSubtitle: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
      marginTop: 4,
    },
    modalCloseButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.backgroundAlt,
    },
    modalBody: { gap: 16 },
    modalIdentity: { flexDirection: "row", alignItems: "center", gap: 14 },
    modalAvatar: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    modalAvatarText: { color: theme.colors.primary, fontWeight: "900", fontSize: 18 },
    modalName: { color: theme.colors.text, fontWeight: "900", fontSize: 18 },
    modalEmail: { color: theme.colors.textSecondary, fontWeight: "700", marginTop: 4 },
    modalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    settingItem: {
      flex: 1,
      minWidth: 180,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundAlt,
      padding: 14,
      gap: 6,
    },
    settingLabel: {
      color: theme.colors.textSecondary,
      fontWeight: "900",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    settingValue: {
      color: theme.colors.text,
      fontWeight: "800",
      fontSize: 14,
      lineHeight: 19,
    },
    modalActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    emptyState: {
      paddingHorizontal: 18,
      paddingVertical: 28,
      alignItems: "flex-start",
      gap: 8,
    },
    emptyIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
    emptyText: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
      lineHeight: 20,
      maxWidth: 420,
    },
  });
