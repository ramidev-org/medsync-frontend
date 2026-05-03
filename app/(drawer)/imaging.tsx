import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ImagingViewerPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  return (
    <PageShell title="Imaging" subtitle="Imaging is now integrated directly inside patient consultations.">
      <View style={styles.card}>
        <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.success} />
        <Text style={styles.text}>This standalone page is retired to keep workflow focused.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push("/consultations")}>
          <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
          <Text style={styles.btnText}>Open Consultations</Text>
        </TouchableOpacity>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      padding: 18,
      gap: 10,
      alignItems: "flex-start",
    },
    text: { color: theme.colors.textSecondary, fontWeight: "700" },
    btn: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    btnText: { color: "#fff", fontWeight: "800" },
  });
