import { AnimatedLoading } from "@/components/common/animated_loading";
import { PageShell } from "@/components/layout/page_shell";
import { Toggle } from "@/components/common/toggle";
import { UserAvatar } from "@/components/common/user_avatar";
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
  Platform,
  Pressable,
  ScrollView,
  Share,
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
  last_sign_in_at?: string | null;
};

type ViewKey = "team" | "seats" | "activity";
type PanelKey = "member" | "invite";

const roleLabel = (value: UserType) => (value === "doctor" ? "Doctor" : "Assistant");

const seatLabel = (value: UserType, isAdmin?: boolean) => {
  if (value !== "doctor") return "Front desk seat";
  return isAdmin ? "Clinical lead seat" : "Clinical seat";
};

const accessLabel = (row: StaffRow) => {
  if (!row.active) return "Paused";
  return row.user_type === "doctor" ? "Full access" : "Front desk";
};

const formatLastActive = (value: string | null | undefined) => {
  if (!value) return "Never signed in";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never signed in";

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (dayDiff <= 0) return "Active today";
  if (dayDiff === 1) return "Active yesterday";
  return `Active ${dayDiff} days ago`;
};

// Access is a property of the role, not of the person. Only rows with
// locked === false are decisions the admin actually gets to make.
const PERMS_BY_ROLE: Record<UserType, { label: string; note: string; locked: boolean; on: boolean }[]> = {
  doctor: [
    { label: "Appointments & calendar", note: "Role default", locked: true, on: true },
    { label: "Patient records", note: "Role default", locked: true, on: true },
    { label: "Consultations & prescriptions", note: "Role default", locked: true, on: true },
    { label: "Billing & reports", note: "On", locked: false, on: true },
  ],
  assistant: [
    { label: "Appointments & calendar", note: "Role default", locked: true, on: true },
    { label: "Patient records (read only)", note: "Role default", locked: true, on: true },
    { label: "Consultations & prescriptions", note: "Not for this role", locked: true, on: false },
    { label: "Billing & reports", note: "Off", locked: false, on: false },
  ],
};

const formatInviteUrl = (result: CreateStaffInviteResult) => {
  const explicitUrl = result.invite_url || result.url || result.link;
  if (explicitUrl) return String(explicitUrl);

  const token = result.invite_token || result.token;
  if (!token) return "";

  // window.location.origin covers web and Electron (both have `window`);
  // native (iOS/Android) has neither, so fall back to a configured base URL
  // instead of silently producing no link at all.
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.EXPO_PUBLIC_WEB_APP_URL || "";
  if (!base) return "";

  return `${base}/accept-invite?token=${encodeURIComponent(String(token))}`;
};

