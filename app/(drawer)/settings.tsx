import { ThemedCard } from "@/components/default_card";
import { PageShell } from "@/components/page_shell";
import { normalizeSpeciality, specialityLabelFr } from "@/config/speciality";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
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
  const { isClinicAdmin, clinic, subscription } = useAppData();
  const router = useRouter();
  const role = (user?.user_type as any) ?? "assistant";

  const expiresLabel = useMemo(() => {
    const iso = subscription?.expires_at;
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(iso));
    } catch {
      return String(iso);
    }
  }, [subscription?.expires_at]);

  return (
    <PageShell
      title="Paramètres"
      subtitle="Compte, clinique, abonnement et intégrations"
      actions={
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{String(role).toUpperCase()}</Text>
        </View>
      }
    >
      <ThemedCard style={{ padding: 18 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: theme.colors.text }}>
          Clinique & Abonnement
        </Text>
        <Text style={{ marginTop: 4, color: theme.colors.muted, fontWeight: "700" }}>
          {clinic?.name ? String(clinic.name) : "—"}
        </Text>

        <View style={{ marginTop: 12, gap: 8 }}>
          <KeyVal k="Plan" v={subscription?.tier_plan || clinic?.tier_plan || "basic"} theme={theme} />
          <KeyVal
            k="Statut"
            v={
              subscription?.status === "active"
                ? "Actif"
                : subscription?.status === "expired"
                  ? "Expiré"
                  : subscription?.status === "revoked"
                    ? "Révoqué"
                    : "Non configuré"
            }
            theme={theme}
          />
          <KeyVal k="Expiration" v={expiresLabel} theme={theme} />
          <KeyVal
            k="Staff"
            v={
              typeof subscription?.current_doctors === "number"
                ? `${subscription.current_doctors}/${subscription.max_doctors ?? "—"} médecins • ${subscription.current_assistants ?? 0}/${subscription.max_assistants ?? "—"} assistants`
                : "—"
            }
            theme={theme}
          />
        </View>

        {!!isClinicAdmin && (
          <View style={{ marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <PrimaryButton
              label="Utilisateurs"
              icon="people-outline"
              theme={theme}
              onPress={() => router.push("/users")}
              compact
            />
            <PrimaryButton
              label="Imagerie Tools"
              icon="settings-outline"
              theme={theme}
              onPress={() => router.push("/imaging-tools")}
              compact
            />
          </View>
        )}
      </ThemedCard>

      {role === "doctor" && (
        <>
          <View style={{ height: 16 }} />
          <DoctorSettings theme={theme} />
          {isClinicAdmin && (
            <>
              <View style={{ height: 16 }} />
              <ClinicAdminSettings theme={theme} />
            </>
          )}
        </>
      )}
      {role === "assistant" && (
        <>
          <View style={{ height: 16 }} />
          <AssistantSettings theme={theme} />
        </>
      )}
    </PageShell>
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

function AssistantSettings({ theme }: any) {
  const { user } = useAuth();
  const [department, setDepartment] = useState(
    String((user as any)?.assistantProfile?.department ?? "Accueil"),
  );
  const [shiftStart, setShiftStart] = useState(
    String((user as any)?.assistantProfile?.shift_start ?? "08:00"),
  );
  const [shiftEnd, setShiftEnd] = useState(
    String((user as any)?.assistantProfile?.shift_end ?? "16:00"),
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
  const { clinic } = useAppData();
  const clinics = clinic ? [clinic] : [];
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
              <Text style={{ marginTop: 3, color: theme.colors.muted }}>
                {[c.street, c.city, c.state].filter(Boolean).join(", ") || "—"}
              </Text>
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

function KeyVal({ k, v, theme }: { k: string; v: string; theme: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800" }}>{k}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: "900" }}>{v}</Text>
    </View>
  );
}

function PrimaryButton({ label, icon, onPress, theme, compact }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: compact ? 0 : 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingVertical: compact ? 10 : 12,
        paddingHorizontal: compact ? 12 : 14,
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
