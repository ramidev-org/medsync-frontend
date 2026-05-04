import PatientForm from "@/components/new_patient";
import { getCurrentRoleImage } from "@/config/runtime";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

interface TopBarProps {
  theme: any;
}

export const TopBar: React.FC<TopBarProps> = ({ theme }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [patientFormVisible, setPatientFormVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: "n1", title: "New appointment booked", time: "2m", read: false },
    { id: "n2", title: "Lab result uploaded", time: "12m", read: false },
    { id: "n3", title: "Subscription renews in 5 days", time: "1h", read: true },
  ]);
  const { logout, user } = useAuth();
  const { clinic, isClinicAdmin, subscription } = useAppData();
  const router = useRouter();
  const role = (user?.user_type ?? "doctor") as "doctor" | "assistant";
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => setIsMounted(true), []);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuVisible(false);
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const dateLabel = useMemo(() => {
    if (!isMounted) return " ";
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
      .format(new Date())
      .replace(/^./, (char) => char.toUpperCase());
  }, [isMounted]);

  const onPrimaryPress = () => {
    if (role === "assistant") return router.push("/visits");
    setPatientFormVisible(true);
  };

  const subscriptionBadge = useMemo(() => {
    const status = subscription?.status ?? "missing";
    const label =
      status === "active" ? "Active" : status === "expired" ? "Expired" : status === "revoked" ? "Revoked" : "Missing";
    const bg =
      status === "active"
        ? theme.colors.success
        : status === "expired"
          ? theme.colors.warning
          : status === "revoked"
            ? theme.colors.error
            : theme.colors.surfaceVariant;
    const fg = status === "missing" ? theme.colors.text : "#fff";
    return { label, bg, fg };
  }, [subscription?.status, theme.colors]);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.dateText}>{dateLabel}</Text>
          <View style={styles.rightSection}>
            <Pressable onPress={onPrimaryPress} style={({ hovered, pressed }) => [styles.primaryBtn, hovered && Platform.OS === "web" ? styles.hover : null, pressed ? styles.pressed : null]}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{role === "assistant" ? "Nouvelle Visite" : "Nouveau Patient"}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setNotificationsOpen((v) => !v);
                setMenuVisible(false);
              }}
              style={({ hovered, pressed }) => [styles.iconButton, hovered && Platform.OS === "web" ? styles.hover : null, pressed ? styles.pressed : null]}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
            </Pressable>
            {notificationsOpen && (
              <View style={styles.notificationMenu}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>Notifications</Text>
                  <Pressable onPress={() => setNotifications((old) => old.map((x) => ({ ...x, read: true })))}>
                    <Text style={{ color: theme.colors.primary, fontWeight: "800", fontSize: 12 }}>Mark all read</Text>
                  </Pressable>
                </View>
                {notifications.map((item) => (
                  <View key={item.id} style={styles.notificationRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notificationText, !item.read && { color: theme.colors.text, fontWeight: "800" }]}>{item.title}</Text>
                      <Text style={styles.notificationTime}>{item.time}</Text>
                    </View>
                    <Pressable
                      onPress={() => setNotifications((old) => old.map((x) => (x.id === item.id ? { ...x, read: true } : x)))}
                      style={{ padding: 6 }}
                    >
                      <Ionicons name={item.read ? "checkmark-done-outline" : "checkmark-circle-outline"} size={18} color={item.read ? theme.colors.success : theme.colors.primary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <Pressable onPress={() => setMenuVisible(!menuVisible)} style={({ hovered, pressed }) => [hovered && Platform.OS === "web" ? styles.hover : null, pressed ? styles.pressed : null]}>
              <Image source={{ uri: getCurrentRoleImage() }} style={styles.avatar} />
            </Pressable>
            {menuVisible && (
              <View style={styles.avatarMenu}>
                <View style={styles.menuHeader}>
                  <View style={styles.menuHeaderRow}>
                    <Image source={{ uri: getCurrentRoleImage() }} style={styles.menuAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={styles.menuName}>{user?.fullname || user?.email || "—"}</Text>
                      <Text numberOfLines={1} style={styles.menuSub}>
                        {(clinic?.name ? String(clinic.name) : "Clinic") + " • " + (role === "doctor" ? "Doctor" : "Assistant")}
                        {!!isClinicAdmin && role === "doctor" ? " (Admin)" : ""}
                      </Text>
                    </View>
                    <View style={[styles.subBadge, { backgroundColor: subscriptionBadge.bg }]}>
                      <Text style={[styles.subBadgeText, { color: subscriptionBadge.fg }]}>{subscriptionBadge.label}</Text>
                    </View>
                  </View>
                  <View style={styles.metaGrid}>
                
                  </View>
                </View>
                <Pressable style={styles.avatarMenuItem} onPress={() => { setMenuVisible(false); router.push("/profile"); }}>
                  <Ionicons name="person-outline" size={18} color={theme.colors.text} />
                  <Text style={styles.avatarMenuText}>Profile</Text>
                </Pressable>
                <Pressable style={styles.avatarMenuItem} onPress={() => { setMenuVisible(false); router.push("/settings"); }}>
                  <Ionicons name="settings-outline" size={18} color={theme.colors.text} />
                  <Text style={styles.avatarMenuText}>Settings</Text>
                </Pressable>
                {!!isClinicAdmin && (
                  <Pressable style={styles.avatarMenuItem} onPress={() => { setMenuVisible(false); router.push("/users"); }}>
                    <Ionicons name="people-outline" size={18} color={theme.colors.text} />
                    <Text style={styles.avatarMenuText}>Clinic Staff</Text>
                  </Pressable>
                )}
                <View style={styles.menuDivider} />
                <Pressable style={styles.avatarMenuItem} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
                  <Text style={[styles.avatarMenuText, { color: theme.colors.error }]}>Logout</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
      <PatientForm visible={patientFormVisible} onClose={() => setPatientFormVisible(false)} />
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      height: 68,
      backgroundColor: "rgba(255,255,255,0.9)",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      zIndex: 10,
      ...(Platform.OS === "web" ? ({ position: "sticky", top: 0, backdropFilter: "saturate(180%) blur(16px)", boxShadow: "0px 10px 26px rgba(15,23,42,0.08)" } as any) : null),
    },
    inner: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      ...(Platform.OS === "web" ? ({ maxWidth: 1280, width: "100%", alignSelf: "center" } as any) : null),
    },
    rightSection: { flexDirection: "row", alignItems: "center", gap: 10 },
    primaryBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    dateText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: "700" },
    iconButton: { padding: 8, borderRadius: 12, backgroundColor: "transparent" },
    avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: theme.colors.border },
    hover: { backgroundColor: theme.colors.hoverBg },
    pressed: { backgroundColor: theme.colors.pressedBg, transform: [{ scale: 0.98 }] },
    avatarMenu: { position: "absolute", top: 56, right: 0, minWidth: 360, backgroundColor: theme.colors.background, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, zIndex: 20, paddingVertical: 8 },
    notificationMenu: {
      position: "absolute",
      top: 56,
      right: 58,
      minWidth: 330,
      backgroundColor: theme.colors.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      zIndex: 20,
      padding: 10,
      gap: 8,
    },
    notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    notificationTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
    notificationRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 10, backgroundColor: theme.colors.surface },
    notificationText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 },
    notificationTime: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11, marginTop: 2 },
    menuHeader: { paddingHorizontal: 12, paddingBottom: 8 },
    menuHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
    menuAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.colors.border },
    menuName: { fontWeight: "900", color: theme.colors.text },
    menuSub: { marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 },
    subBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    subBadgeText: { fontWeight: "900", fontSize: 12 },
    metaGrid: { marginTop: 8, gap: 4, paddingHorizontal: 4 },
    metaValue: { color: theme.colors.text, fontWeight: "700", fontSize: 12 },
    avatarMenuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginHorizontal: 6 },
    avatarMenuText: { fontSize: 14, color: theme.colors.text, fontWeight: "600" },
    menuDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
  });
