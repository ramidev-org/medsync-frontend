// theme/tableStyles.ts
import { StyleSheet } from "react-native";

export const createTableStyles = (theme: any) =>
  StyleSheet.create({
    // Card container with border like the old table
    tableCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginVertical: 8,
    },

    // Table header with bottom border
    tableHeader: {
      flexDirection: "row",
      backgroundColor: theme.colors.background,
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.border,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    headerCell: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    headerText: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: theme.colors.text,
    },

    // Rows with bottom border and alternate colors
    tableRow: {
      flexDirection: "row",
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.card, // default background
    },
    tableRowAlt: {
      backgroundColor: theme.colors.backgroundAlt, // alternate row color
    },

    // Cells
    cell: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    cellText: {
      fontSize: 13,
      color: theme.colors.text,
    },

    // Badge like old status indicators
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textOnPrimary,
    },

    // Empty state
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },

    // Pagination
    paginationContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
    },
    paginationButtons: {
      flexDirection: "row",
      gap: 8,
    },
    paginationButton: {
      minWidth: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    paginationText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
  });
