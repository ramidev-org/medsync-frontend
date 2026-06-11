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

export default function Signup() {
  const fade = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const [activationToken, setActivationToken] = useState("");
  const [inviteToken, setInviteToken] = useState("");

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const goActivate = () => {
    const t = activationToken.trim();
    router.push(t ? `/activate-clinic?token=${encodeURIComponent(t)}` : "/activate-clinic");
  };

  const goInvite = () => {
    const t = inviteToken.trim();
    router.push(
      t
        ? {
            pathname: "/invite/[token]",
            params: { token: t },
          }
        : "/accept-invite",
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.header}>
          <Text style={styles.logo}>MedSync</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>
            This app uses clinic activation links and staff invite links.
          </Text>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Activate a clinic (admin doctor)</Text>
            <Text style={styles.blockText}>
              Open your activation link, or paste the token below.
            </Text>
            <TextInput
              placeholder="Activation token (optional)"
              autoCapitalize="none"
              style={styles.input}
              value={activationToken}
              onChangeText={setActivationToken}
              placeholderTextColor="#94a3b8"
            />
            <Pressable style={styles.button} onPress={goActivate}>
              <Text style={styles.buttonText}>Activate Clinic</Text>
            </Pressable>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Accept a staff invite</Text>
            <Text style={styles.blockText}>
              Open your invite link, or paste the token below.
            </Text>
            <TextInput
              placeholder="Invite token (optional)"
              autoCapitalize="none"
              style={styles.input}
              value={inviteToken}
              onChangeText={setInviteToken}
              placeholderTextColor="#94a3b8"
            />
            <Pressable style={styles.buttonSecondary} onPress={goInvite}>
              <Text style={styles.buttonSecondaryText}>Accept Invite</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => router.replace("/login")} style={styles.linkBtn}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </Pressable>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { minHeight: "100%", paddingVertical: 40, paddingHorizontal: 20 },
  content: { maxWidth: 600, width: "100%", marginHorizontal: "auto" as any },
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
  block: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  blockTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  blockText: { fontSize: 14, color: "#475569" },
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
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  buttonSecondary: {
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  buttonSecondaryText: { color: "#0D6EFD", fontWeight: "800", fontSize: 15 },
  linkBtn: { paddingTop: 16, alignItems: "center" },
  linkText: { color: "#0D6EFD", fontWeight: "700" },
});

