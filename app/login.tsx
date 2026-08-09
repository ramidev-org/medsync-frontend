import { useAuth } from "@/contexts/auth_context";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Login() {
  const fade = useRef(new Animated.Value(0)).current;
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Animated.View style={[styles.content, { opacity: fade }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>MedSync</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to your clinic dashboard
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                placeholder="doctor@clinic.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.label}>Password</Text>
                <Pressable>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </Pressable>
              </View>
              <TextInput
                placeholder="••••••••"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Pressable style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Sign In</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => router.push("/activate-clinic")}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                Have an activation link? Activate clinic
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/accept-invite")}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                Invited as staff? Register with invite
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Professional access for clinic management
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    minHeight: "100%",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  content: {
    maxWidth: 480,
    width: "100%",
    marginHorizontal: "auto",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: "600",
    color: "#0D6EFD",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6c757d",
    lineHeight: 22,
  },
  error: {
    color: "#dc3545",
    backgroundColor: "#f8d7da",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  forgotPassword: {
    fontSize: 13,
    color: "#0D6EFD",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#212529",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#0D6EFD",
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
    shadowColor: "#0D6EFD",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e9ecef",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#6c757d",
    fontSize: 14,
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  secondaryButtonText: {
    color: "#0D6EFD",
    fontWeight: "500",
    textAlign: "center",
    fontSize: 15,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 20,
  },
});
