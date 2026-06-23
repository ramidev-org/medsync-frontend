import React from "react";
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

export const DEFAULT_AVATAR_COLOR = "#2DA8D8";

export type UserAvatarPalette = {
  backgroundColor: string;
  borderColor: string;
  color: string;
};

export function getUserAvatarInitials(name?: string | null) {
  return (
    String(name ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

export function normalizeAvatarColor(value?: string | null) {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : DEFAULT_AVATAR_COLOR;
}

function hexToRgb(hex: string) {
  const normalized = normalizeAvatarColor(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function mixColors(baseHex: string, targetHex: string, weight: number) {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);
  return rgbToHex(
    base.r + (target.r - base.r) * weight,
    base.g + (target.g - base.g) * weight,
    base.b + (target.b - base.b) * weight,
  );
}

export function getUserAvatarPalette(avatarColor?: string | null): UserAvatarPalette {
  const accent = normalizeAvatarColor(avatarColor);
  return {
    backgroundColor: mixColors(accent, "#FFFFFF", 0.82),
    borderColor: mixColors(accent, "#FFFFFF", 0.48),
    color: mixColors(accent, "#0F172A", 0.22),
  };
}

export function UserAvatar({
  name,
  avatarColor,
  size,
  square = false,
  small = false,
  palette,
  style,
  textStyle,
}: {
  name?: string | null;
  avatarColor?: string | null;
  size: number;
  square?: boolean;
  small?: boolean;
  palette?: UserAvatarPalette;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const activePalette = palette ?? getUserAvatarPalette(avatarColor);
  const borderRadius = square ? Math.max(11, size * 0.36) : size / 2;
  const initials = getUserAvatarInitials(name);

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius,
          borderColor: activePalette.borderColor,
          backgroundColor: small ? "#F8FBFF" : activePalette.backgroundColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: activePalette.color,
            fontSize: Math.max(9, size * 0.28),
          },
          textStyle,
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  label: {
    fontWeight: "900",
  },
});
