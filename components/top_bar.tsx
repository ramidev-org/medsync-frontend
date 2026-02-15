import PatientForm from "@/components/new_patient"; // Import the patient form
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/auth_context";

interface TopBarProps {
  theme: any;
}

export const TopBar: React.FC<TopBarProps> = ({ theme }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [patientFormVisible, setPatientFormVisible] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout(); // wait for signOut
      setMenuVisible(false);
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const styles = createStyles(theme);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date())
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <>
      <View style={styles.container}>
        {/* Left side: Date */}
        <Text style={styles.dateText}>{dateLabel}</Text>

        {/* Right side: actions */}
        <View style={styles.rightSection}>
          {/* Nouveau Patient button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setPatientFormVisible(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Nouveau Patient</Text>
          </TouchableOpacity>

          {/* Icons */}
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
            <Image
              source={{ uri: "https://i.pravatar.cc/40" }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {menuVisible && (
            <View style={styles.avatarMenu}>
              <TouchableOpacity
                style={styles.avatarMenuItem}
                onPress={() => {
                  setMenuVisible(false);       // close dropdown
                  router.push("/profile"); // navigate to profile page
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={theme.colors.text}
                />
                <Text style={styles.avatarMenuText}>Profile</Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.avatarMenuItem}
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons
                  name="settings-outline"
                  size={18}
                  color={theme.colors.text}
                />
                <Text style={styles.avatarMenuText}>Settings</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.avatarMenuItem}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                <Text style={[styles.avatarMenuText, { color: "#ef4444" }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Patient Form Dialog */}
      <PatientForm
        visible={patientFormVisible}
        onClose={() => setPatientFormVisible(false)}
      />
    </>
  );
};

// ... rest of your styles

/* ================= STYLES ================= */

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
    iconButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      marginLeft: 4,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: theme.colors.border,
      marginLeft: 8,
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
