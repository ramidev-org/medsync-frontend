import { useAuth } from "@/contexts/auth_context";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Step = 1 | 2 | 3;

export default function Signup() {
  const { signupWithLicense } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const [licenseKey, setLicenseKey] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLicenseCheck = async () => {
    if (!licenseKey) return alert("Enter license key");
    setStep(2);
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      await signupWithLicense({
        email,
        password,
        fullName,
        licenseKey,
      });
      setStep(3);
    } catch (e: any) {
      alert(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#6366f1", "#4f46e5"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        {/* STEP INDICATOR */}
        <Text style={styles.stepText}>Step {step} of 3</Text>

        {/* STEP 1 – LICENSE */}
        {step === 1 && (
          <>
            <TextInput
              placeholder="License Key"
              value={licenseKey}
              onChangeText={setLicenseKey}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleLicenseCheck}
            >
              <Text style={styles.primaryBtnText}>Verify License</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 – USER INFO */}
        {step === 2 && (
          <>
            <TextInput
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
            />

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "Creating account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3 – SUCCESS */}
        {step === 3 && (
          <>
            <FontAwesome name="check-circle" size={64} color="#22c55e" />
            <Text style={styles.successText}>
              Account created successfully
            </Text>
            <Text style={styles.infoText}>
              You can now log in with your credentials
            </Text>
          </>
        )}
      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  card: {
    width: "25%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    alignItems: "center",
    margin: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111827",
  },
  stepText: {
    marginBottom: 20,
    color: "#6b7280",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  primaryBtn: {
    backgroundColor: "#6366f1",
    width: "100%",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  backText: {
    marginTop: 12,
    color: "#6366f1",
    fontWeight: "600",
  },
  successText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22c55e",
    marginTop: 15,
  },
  infoText: {
    marginTop: 5,
    color: "#6b7280",
  },
});
