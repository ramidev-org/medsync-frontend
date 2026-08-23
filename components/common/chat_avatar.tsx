import React from "react";
import { UserAvatar, type UserAvatarPalette } from "@/components/user_avatar";

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
  avatarColor,
  size,
  square = false,
  tone,
  small = false,
}: {
  name: string;
  avatarColor?: string | null;
  size: number;
  square?: boolean;
  tone?: UserAvatarPalette;
  small?: boolean;
}) {
  return (
    <UserAvatar
      name={name}
      avatarColor={avatarColor}
      size={size}
      square={square}
      small={small}
      palette={tone}
    />
  );
}
