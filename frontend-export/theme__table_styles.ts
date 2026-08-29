// theme/tableStyles.ts
import { StyleSheet } from "react-native";

export const createTableStyles = (theme: any) =>
  StyleSheet.create({
    tableCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginVertical: 8,
    },

    tableHeader: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
    headerCell: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    headerText: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      color: theme.colors.textSecondary,
    },

    tableRow: {
      flexDirection: "row",
      paddingVertical: 14,
      paddingHorizontal: 10,
      // A dense list stacks this divider on every row - the full `border`
      // weight (meant for a single card outline) reads as heavy banding
      // once repeated dozens of times, so rows get the lighter hairline.
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
      backgroundColor: theme.colors.card,
    },
    tableRowAlt: {
      // surfaceVariant (used for the header, a single row) is too grey once
      // it's the zebra stripe on every other body row - surfaceSubtle is
      // the same near-white tint used for the Team page's calm surfaces.
      backgroundColor: theme.colors.surfaceSubtle,
    },

    cell: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    cellText: {
      fontSize: 13,
      color: theme.colors.text,
    },

    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      alignSelf: "flex-start",
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textOnPrimary,
    },

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
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    paginationText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
  });
