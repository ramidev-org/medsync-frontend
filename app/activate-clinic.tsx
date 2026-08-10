import { callRpcTokenStatus, invokeEdgeFunction } from "@/services/backend";
import type {
  ActivateClinicBody,
  ActivationLinkStatus,
} from "@/services/backend.types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type TokenState = {
  loading: boolean;
  status: "valid" | "invalid" | "expired" | "used" | null;
  details: ActivationLinkStatus | null;
  error: string | null;
};

const isBlocked = (s: TokenState["status"]) =>
  s === "invalid" || s === "expired" || s === "used";

export default function ActivateClinicPage() {
  const fade = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();

  const initialToken = useMemo(() => {
    const raw = params?.token;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] ?? "" : raw;
  }, [params?.token]);

  const [token, setToken] = useState(initialToken);
  const [tokenState, setTokenState] = useState<TokenState>({
    loading: false,
    status: null,
    details: null,
    error: null,
  });

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    username: "",
    clinic_name: "",
    clinic_code: "",
    state: "",
    city: "",
    street: "",
    google_maps_address: "",
    speciality: "",
    license_number: "",
    years_of_experience: "",
    consultation_fee: "",
    bio: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token.trim()) {
        setTokenState({ loading: false, status: null, details: null, error: null });
        return;
      }

      setTokenState({ loading: true, status: null, details: null, error: null });
      try {
        const status = await callRpcTokenStatus<ActivationLinkStatus>(
          "rpc_get_activation_link_status",
          token.trim(),
        );
        if (cancelled) return;

        const normalized: TokenState["status"] = (() => {
          if (status?.status) return status.status;
          if (status?.valid === true) return "valid";
          if (status?.valid === false) {
            const r = String(status.reason ?? "").toLowerCase();
            if (r === "expired") return "expired";
            if (r === "already_used" || r === "license_already_used") return "used";
            return "invalid";
          }
          return null;
        })();

        setTokenState({
          loading: false,
          status: normalized,
          details: status ?? null,
          error: null,
        });

        // Prefill read-only-ish context if backend provides it.
        if (status?.clinic_name) {
          setForm((p) => ({ ...p, clinic_name: String(status.clinic_name ?? "") }));
        }
        if (status?.clinic_code) {
          setForm((p) => ({ ...p, clinic_code: String(status.clinic_code ?? "") }));
        }
      } catch (e: any) {
        if (cancelled) return;
        setTokenState({
          loading: false,
          status: null,
          details: null,
          error: e?.message || "Failed to validate activation link.",
        });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const update = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const canSubmit = !submitting && !!token.trim() && tokenState.status === "valid";

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!token.trim()) return setError("Activation token is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.password) return setError("Password is required.");
    if (!form.full_name.trim()) return setError("Full name is required.");
    if (!form.clinic_name.trim()) return setError("Clinic name is required.");

    if (tokenState.status !== "valid") {
      return setError("Validate this activation link before continuing.");
    }

    setSubmitting(true);
    try {
      const body: ActivateClinicBody = {
        token: token.trim(),
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        clinic_name: form.clinic_name.trim(),
        ...(form.username.trim() ? { username: form.username.trim() } : {}),
        ...(form.clinic_code.trim() ? { clinic_code: form.clinic_code.trim() } : {}),
        ...(form.state.trim() ? { state: form.state.trim() } : {}),
        ...(form.city.trim() ? { city: form.city.trim() } : {}),
        ...(form.street.trim() ? { street: form.street.trim() } : {}),
        ...(form.google_maps_address.trim()
          ? { google_maps_address: form.google_maps_address.trim() }
          : {}),
        ...(form.speciality.trim() ? { speciality: form.speciality.trim() } : {}),
        ...(form.license_number.trim() ? { license_number: form.license_number.trim() } : {}),
        ...(form.years_of_experience.trim()
          ? { years_of_experience: Number(form.years_of_experience) }
          : {}),
        ...(form.consultation_fee.trim()
          ? { consultation_fee: Number(form.consultation_fee) }
          : {}),
        ...(form.bio.trim() ? { bio: form.bio.trim() } : {}),
      };

      await invokeEdgeFunction<unknown, ActivateClinicBody>("activate-clinic", body);
      setSuccess("Clinic activated. You can now sign in.");

      // Give UI a beat then move to login.
      setTimeout(() => router.replace("/login"), 600);
    } catch (e: any) {
      setError(e?.message || "Activation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const tokenBanner = (() => {
    if (tokenState.loading) return "Checking activation link...";
    if (tokenState.error) return tokenState.error;
    if (!token.trim()) return "Paste your activation token to continue.";
    if (tokenState.status === "valid") return "Activation link is valid.";
    if (tokenState.status === "expired") return "This activation link has expired.";
    if (tokenState.status === "used") return "This activation link was already used.";
    if (tokenState.status === "invalid") return "Invalid activation link.";
    return "";
  })();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.header}>
          <Text style={styles.logo}>MedSync</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Activate Clinic</Text>
          <Text style={styles.subtitle}>
            Use your clinic activation link to create the admin doctor account.
          </Text>

          {!!tokenBanner && (
            <Text
              style={[
                styles.banner,
                tokenState.status === "valid" && styles.bannerOk,
                isBlocked(tokenState.status) && styles.bannerBad,
              ]}
            >
              {tokenBanner}
            </Text>
          )}

          {error ? <Text style={[styles.banner, styles.bannerBad]}>{error}</Text> : null}
          {success ? <Text style={[styles.banner, styles.bannerOk]}>{success}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activation Token</Text>
              <TextInput
                style={styles.input}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                placeholder="Paste token from activation link"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.full_name}
                  onChangeText={(v) => update("full_name", v)}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Username (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.username}
                  onChangeText={(v) => update("username", v)}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => update("email", v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={form.password}
                  onChangeText={(v) => update("password", v)}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Clinic Name</Text>
                <TextInput
                  style={styles.input}
                  value={form.clinic_name}
                  onChangeText={(v) => update("clinic_name", v)}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Clinic Code (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.clinic_code}
                  onChangeText={(v) => update("clinic_code", v)}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>State (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.state}
                  onChangeText={(v) => update("state", v)}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>City (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  onChangeText={(v) => update("city", v)}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Street (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.street}
                  onChangeText={(v) => update("street", v)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Google Maps Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.google_maps_address}
                onChangeText={(v) => update("google_maps_address", v)}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Speciality (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.speciality}
                  onChangeText={(v) => update("speciality", v)}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>License Number (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.license_number}
                  onChangeText={(v) => update("license_number", v)}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Years of Experience (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.years_of_experience}
                  onChangeText={(v) => update("years_of_experience", v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Consultation Fee (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.consultation_fee}
                  onChangeText={(v) => update("consultation_fee", v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio (optional)</Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: "top" as any }]}
                value={form.bio}
                onChangeText={(v) => update("bio", v)}
                multiline
              />
            </View>

            <Pressable
              style={[
                styles.button,
                (!canSubmit || tokenState.loading) && styles.buttonDisabled,
              ]}
              disabled={!canSubmit || tokenState.loading}
              onPress={handleSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Activate Clinic</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.replace("/login")} style={styles.linkBtn}>
              <Text style={styles.linkText}>Already activated? Sign in</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { minHeight: "100%", paddingVertical: 40, paddingHorizontal: 20 },
  content: { maxWidth: 720, width: "100%", marginHorizontal: "auto" as any },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { fontSize: 32, fontWeight: "600", color: "#0D6EFD" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  title: { fontSize: 26, fontWeight: "600", color: "#212529", marginBottom: 5 },
  subtitle: { fontSize: 15, color: "#6c757d", marginBottom: 16 },
  banner: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#EEF2FF",
    color: "#1F2937",
  },
  bannerOk: { backgroundColor: "#DCFCE7", color: "#166534" },
  bannerBad: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  form: { gap: 14 },
  row: { flexDirection: "row", gap: 10 },
  rowItem: { flex: 1 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 4, color: "#212529" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#212529",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#0D6EFD",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  buttonDisabled: { opacity: 0.7 },
  linkBtn: { paddingVertical: 10, alignItems: "center" },
  linkText: { color: "#0D6EFD", fontWeight: "700" },
});
