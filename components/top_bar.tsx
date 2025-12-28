import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/auth_context"; // adjust path

interface TopBarProps {
  theme: any; // replace with your theme type if you have one
}

export const TopBar: React.FC<TopBarProps> = ({ theme }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setMenuVisible(false);
    router.replace("/login"); // redirect to login page
  };

  return (
    <View
      style={{
        height: 60,
        backgroundColor: theme.colors.surface,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
        zIndex: 1,
      }}
    >
      {/* Left side: you can keep logo or empty */}
      <View style={{ width: 100 }} />

      {/* Right side: date + button + icons */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Nouveau Patient button next to the date */}
        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Nouveau Patient</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text,
            marginHorizontal: 8,
          }}
        >
          Mardi 31/05/2022
        </Text>

        {/* Icons */}
        <TouchableOpacity style={{ marginHorizontal: 8 }}>
          <Ionicons name="calendar" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginHorizontal: 8 }}>
          <Ionicons
            name="chatbubble-ellipses"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginHorizontal: 8 }}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
          <Image
            source={{ uri: "https://i.pravatar.cc/40" }}
            style={{ width: 32, height: 32, borderRadius: 16, marginLeft: 8 }}
          />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {menuVisible && (
          <View style={styles.avatarMenu}>
            <TouchableOpacity style={styles.avatarMenuItem} onPress={() => {}}>
              <Text style={styles.avatarMenuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarMenuItem} onPress={() => {}}>
              <Text style={styles.avatarMenuText}>Settings</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.avatarMenuItem}
              onPress={handleLogout}
            >
              <Text style={[styles.avatarMenuText, { color: "red" }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },

  /* ===== HERO ===== */
  hero: {
    borderRadius: 16,
    padding: 24,
    margin: 16,
    overflow: "hidden",
  },
  welcome: {
    color: "#e0f2fe",
    fontSize: 12,
    letterSpacing: 1,
  },
  brand: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginVertical: 4,
  },
  subtitle: {
    color: "#e0f2fe",
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  heroButtons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  secondaryBtnText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  plusTop: {
    position: "absolute",
    top: -10,
    right: 20,
  },
  plusBottom: {
    position: "absolute",
    bottom: 10,
    right: 80,
  },

  /* ===== CARDS ===== */
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 16,
    justifyContent: "space-between", // ensures even spacing
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "30%", // two cards per row
    marginBottom: 16,
    elevation: 4,
  },

  cardIcon: {
    backgroundColor: "#e0f2fe",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  status: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBtn: {
    borderWidth: 1,
    borderColor: "#6366f1",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  cardBtnText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  iconBtn: {
    padding: 6,
  },
  // Avatar dropdown menu
  avatarMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  avatarMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  avatarMenuText: {
    fontSize: 16,
    color: "#333",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
  },
});
