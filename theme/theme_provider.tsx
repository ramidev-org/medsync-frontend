import React, { createContext, useContext, useState } from "react";
import { darkTheme } from "./dark";
import { lightTheme } from "./light";

type Theme = typeof lightTheme;

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((v) => !v);

  return (
    <ThemeContext.Provider
      value={{ theme: isDark ? darkTheme : lightTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
