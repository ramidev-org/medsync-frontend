"use client";

import { useAuth } from "@/contexts/auth_context";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";


export default function Signup() {
  const fade = useRef(new Animated.Value(0)).current;
  const { signupWithLicense } = useAuth();
  const router = useRouter();

  const [license, setLicense] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicCode, setClinicCode] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [googleMapsAddress, setGoogleMapsAddress] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignup = async () => {
    if (!fullName || !email || !password || !clinicName || !state || !city || !street) {
      return setError("Please fill all required fields");
    }

    setError("");
    setLoading(true);

    try {
      await signupWithLicense({
        licenseKey: license,
        fullName,
        email,
        password,
        clinicName,
        clinicCode,
        state,
        city,
        street,
        googleMapsAddress,
      });
      router.replace("/login");

    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>MedSync</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Clinic Signup</Text>
          <Text style={styles.subtitle}>Enter your details to get started</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* License Input */}
          <View style={styles.licenseRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>License Key (optional)</Text>
              <TextInput
                placeholder="XXXX-XXXX-XXXX-XXXX"
                autoCapitalize="characters"
                style={styles.input}
                value={license}
                onChangeText={setLicense}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Form Rows */}
          <View style={styles.form}>
            {/* Name, Email, Password */}
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Password</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
              </View>
            </View>

            {/* Clinic Name & Code */}
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Clinic Name</Text>
                <TextInput style={styles.input} value={clinicName} onChangeText={setClinicName} />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Clinic Code (optional)</Text>
                <TextInput style={styles.input} value={clinicCode} onChangeText={setClinicCode} />
              </View>
            </View>

            {/* Location Row */}
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>State</Text>
                <TextInput style={styles.input} value={state} onChangeText={setState} />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>City</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Street</Text>
                <TextInput style={styles.input} value={street} onChangeText={setStreet} />
              </View>
            </View>

            {/* Google Maps */}
            <View>
              <Text style={styles.label}>Google Maps Address (optional)</Text>
              <TextInput
                style={styles.input}
                value={googleMapsAddress}
                onChangeText={setGoogleMapsAddress}
              />
            </View>

            {/* Signup Button */}
            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={handleSignup}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
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
  content: { maxWidth: 600, width: "100%", marginHorizontal: "auto" },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { fontSize: 32, fontWeight: "600", color: "#0D6EFD" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 30, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  title: { fontSize: 26, fontWeight: "600", color: "#212529", marginBottom: 5 },
  subtitle: { fontSize: 15, color: "#6c757d", marginBottom: 20 },
  error: { color: "#dc3545", backgroundColor: "#f8d7da", padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 14 },
  licenseRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  form: { gap: 15 },
  row: { flexDirection: "row", gap: 10 },
  rowItem: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#212529" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, fontSize: 15, color: "#212529", backgroundColor: "#fff" },
  button: { backgroundColor: "#0D6EFD", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  buttonDisabled: {
  opacity: 0.7,
},

});
