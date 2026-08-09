import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { View, ViewProps } from "react-native";

interface ThemedCardProps extends ViewProps {
  children: React.ReactNode;
}
export const ThemedCard: React.FC<ThemedCardProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 20,
          position: "relative",
          overflow: "hidden",

          // subtle shadow for web (washed/light theme)
          boxShadow: "0px 2px 10px rgba(17,24,39,0.06)",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
