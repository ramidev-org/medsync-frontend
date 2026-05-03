import { TopBar } from "@/components/top_bar";
import { getCurrentRoleImage } from "@/config/runtime";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getDashboardStyles } from "./_styles";

type VisitStatus = "pending" | "in_consultation" | "completed" | "cancelled";

export default function ReceptionDashboardPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getDashboardStyles(theme), [theme]);
  const { user } = useAuth();
  const { clinic, subscription } = useAppData();
  const router = useRouter();
  const [counts, setCounts] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!user?.id) return;
        const c = await callRpc<any, Record<string, unknown>>(
          "rpc_get_clinic_dashboard_counts",
          { p_requester_id: user.id },
        );
        if (!cancelled) setCounts(c ?? null);
      } catch {
        if (!cancelled) setCounts(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // TODO: Replace with real data from database when appointments/visits table is added
  const visits = [] as any[];
  const pendingCount =
    counts?.appointments_pending ?? counts?.pending_appointments ?? counts?.pending_count ?? 0;
  const inConsultCount = 0;
  const completedCount = 0;
  const cancelledCount = 0;

  // Reception-focused "work queue"
  const toConfirm = pendingCount;
  const toBill = 0;
  const toReschedule = 0;

  // "Today agenda" (instead of waiting room)
  const agenda: any[] = [];

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          {/* LEFT COLUMN */}
          <View style={styles.leftColumn}>
            {/* Welcome */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Bonjour, {user?.fullname ?? "Assistant"} 👋</Text>
              <Text style={styles.welcomeSubtitle}>
                Suivez les rendez-vous, enregistrez les patients et gardez la journée fluide.
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <SoftActionChip theme={theme} icon="add" label="Nouvelle visite" onPress={() => router.push("/visits")} />
                <SoftActionChip theme={theme} icon="person-add" label="Nouveau patient" onPress={() => router.push("/patients")} />
                <SoftActionChip theme={theme} icon="cash" label="Encaissement" onPress={() => router.push("/payments")} />
              </View>
            </View>

            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, padding: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 10 }]}>
                Clinique & Abonnement
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontWeight: "800" }}>
                {clinic?.name ? String(clinic.name) : "—"} •{" "}
                {(subscription?.tier_plan || clinic?.tier_plan || "basic").toString()} •{" "}
                {subscription?.status || "missing"}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard title="À confirmer" value={toConfirm} icon="time-outline" tone="info" theme={theme} />
              <StatCard title="En cours" value={inConsultCount} icon="medkit-outline" tone="primary" theme={theme} />
              <StatCard title="Terminés" value={completedCount} icon="checkmark-circle-outline" tone="success" theme={theme} />
              <StatCard title="Annulés" value={cancelledCount} icon="close-circle-outline" tone="error" theme={theme} />
            </View>

            {/* ✅ Replace waiting room with “Agenda du jour” */}
            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 0 }]}>
                  Agenda du jour
                </Text>

                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>
                    {agenda.length} RDV
                  </Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {agenda.map((a: any) => {
                  const patientName = `${a.patient?.first_name ?? ""} ${a.patient?.last_name ?? ""}`.trim() || "Patient";
                  const status = (a.status ?? "pending") as VisitStatus;
                  const chip = statusChip(status, theme);

                  return (
                    <View
                      key={a.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: 14,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: theme.colors.background,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                            {patientName
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((x) => x[0]?.toUpperCase())
                              .join("") || "P"}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "900", color: theme.colors.text }} numberOfLines={1}>
                            {patientName}
                          </Text>
                          <Text style={{ color: theme.colors.muted, marginTop: 2 }}>
                            {a.time ?? "—"} • {a.reason ?? "Consultation"}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: chip.bg,
                          borderWidth: 1,
                          borderColor: chip.border,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Ionicons name={chip.icon as any} size={14} color={chip.text} />
                        <Text style={{ fontWeight: "900", color: chip.text, fontSize: 12 }}>{chip.label}</Text>
                      </View>
                    </View>
                  );
                })}

                {!agenda.length && (
                  <Text style={{ color: theme.colors.muted, fontWeight: "800" }}>
                    Aucun rendez-vous planifié.
                  </Text>
                )}
              </View>
            </View>

            {/* Work queue card */}
            <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text, marginBottom: 12 }]}>
                À traiter
              </Text>

              <View style={{ gap: 10 }}>
                <QueueRow
                  theme={theme}
                  icon="checkmark-done"
                  title="Confirmations à faire"
                  value={String(toConfirm)}
                  hint="Appels / messages"
                />
                <QueueRow
                  theme={theme}
                  icon="cash"
                  title="Paiements à enregistrer"
                  value={String(toBill)}
                  hint="Après consultation"
                />
                <QueueRow
                  theme={theme}
                  icon="refresh"
                  title="Replanifications"
                  value={String(toReschedule)}
                  hint="RDV annulés"
                />
              </View>
            </View>
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.rightColumn}>
            {/* Profile / resume card */}
            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.doctorHeader}>
                <Image source={{ uri: getCurrentRoleImage() }} style={styles.avatar} />
                <View style={styles.doctorInfo}>
                  <Text style={[styles.doctorName, { color: theme.colors.text }]}>
                    {user?.fullname ?? "Assistant"}
                  </Text>
                  <Text style={[styles.doctorRole, { color: theme.colors.muted }]}>
                    Assistant • Gestion quotidienne
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <DoctorStat label="RDV (total)" value={String(visits.length)} theme={theme} />
              <DoctorStat label="En attente" value={String(pendingCount)} theme={theme} />
              <DoctorStat
                label="Progression"
                value={`${Math.round((completedCount / Math.max(1, visits.length)) * 100)}%`}
                theme={theme}
                progress={Math.round((completedCount / Math.max(1, visits.length)) * 100)}
              />
            </View>

            {/* Recent activity */}
            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface, marginTop: 16 }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Activité récente</Text>

              <View style={styles.activityList}>
                <ActivityItem title="Visite créée" time="Il y a 10 min" icon="calendar-outline" theme={theme} />
                <ActivityItem title="Patient enregistré" time="Il y a 45 min" icon="person-add-outline" theme={theme} />
                <ActivityItem title="Paiement ajouté" time="Il y a 2 h" icon="cash-outline" theme={theme} />
              </View>
            </View>

            {/* Quick actions */}
            <View style={[styles.doctorCard, { backgroundColor: theme.colors.surface, marginTop: 16 }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Actions rapides</Text>

              <View style={{ gap: 10 }}>
                <QuickAction label="Créer une visite" icon="add-circle-outline" theme={theme} />
                <QuickAction label="Rechercher un patient" icon="search-outline" theme={theme} />
                <QuickAction label="Encaisser un paiement" icon="card-outline" theme={theme} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* -------------------- helper components -------------------- */

function statusChip(status: VisitStatus, theme: any) {
  switch (status) {
    case "pending":
      return {
        label: "À confirmer",
        icon: "time",
        bg: "rgba(59, 130, 246, 0.10)",
        border: "rgba(59, 130, 246, 0.22)",
        text: theme.colors.primary,
      };
    case "in_consultation":
      return {
        label: "En cours",
        icon: "pulse",
        bg: "rgba(13, 110, 253, 0.10)",
        border: "rgba(13, 110, 253, 0.22)",
        text: theme.colors.primary,
      };
    case "completed":
      return {
        label: "Terminé",
        icon: "checkmark-circle",
        bg: "rgba(34, 197, 94, 0.12)",
        border: "rgba(34, 197, 94, 0.26)",
        text: theme.colors.success,
      };
    case "cancelled":
    default:
      return {
        label: "Annulé",
        icon: "close-circle",
        bg: "rgba(239, 68, 68, 0.10)",
        border: "rgba(239, 68, 68, 0.22)",
        text: theme.colors.error,
      };
  }
}

function SoftActionChip({ theme, icon, label, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.22)",
        backgroundColor: "rgba(255,255,255,0.12)",
      }}
    >
      <Ionicons name={icon} size={16} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "900" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ title, value, icon, tone, theme }: any) {
  const toneColor =
    tone === "success"
      ? theme.colors.success
      : tone === "error"
        ? theme.colors.error
        : tone === "info"
          ? theme.colors.info
          : theme.colors.primary;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        padding: 18,
        borderRadius: 16,
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: `${toneColor}22`,
            borderWidth: 1,
            borderColor: `${toneColor}33`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={22} color={toneColor} />
        </View>

        <View>
          <Text style={{ fontSize: 28, fontWeight: "900", color: theme.colors.text }}>{value}</Text>
          <Text style={{ fontSize: 13, fontWeight: "800", color: theme.colors.textSecondary }}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

function QueueRow({ theme, icon, title, value, hint }: any) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "900", color: theme.colors.text }}>{title}</Text>
        <Text style={{ marginTop: 2, color: theme.colors.muted, fontWeight: "700", fontSize: 12 }}>{hint}</Text>
      </View>

      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text style={{ fontWeight: "900", color: theme.colors.text }}>{value}</Text>
      </View>
    </View>
  );
}

function DoctorStat({ label, value, theme, progress }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, marginBottom: 4, fontWeight: "700", color: theme.colors.muted }}>
        {label}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ fontWeight: "900", fontSize: 18, color: theme.colors.text }}>{value}</Text>

        {progress !== undefined && (
          <View
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              overflow: "hidden",
              backgroundColor: theme.colors.border,
            }}
          >
            <View
              style={{
                height: "100%",
                borderRadius: 999,
                backgroundColor: theme.colors.success,
                width: `${Math.max(0, Math.min(100, progress))}%`,
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function ActivityItem({ title, time, icon, theme }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.accent,
        }}
      >
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "800", fontSize: 14, color: theme.colors.text }}>{title}</Text>
        <Text style={{ fontSize: 12, marginTop: 2, color: theme.colors.muted }}>{time}</Text>
      </View>
    </View>
  );
}

function QuickAction({ label, icon, theme }: any) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={{ fontWeight: "900", color: theme.colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}
