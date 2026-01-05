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

          // shadow for web
          boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
