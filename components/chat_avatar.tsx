import React from "react";
import { Text, View } from "react-native";

const TONES = [
  { backgroundColor: "#EDF5FF", borderColor: "#CCDBF1", color: "#1D4ED8" },
  { backgroundColor: "#EAFBF4", borderColor: "#BCEBD6", color: "#047857" },
  { backgroundColor: "#FFF7ED", borderColor: "#FED7AA", color: "#EA580C" },
  { backgroundColor: "#F3EDFF", borderColor: "#DED2FF", color: "#7C3AED" },
] as const;

export function getChatAvatarTone(index: number) {
  return TONES[index % TONES.length];
}

export function ChatAvatar({
  name,
  size,
  square = false,
  tone,
  small = false,
}: {
  name: string;
  size: number;
  square?: boolean;
  tone?: { backgroundColor: string; borderColor: string; color: string };
  small?: boolean;
}) {
  const palette = tone || getChatAvatarTone(0);
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: square ? Math.max(11, size * 0.36) : size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: palette.borderColor,
        backgroundColor: small ? "#F8FBFF" : palette.backgroundColor,
        overflow: "hidden",
      }}
    >
      <Text style={{ fontWeight: "900", color: palette.color, fontSize: Math.max(9, size * 0.28) }}>
        {initials}
      </Text>
    </View>
  );
}
