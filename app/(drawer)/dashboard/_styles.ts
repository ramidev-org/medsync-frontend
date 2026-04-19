import { StyleSheet } from "react-native";

export const getDashboardStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
    },
    row: { flexDirection: "row", gap: 24 },
    leftColumn: { flex: 2, gap: 20 },
    rightColumn: { flex: 1 },

    welcomeCard: {
      backgroundColor: theme.colors.primary,
      padding: 28,
      borderRadius: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    welcomeTitle: { color: "#fff", fontSize: 24, fontWeight: "700" },
    welcomeSubtitle: {
      color: "rgba(255, 255, 255, 0.85)",
      marginTop: 6,
      fontSize: 15,
    },

    statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },

    tabs: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
    tab: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    tabText: { fontWeight: "700", fontSize: 13 },

    chartCard: {
      borderRadius: 16,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden",
    },
    cardTitle: { fontWeight: "700", fontSize: 18, marginBottom: 20 },
    chartPlaceholder: { alignItems: "center", width: "100%", overflow: "hidden" },
    chart: { borderRadius: 12, marginVertical: 8 },

    doctorCard: {
      padding: 24,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    doctorHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    doctorInfo: { flex: 1 },
    doctorName: { fontWeight: "700", fontSize: 16 },
    doctorRole: { fontSize: 13, marginTop: 2 },
    divider: { height: 1, marginVertical: 20 },

    sectionTitle: { fontWeight: "700", fontSize: 15, marginBottom: 16 },
    activityList: { gap: 12 },
  });

// This file is imported as a helper module, but it's also under `app/` so expo-router
// treats it as a route. Provide a harmless default export to satisfy route scanning.
export default function DashboardStylesRoute() {
  return null;
}
