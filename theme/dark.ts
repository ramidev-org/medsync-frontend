import { colors } from "./colors";
import { fonts } from "./fonts";

export const darkTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.dark.background,
    surface: colors.dark.surface,
    text: colors.dark.text,
    border: colors.dark.border,
    error: colors.error,
  },
  fonts,
  card: {
    radius: 12,
    elevation: 2,
  },
};
