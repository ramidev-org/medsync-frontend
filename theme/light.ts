import { colors } from "./colors";
import { fonts } from "./fonts";

export const lightTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.light.background,
    surface: colors.light.surface,
    text: colors.light.text,
    border: colors.light.border,
    error: colors.error,
  },
  fonts,
  card: {
    radius: 12,
    elevation: 2,
  },
};
