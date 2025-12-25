import { useAuth } from "@/app/contexts/auth_context";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    login(username, password); // placeholder
    router.replace("/");       // redirect to drawer
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();         // placeholder
    router.replace("/");       // redirect to drawer
  };

  return (
    <LinearGradient
      colors={["#6366f1", "#4f46e5"]}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        <View style={styles.socialBtns}>
          <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
            <FontAwesome name="google" size={24} color="#DB4437" />
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn}>
            <FontAwesome name="facebook" size={24} color="#4267B2" />
            <Text style={styles.socialBtnText}>Facebook</Text>
          </TouchableOpacity>
        </View>
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
    margin:120
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  loginBtn: {
    backgroundColor: "#6366f1",
    width: "100%",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  orText: {
    marginVertical: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  socialBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  socialBtnText: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
    color: "#111827",
  },
});
