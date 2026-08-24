import { colors } from "./colors";
import { fonts } from "./fonts";

// Single light theme for the whole app (dark mode removed).
export const appTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,

    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,

    background: colors.light.background,
    // alternate backgrounds (tables, zebra rows, etc.)
    backgroundAlt: colors.light.surfaceVariant,
    surface: colors.light.surface,
    surfaceVariant: colors.light.surfaceVariant,
    card: colors.light.card,
    text: colors.light.text,
    textSecondary: colors.light.textSecondary,
    border: colors.light.border,
    muted: colors.light.muted,
    disabled: colors.light.disabled,
    overlay: colors.light.overlay,

    // readable-on-primary helper
    textOnPrimary: "#FFFFFF",

    // interaction helpers (web hover/pressed)
    hoverBg: "rgba(37, 99, 235, 0.08)",
    pressedBg: "rgba(37, 99, 235, 0.16)",

    // UI helpers
    primarySoft: colors.soft.primary,
    successSoft: colors.soft.success,
    warningSoft: colors.soft.warning,
    errorSoft: colors.soft.error,
    neutralSoft: colors.soft.neutral,
    chipBg: colors.light.surfaceVariant,
    chipText: colors.primary,

    // Status colors
    statusActive: colors.status.active,
    statusInactive: colors.status.inactive,
    statusUrgent: colors.status.urgent,
    statusScheduled: colors.status.scheduled,
    statusCompleted: colors.status.completed,
    statusCancelled: colors.status.cancelled,

    // Chart colors
    chart1: colors.charts.blue,
    chart2: colors.charts.cyan,
    chart3: colors.charts.teal,
    chart4: colors.charts.amber,
    chart5: colors.charts.pink,
  },
  fonts,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  card: { radius: 16, elevation: 2 },
};