const createInviteToken = () => {
  // crypto.randomUUID() is available in modern browsers, Node, and RN's JS
  // engine on recent Expo/Hermes - matches the same pattern already used in
  // apps/backend/services/offline_queue.ts. A Math.random()+Date.now() token
  // is guessable (limited entropy, and Date.now() narrows the search space
  // to whenever the invite was created).
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  // Extremely defensive fallback for an environment with neither - still
  // far more entropy than the old scheme.
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join("");
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "No expiry set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export default function UsersPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { user } = useAuth();
  const { isClinicAdmin, subscription, clinic } = useAppData();

  const [rows, setRows] = useState<StaffRow[]>([]);
  const [invites, setInvites] = useState<StaffInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [view, setView] = useState<ViewKey>("team");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panel, setPanel] = useState<PanelKey>("member");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserType>("assistant");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const shareInviteLink = async (url: string) => {
    if (!url) return;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        return;
      }
      await Share.share({ message: url });
    } catch (err) {
      console.error("Failed to share invite link:", err);
    }
  };

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
  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
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

  const maxDoctors = subscription?.max_doctors ?? null;
  const maxAssistants = subscription?.max_assistants ?? null;
  const usedDoctors = subscription?.current_doctors ?? doctors.length;
  const usedAssistants = subscription?.current_assistants ?? assistants.length;
  const doctorSlotsLeft = maxDoctors == null ? null : Math.max(maxDoctors - usedDoctors, 0);
  const assistantSlotsLeft =
    maxAssistants == null ? null : Math.max(maxAssistants - usedAssistants, 0);

  async function loadTeamData() {
    if (!user?.id || !user.clinic_id) return;

    setLoading(true);
    setLoadError("");
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
    } catch (err) {
      setRows([]);
      setInvites([]);
      setLoadError(err instanceof Error ? err.message : "Could not load your team. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const openMember = (member: StaffRow) => {
    const sameRow = panelOpen && panel === "member" && selectedId === member.id;
    setSelectedId(member.id);
    setPanel("member");
    setView("team");
    setPanelOpen(!sameRow);
  };

  const openInvite = (nextRole: UserType) => {
    setRole(nextRole);
    setPanel("invite");
    setView("team");
    setPanelOpen(true);
    setError("");
    setSuccess("");
    setLatestInviteUrl("");
  };

  const goTo = (next: ViewKey) => {
    setView(next);
    if (next !== "team") setPanelOpen(false);
  };

  const handleCreateInvite = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    setSuccess("");
    setLatestInviteUrl("");

    if (!normalizedEmail) {
      setError("Staff email is required.");
      return;
    }
    if (role === "doctor" && doctorSlotsLeft != null && doctorSlotsLeft <= 0) {
      setError("No doctor seats left on your plan.");
      return;
    }
    if (role === "assistant" && assistantSlotsLeft != null && assistantSlotsLeft <= 0) {
      setError("No assistant seats left on your plan.");
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

      const inviteUrl = formatInviteUrl({
        invite_id: inviteId,
        invite_token: inviteToken,
        expires_at: expiresAt,
      });

      setSuccess(`Link ready for ${normalizedEmail}.`);
      setLatestInviteUrl(inviteUrl);
      setEmail("");
      await loadTeamData();
    } catch (inviteError: any) {
      setError(inviteError?.message || "Failed to create invite.");
    } finally {
      setSubmitting(false);
    }
  };

  const seatMeter = (label: string, used: number, max: number | null, color: string) => {
    const total = max ?? Math.max(used, 1);
    const pips = Array.from({ length: total }, (_, index) => index < used);
    return (
      <View style={styles.meter}>
        <View style={styles.meterTop}>
          <Text style={styles.meterLabel}>{label}</Text>
          <Text style={styles.meterValue}>{max == null ? `${used}` : `${used} of ${max}`}</Text>
        </View>
        <View style={styles.meterTrack}>
          {pips.map((filled, index) => (
            <View
              key={index}
              style={[
                styles.meterPip,
                { backgroundColor: filled ? color : theme.colors.meterTrackEmpty },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const headerActions = (
    <View style={styles.headerActions}>
      <View style={styles.meterGroup}>
        {seatMeter("Doctors", usedDoctors, maxDoctors, theme.colors.primary)}
        {seatMeter("Assistants", usedAssistants, maxAssistants, theme.colors.success)}
      </View>
      <View style={styles.tabs}>
        {(
          [
            ["team", "Team"],
            ["seats", "Seats & billing"],
            ["activity", "Recent access"],
          ] as [ViewKey, string][]
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => goTo(key)}
            style={[styles.tab, view === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, view === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={() => openInvite(role)}>
        <Ionicons name="add" size={16} color={theme.colors.textOnPrimary} />
        <Text style={styles.primaryButtonText}>Invite teammate</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRosterGroup = (title: string, list: StaffRow[], slotsLeft: number | null) => (
    <View>
      <View style={styles.groupHead}>
        <Text style={styles.groupTitle}>{title}</Text>
        <Text style={styles.groupNote}>
          {slotsLeft == null
            ? "No seat limit on this plan"
            : `${slotsLeft} seat${slotsLeft === 1 ? "" : "s"} open`}
        </Text>
      </View>
      {list.map((item) => {
        const active = panelOpen && panel === "member" && selectedId === item.id;
        return (
          <Pressable key={item.id} onPress={() => openMember(item)} style={styles.row}>
            <View
              pointerEvents="none"
              style={[styles.rowTint, { backgroundColor: active ? "rgba(37,99,235,0.05)" : "transparent" }]}
            />
            <View
              style={[
                styles.rowMark,
                { backgroundColor: active ? theme.colors.primary : "transparent" },
              ]}
            />
            <UserAvatar
              name={item.full_name || item.email || "User"}
              avatarColor={item.avatar_color ?? null}
              size={38}
            />
            <View style={styles.rowCopy}>
              <Text style={styles.rowName}>{item.full_name || item.email || "Unknown"}</Text>
              <Text style={styles.rowMeta}>{item.email || "no email on file"}</Text>
            </View>
            <Text style={styles.rowSeat}>{formatLastActive(item.last_sign_in_at)}</Text>
            <View style={styles.rowAccess}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.active ? theme.colors.success : theme.colors.disabled },
                ]}
              />
              <Text style={[styles.rowAccessText, !item.active && styles.rowAccessTextOff]}>
                {accessLabel(item)}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {list.length === 0 ? (
        <Text style={styles.groupEmpty}>Nobody in these seats yet.</Text>
      ) : null}
    </View>
  );

  const renderPendingInvites = () =>
    activePendingInvites.length === 0 ? (
      <Text style={styles.footnote}>Invites appear here as a pending row until accepted.</Text>
    ) : (
      <View style={styles.pendingBlock}>
        <Text style={styles.groupTitle}>Pending</Text>
        {activePendingInvites.map((invite) => (
          <View key={invite.id} style={styles.row}>
            <View style={styles.pendingAvatar}>
              <Ionicons name="mail-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowName}>{invite.email}</Text>
              <Text style={styles.rowMeta}>
                {roleLabel(invite.user_type)} · expires {formatDate(invite.expires_at)}
              </Text>
            </View>
            <Text style={styles.rowSeat}>Seat held</Text>
            <View style={styles.rowAccess}>
              <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
              <Text style={styles.rowAccessText}>Waiting</Text>
            </View>
          </View>
        ))}
      </View>
    );

  const renderOpenSeats = (label: string, count: number | null, seatRole: UserType) => {
    if (count == null) {
      return (
        <Text style={styles.footnote}>
          This plan has no {roleLabel(seatRole).toLowerCase()} seat limit.
        </Text>
      );
    }
    if (count === 0) return null;
    return (
      <View style={styles.seatBlock}>
        <Text style={styles.seatGroupLabel}>{label}</Text>
        <View style={styles.seatRow}>
          {Array.from({ length: count }, (_, index) => (
            <Pressable
              key={index}
              onPress={() => openInvite(seatRole)}
              style={styles.emptySeat}
            >
              <View style={styles.emptySeatIcon}>
                <Ionicons name="add" size={16} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.emptySeatTitle}>
                  Invite {roleLabel(seatRole).toLowerCase()}
                </Text>
                <Text style={styles.emptySeatNote}>Seat paid for, nobody in it</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderSeatsView = () => (
    <View>
      <View style={styles.planCard}>
        <View style={styles.planHead}>
          <View>
            <Text style={styles.planTitle}>Plan &amp; seats</Text>
            <Text style={styles.planMeta}>
              Seat limits come from your subscription. Filled seats live in the Team tab.
            </Text>
          </View>
          <Pressable onPress={() => router.push("/settings")}>
            <Text style={styles.link}>Change plan</Text>
          </Pressable>
        </View>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planRowTitle}>
              {maxDoctors == null ? "Doctor seats" : `${maxDoctors} doctor seats`}
            </Text>
            <Text style={styles.planRowNote}>
              {usedDoctors} in use — {doctors.map((d) => d.full_name || d.email).join(", ") || "nobody yet"}
            </Text>
          </View>
        </View>
        <View style={[styles.planRow, styles.planRowLast]}>
          <View>
            <Text style={styles.planRowTitle}>
              {maxAssistants == null ? "Assistant seats" : `${maxAssistants} assistant seats`}
            </Text>
            <Text style={styles.planRowNote}>
              {usedAssistants} in use —{" "}
              {assistants.map((a) => a.full_name || a.email).join(", ") || "nobody yet"}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.groupTitle}>Open seats</Text>
      {renderOpenSeats("Doctor", doctorSlotsLeft, "doctor")}
      {renderOpenSeats("Assistant", assistantSlotsLeft, "assistant")}
      {doctorSlotsLeft === 0 && assistantSlotsLeft === 0 ? (
        <View style={styles.allFull}>
          <View>
            <Text style={styles.rowName}>Every seat is taken</Text>
            <Text style={styles.rowMeta}>Add a seat to the plan before inviting anyone else.</Text>
          </View>
          <Pressable onPress={() => router.push("/settings")}>
            <Text style={styles.link}>Add a seat</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  // Needs a backing table (sign-ins + access changes). Until then this stays honest.
  const renderActivityView = () => (
    <View style={styles.planCard}>
      <View style={styles.planHead}>
        <View>
          <Text style={styles.planTitle}>Recent access</Text>
          <Text style={styles.planMeta}>
            Sign-ins and access changes across the clinic, newest first.
          </Text>
        </View>
      </View>
      <View style={styles.activityEmpty}>
        <Text style={styles.rowName}>No access history yet</Text>
        <Text style={styles.rowMeta}>
          This tab needs an access log (sign-ins, pause/resume, invite accepted). Wire it to a
          staff_access_log table and render the rows here.
        </Text>
      </View>
    </View>
  );

  const renderMemberPanel = () => {
    if (!selected) return null;
    const perms = PERMS_BY_ROLE[selected.user_type];
    return (
      <View>
        <View style={styles.panelHead}>
          <View>
            <Text style={styles.panelTitle}>Manage access</Text>
            <Text style={styles.panelSub}>
              {seatLabel(selected.user_type, clinic?.admin_id && String(clinic.admin_id) === String(selected.id))}
            </Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => setPanelOpen(false)}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.panelBody}>
          <View style={styles.identity}>
            <UserAvatar
              name={selected.full_name || selected.email || "User"}
              avatarColor={selected.avatar_color ?? null}
              size={52}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.identityName}>
                {selected.full_name || selected.email || "Unknown"}
              </Text>
              <Text style={styles.rowMeta}>{selected.email || "no email on file"}</Text>
            </View>
          </View>

          <View style={styles.fieldCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldTitle}>Role</Text>
              <Text style={styles.fieldNote}>Set when the invite was sent</Text>
            </View>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{roleLabel(selected.user_type)}</Text>
            </View>
          </View>

          <View style={styles.fieldCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldTitle}>Can sign in</Text>
              <Text style={styles.fieldNote}>
                {selected.active
                  ? "Signs in with their own credentials"
                  : "Paused — cannot sign in"}
              </Text>
            </View>
            <Toggle
              value={!!selected.active}
              onValueChange={() => {
                /* TODO: call the enable/disable RPC, then loadTeamData() */
              }}
              accessibilityLabel="Can sign in"
            />
          </View>

          <View>
            <View style={styles.permHead}>
              <Text style={styles.sectionLabel}>Can reach</Text>
              <Text style={styles.fieldNote}>{roleLabel(selected.user_type)} defaults</Text>
            </View>
            {perms.map((perm) => (
              <View key={perm.label} style={styles.permRow}>
                <View
                  style={[
                    styles.permBox,
                    {
                      // Exact swatch colors from the design (not derived
                      // from the primary/border tokens - these are
                      // deliberately distinct, muted indicator tones).
                      backgroundColor: perm.on
                        ? perm.locked
                          ? "#9DBDF2"
                          : theme.colors.primary
                        : perm.locked
                          ? theme.colors.surfaceVariant
                          : "#E1E8F2",
                    },
                  ]}
                />
                <Text style={[styles.permLabel, perm.locked && styles.permLabelLocked]}>
                  {perm.label}
                </Text>
                <Text style={styles.permNote}>{perm.note}</Text>
              </View>
            ))}
            <Text style={styles.permsFootnote}>
              {selected.user_type === "doctor"
                ? "Doctors always get records and consultations. Only billing is yours to set."
                : "Assistants always get calendar and read-only records. Billing is off by default."}
            </Text>
          </View>

          <View style={styles.panelFooter}>
            <Pressable>
              <Text style={styles.dangerText}>Remove from clinic</Text>
            </Pressable>
            <TouchableOpacity style={styles.smallPrimary}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderInvitePanel = () => (
    <View>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>Invite teammate</Text>
        <Pressable style={styles.iconButton} onPress={() => setPanelOpen(false)}>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.panelBody}>
        {!!error && <Text style={[styles.banner, styles.bannerBad]}>{error}</Text>}

        <View>
          <Text style={styles.sectionLabel}>Seat type</Text>
          <View style={styles.seatTypeRow}>
            {(["doctor", "assistant"] as UserType[]).map((option) => {
              const left = option === "doctor" ? doctorSlotsLeft : assistantSlotsLeft;
              const disabled = left != null && left <= 0;
              const active = role === option;
              return (
                <Pressable
                  key={option}
                  onPress={disabled ? undefined : () => setRole(option)}
                  style={[
                    styles.seatType,
                    active && styles.seatTypeActive,
                    disabled && styles.seatTypeDisabled,
                  ]}
                >
                  <Text style={[styles.seatTypeTitle, active && styles.seatTypeTitleActive]}>
                    {roleLabel(option)}
                  </Text>
                  <Text style={styles.fieldNote}>
                    {left == null ? "No limit" : `${left} open`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Work email</Text>
          <TextInput
            placeholder="name@clinic.test"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, styles.blockButton, submitting && styles.buttonDisabled]}
          onPress={handleCreateInvite}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.colors.textOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Create invite link</Text>
          )}
        </TouchableOpacity>

        {!!latestInviteUrl && (
          <View style={styles.linkCard}>
            <Text style={styles.linkCardTitle}>{success}</Text>
            <Text style={styles.linkCardValue} selectable>{latestInviteUrl}</Text>
            <TouchableOpacity
              style={styles.copyLinkButton}
              onPress={() => shareInviteLink(latestInviteUrl)}
            >
              <Ionicons
                name={linkCopied ? "checkmark" : Platform.OS === "web" ? "copy-outline" : "share-outline"}
                size={14}
                color={theme.colors.primary}
              />
              <Text style={styles.copyLinkButtonText}>
                {linkCopied ? "Copied!" : Platform.OS === "web" ? "Copy link" : "Share link"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.footnote, styles.inviteFootnote]}>
          The link expires in 7 days and can only be used once. The seat is held until then.
        </Text>
      </View>
    </View>
  );

  return (
    <PageShell scrollable={false}>
      {loading ? (
        <AnimatedLoading transparent label="Loading your team…" />
      ) : (
        <View style={styles.pageCard}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{clinic?.name ?? "Clinic team"}</Text>
            {headerActions}
          </View>
          <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.main}>
            {!!loadError && (
              <View style={[styles.banner, styles.bannerBad, styles.loadErrorBanner]}>
                <Text style={styles.bannerBadText}>{loadError}</Text>
                <Pressable onPress={() => void loadTeamData()}>
                  <Text style={styles.link}>Retry</Text>
                </Pressable>
              </View>
            )}
            {view === "team" ? (
              <View>
                {renderRosterGroup("Doctors", doctors, doctorSlotsLeft)}
                <View style={{ height: 26 }} />
                {renderRosterGroup("Assistants", assistants, assistantSlotsLeft)}
                <View style={{ height: 18 }} />
                {renderPendingInvites()}
              </View>
            ) : null}
            {view === "seats" ? renderSeatsView() : null}
            {view === "activity" ? renderActivityView() : null}
          </ScrollView>

          {panelOpen ? (
            <ScrollView style={styles.panel} contentContainerStyle={{ paddingBottom: 24 }}>
              {panel === "member" ? renderMemberPanel() : renderInvitePanel()}
            </ScrollView>
          ) : null}
          </View>
        </View>
      )}
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    // The whole page - header (clinic name, seat meters, tabs, invite
    // button) and the roster/manage-panel body below it - is one
    // continuous white card in the design, not a separate header card
    // floating above bare page background.
    pageCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      overflow: "hidden",
      ...(Platform.OS === "web" ? ({ boxShadow: "0px 8px 24px rgba(15,23,42,0.05)" } as any) : null),
    },
    pageHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 24,
      paddingHorizontal: 36,
      paddingTop: 30,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderMuted,
    },
    pageTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.3, color: theme.colors.text },
    body: { flex: 1, flexDirection: "row", alignItems: "stretch" },
    main: { flex: 1, minWidth: 0, paddingRight: 24, paddingLeft: 36, paddingTop: 26, paddingBottom: 36 },

    headerActions: { flexDirection: "row", alignItems: "center", gap: 22, flexWrap: "wrap" },
    meterGroup: {
      flexDirection: "row",
      gap: 24,
      paddingRight: 22,
      borderRightWidth: 1,
      borderRightColor: theme.colors.borderMuted,
    },
    meter: { minWidth: 136 },
    meterTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    meterLabel: { fontSize: 12, fontWeight: "500", color: theme.colors.textSecondary },
    meterValue: { fontSize: 12, fontWeight: "600", color: theme.colors.text },
    meterTrack: { flexDirection: "row", gap: 4, marginTop: 8 },
    meterPip: { flex: 1, height: 6, borderRadius: 3 },

    tabs: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 10,
    },
    tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 7 },
    tabActive: { backgroundColor: theme.colors.surface },
    tabText: { fontSize: 12.5, fontWeight: "600", color: theme.colors.textSecondary },
    tabTextActive: { color: theme.colors.text },

    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 10,
    },
    blockButton: { alignSelf: "stretch" },
    buttonDisabled: { opacity: 0.7 },
    primaryButtonText: { color: theme.colors.textOnPrimary, fontWeight: "600", fontSize: 13 },
    smallPrimary: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },

    groupHead: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderMuted,
    },
    groupTitle: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: theme.colors.muted,
    },
    groupNote: { fontSize: 12, color: theme.colors.muted },
    groupEmpty: { paddingVertical: 16, fontSize: 12.5, color: theme.colors.muted },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 15,
      paddingRight: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
    },
    // A rounded highlight that overhangs the row slightly (matches the
    // design's `inset:0 -10px` trick) rather than a flat, full-bleed
    // background - keeps the near-invisible 5% tint from looking like a
    // hard-edged rectangle.
    rowTint: { position: "absolute", left: -10, right: -10, top: 0, bottom: 0, borderRadius: 8 },
    rowMark: { position: "absolute", left: -10, top: 0, bottom: 0, width: 3, borderRadius: 2 },
    rowCopy: { flex: 1, minWidth: 0 },
    rowName: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
    rowMeta: { fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 3, lineHeight: 18 },
    rowSeat: { width: 150, fontSize: 12.5, color: theme.colors.textSecondary },
    rowAccess: { width: 110, flexDirection: "row", alignItems: "center", gap: 7 },
    rowAccessText: { fontSize: 12.5, color: theme.colors.text },
    rowAccessTextOff: { color: theme.colors.textSecondary },
    dot: { width: 6, height: 6, borderRadius: 3 },
    pendingAvatar: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primarySoft,
    },
    pendingBlock: { marginTop: 8 },
    footnote: { marginTop: 18, fontSize: 12.5, lineHeight: 20, color: theme.colors.muted },
    inviteFootnote: { marginTop: 0, borderTopWidth: 1, borderTopColor: theme.colors.borderMuted, paddingTop: 14 },

    planCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 26,
    },
    planHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 20,
      padding: 20,
      backgroundColor: theme.colors.surfaceRaised,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderMuted,
    },
    planTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
    planMeta: { fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 5, lineHeight: 19 },
    planRow: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
    },
    planRowLast: { borderBottomWidth: 0 },
    planRowTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
    planRowNote: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },

    seatBlock: { marginTop: 14 },
    seatGroupLabel: { fontSize: 12.5, fontWeight: "500", color: theme.colors.textSecondary },
    seatRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
    emptySeat: {
      width: 216,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: theme.colors.borderAccent,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    emptySeatIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: theme.colors.borderAccent,
      backgroundColor: theme.colors.primarySoft,
    },
    emptySeatTitle: { fontSize: 13.5, fontWeight: "600", color: theme.colors.primary },
    emptySeatNote: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },
    allFull: {
      marginTop: 16,
      padding: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.colors.disabled,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    activityEmpty: { padding: 20, gap: 4 },
    link: { fontSize: 12.5, fontWeight: "500", color: theme.colors.primary },

    panel: {
      width: 390,
      flexGrow: 0,
      flexShrink: 0,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.borderMuted,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    panelHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderMuted,
    },
    panelTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
    panelSub: { fontSize: 11.5, color: theme.colors.muted, marginTop: 3 },
    iconButton: {
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    panelBody: { padding: 22, gap: 18 },
    identity: { flexDirection: "row", alignItems: "center", gap: 14 },
    identityName: { fontSize: 15, fontWeight: "600", color: theme.colors.text },

    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.colors.muted,
      marginBottom: 8,
    },
    fieldCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: 15,
      borderWidth: 1,
      borderColor: theme.colors.borderMuted,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
    },
    fieldTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
    fieldNote: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },
    rolePill: {
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
    },
    rolePillText: { fontSize: 12.5, fontWeight: "600", color: theme.colors.primary },

    permHead: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
    },
    permRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
    permBox: { width: 16, height: 16, borderRadius: 5 },
    permLabel: { flex: 1, fontSize: 13, color: theme.colors.text },
    permLabelLocked: { color: theme.colors.textSecondary },
    permNote: { fontSize: 11.5, color: theme.colors.muted },
    permsFootnote: { marginTop: 10, fontSize: 11.5, lineHeight: 17, color: theme.colors.muted },

    panelFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderMuted,
      paddingTop: 16,
    },
    dangerText: { fontSize: 12.5, fontWeight: "500", color: theme.colors.error },

    seatTypeRow: { flexDirection: "row", gap: 10 },
    seatType: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    seatTypeActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    seatTypeDisabled: { opacity: 0.5 },
    seatTypeTitle: { fontSize: 13, fontWeight: "600", color: theme.colors.text },
    seatTypeTitleActive: { color: theme.colors.primary },

    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 13,
      color: theme.colors.text,
    },
    banner: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontWeight: "600",
      fontSize: 13,
    },
    bannerBad: { backgroundColor: theme.colors.errorSoft },
    bannerBadText: { color: theme.colors.error, fontWeight: "600", fontSize: 13, flex: 1 },
    loadErrorBanner: {
      marginBottom: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    linkCard: {
      padding: 15,
      borderRadius: 12,
      backgroundColor: theme.colors.successSoft,
      borderWidth: 1,
      // Exact border/title tones from the design - a darker green than
      // `success` for the title, and a specific pastel border, rather
      // than an alpha-blend approximation of the base success color.
      borderColor: "#BFE7D2",
      gap: 7,
    },
    linkCardTitle: { fontSize: 12.5, fontWeight: "600", color: "#216D48" },
    linkCardValue: { fontSize: 12, color: theme.colors.text, lineHeight: 18 },
    copyLinkButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#BFE7D2",
      backgroundColor: theme.colors.surface,
    },
    copyLinkButtonText: { color: theme.colors.primary, fontWeight: "700", fontSize: 12 },
  });
