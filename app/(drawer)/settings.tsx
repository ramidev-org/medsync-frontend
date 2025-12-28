// QUICK FIX: Update your SettingsPage component

import { TopBar } from "@/components/top_bar";
import { useLocalization } from "@/localization/localization_provider";
import { Profile } from "@/models";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useProfile } from "../../contexts/profile_context";

type SettingsPageProps = {
  profile?: Profile;
  onThemeChanged?: (isDark: boolean) => void; // Make optional
};

export default function SettingsPage({ onThemeChanged }: SettingsPageProps) {
  const { profile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { t, locale, setLanguage } = useLocalization();
  const navigation = useNavigation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Early return with error handling
  if (!profile) {
    return (
      <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
        <TopBar theme={theme} />
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: theme.colors.text }}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const languages = [
    { code: "en", label: "English" },
    { code: "ar", label: "Arabic" },
    { code: "fr", label: "French" },
  ];

  const handleLogout = () => {
    try {
      console.log("Logged out");
      // navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleThemeChange = (val: boolean) => {
    try {
      // Use the callback if provided, otherwise use toggleTheme
      if (onThemeChanged) {
        onThemeChanged(val);
      } else {
        toggleTheme();
      }
    } catch (error) {
      console.error("Theme change error:", error);
    }
  };

  const handleLanguageChange = (code: string) => {};

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />
      <ScrollView style={styles.container}>
        {/* Language Option */}
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialIcons
              name="language"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.title}>{t("language")}</Text>
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            {languages.map((l) => (
              <Pressable
                key={l.code}
                style={[
                  styles.langButton,
                  locale === l.code && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleLanguageChange(l.code)}
              >
                <Text
                  style={{
                    color: locale === l.code ? "#fff" : theme.colors.text,
                  }}
                >
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Theme Option */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="moon" size={24} color={theme.colors.primary} />
            <Text style={styles.title}>{t("dark_theme")}</Text>
          </View>
          <Switch value={theme.dark} onValueChange={handleThemeChange} />
        </View>

        {/* Notifications Option */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="notifications"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.title}>{t("notifications")}</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        {/* Dentist-only Options */}
        {profile.role === "dentist" && (
          <>
            <View style={styles.card}>
              <Pressable
                style={styles.row}
                onPress={() => {
                  try {
                    // navigation.navigate("Workers");
                  } catch (error) {
                    console.error("Navigation error:", error);
                  }
                }}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.title}>{t("workers_management")}</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Pressable
                style={styles.row}
                onPress={() => {
                  try {
                    // navigation.navigate("Patients");
                  } catch (error) {
                    console.error("Navigation error:", error);
                  }
                }}
              >
                <Ionicons
                  name="people"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.title}>{t("patients")}</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* App Version */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="information-circle"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.title}>{`${t("version")} v1.0.0`}</Text>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color={theme.colors.error} />
            <Text style={[styles.title, { color: theme.colors.error }]}>
              {t("logout")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  topBar: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

const getStyles = (theme: any) =>
  StyleSheet.create({
    page: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },
    langButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
