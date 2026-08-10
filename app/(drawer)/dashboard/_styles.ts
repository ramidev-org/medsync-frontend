import { PAGE_GUTTER, getWebContainerFill } from "@/theme/layout";
import { StyleSheet } from "react-native";

export const getDashboardStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    container: {
      paddingHorizontal: PAGE_GUTTER,
      paddingTop: 18,
      paddingBottom: 30,
      ...getWebContainerFill(),
    },
    row: { flexDirection: "row", gap: 18, flexWrap: "wrap" },
    leftColumn: { flex: 2, gap: 14, minWidth: 360 },
    rightColumn: { flex: 1, minWidth: 320 },

    welcomeCard: {
      display: "none",
      backgroundColor: theme.colors.surface,
      padding: 22,
      minHeight: 174,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: "center",
    },
    welcomeTitle: { color: theme.colors.text, fontSize: 26, fontWeight: "700" },
    welcomeSubtitle: {
      color: theme.colors.textSecondary,
      marginTop: 6,
      fontSize: 14,
      fontWeight: "700",
    },

    statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 14, flexWrap: "wrap" },

    rangeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 9,
      backgroundColor: theme.colors.surface,
    },

    tabs: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
    tab: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 2,
    },
    tabText: { fontWeight: "700", fontSize: 13 },

    chartCard: {
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
    },
    cardTitle: { fontWeight: "600", fontSize: 17, marginBottom: 14, color: theme.colors.text },
    chartPlaceholder: { alignItems: "center", width: "100%", overflow: "hidden" },
    chart: { borderRadius: 12, marginVertical: 8 },

    doctorCard: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
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
    quickCard: {
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    quickRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  });

// This file is imported as a helper module, but it's also under `app/` so expo-router
// treats it as a route. Provide a harmless default export to satisfy route scanning.
export default function DashboardStylesRoute() {
  return null;
}
