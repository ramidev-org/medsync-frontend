import React, { createContext, useContext } from "react";
import { appTheme } from "./app_theme";

type Theme = typeof appTheme;

const ThemeContext = createContext<{
  theme: Theme;
  // Dark mode removed; keep for backward compatibility (no-op).
  toggleTheme: () => void;
}>({
  theme: appTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme: appTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
