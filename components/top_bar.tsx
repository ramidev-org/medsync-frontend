import PatientForm from "@/components/new_patient";
import { getCurrentRoleImage } from "@/config/runtime";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/auth_context";

interface TopBarProps {
  theme: any;
}

export const TopBar: React.FC<TopBarProps> = ({ theme }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [patientFormVisible, setPatientFormVisible] = useState(false);

  const { logout, user } = useAuth();
  const router = useRouter();

  const role = (user?.role ?? "doctor") as "doctor" | "reception";

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuVisible(false);
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date())
    .replace(/^./, (c) => c.toUpperCase());

  // --- Role-based primary action ---
  const showPrimary = true;
  const primaryLabel = role === "reception" ? "Nouvelle Visite" : "Nouveau Patient";

  const onPrimaryPress = () => {
    if (role === "reception") {
      router.push("/visits"); // or open a Visit form modal
      return;
    }
    // doctor
    setPatientFormVisible(true);
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.dateText}>{dateLabel}</Text>

        <View style={styles.rightSection}>
          {/* Primary button (role-based) */}
          {showPrimary && (
            <Pressable
              onPress={onPrimaryPress}
              style={({ hovered, pressed }) => [
                styles.primaryBtn,
                hovered && Platform.OS === "web" ? styles.hover : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </Pressable>
          )}

          {/* ✅ Calendar button removed */}

          {/* Chat */}
          <Pressable
            onPress={() => router.push("/chats")}
            style={({ hovered, pressed }) => [
              styles.iconButton,
              hovered && Platform.OS === "web" ? styles.hover : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.colors.text} />
          </Pressable>

          {/* Notifications */}
          <Pressable
            onPress={() => {}}
            style={({ hovered, pressed }) => [
              styles.iconButton,
              hovered && Platform.OS === "web" ? styles.hover : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          </Pressable>

          {/* Avatar */}
          <Pressable
            onPress={() => setMenuVisible(!menuVisible)}
            style={({ hovered, pressed }) => [
              hovered && Platform.OS === "web" ? styles.hover : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Image source={{ uri: getCurrentRoleImage() }} style={styles.avatar} />
          </Pressable>

          {/* Dropdown */}
          {menuVisible && (
            <View style={styles.avatarMenu}>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.avatarMenuItem,
                  hovered && Platform.OS === "web" ? styles.menuHover : null,
                  pressed ? styles.menuPressed : null,
                ]}
                onPress={() => {
                  setMenuVisible(false);
                  router.push("/profile");
                }}
              >
                <Ionicons name="person-outline" size={18} color={theme.colors.text} />
                <Text style={styles.avatarMenuText}>Profile</Text>
              </Pressable>

              <Pressable
                style={({ hovered, pressed }) => [
                  styles.avatarMenuItem,
                  hovered && Platform.OS === "web" ? styles.menuHover : null,
                  pressed ? styles.menuPressed : null,
                ]}
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons name="settings-outline" size={18} color={theme.colors.text} />
                <Text style={styles.avatarMenuText}>Settings</Text>
              </Pressable>

              <View style={styles.menuDivider} />

              <Pressable
                style={({ hovered, pressed }) => [
                  styles.avatarMenuItem,
                  hovered && Platform.OS === "web" ? styles.menuHover : null,
                  pressed ? styles.menuPressed : null,
                ]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                <Text style={[styles.avatarMenuText, { color: "#ef4444" }]}>Logout</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Patient Form only for doctor */}
      <PatientForm
        visible={patientFormVisible}
        onClose={() => setPatientFormVisible(false)}
      />
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      height: 64,
      backgroundColor: theme.colors.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      zIndex: 1,
    },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    primaryBtnText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 14,
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: "500",
    },

    // ✅ no background now
    iconButton: {
      padding: 6,
      borderRadius: 10,
      backgroundColor: "transparent",
    },

    avatar: {
      width: 45,
      height: 45,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },

    // global-ish button feedback (uses theme tokens)
    hover: {
      backgroundColor: theme.colors.hoverBg,
    },
    pressed: {
      backgroundColor: theme.colors.pressedBg,
      transform: [{ scale: 0.98 }],
    },

    avatarMenu: {
      position: "absolute",
      top: 56,
      right: 0,
      minWidth: 180,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      zIndex: 20,
      paddingVertical: 8,
    },
    avatarMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginHorizontal: 6,
    },
    menuHover: {
      backgroundColor: theme.colors.hoverBg,
    },
    menuPressed: {
      backgroundColor: theme.colors.pressedBg,
    },
    avatarMenuText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: "500",
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 8,
    },
  });
