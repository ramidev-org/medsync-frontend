import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { ScrollView, StyleSheet, View } from "react-native";

export default function PatientsPage() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* ===== TOP BAR ===== */}
      <TopBar theme={theme} />

      {/* ===== PAGE CONTENT ===== */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* 🔽 PUT YOUR PAGE CONTENT HERE 🔽 */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 32,
  },
});
