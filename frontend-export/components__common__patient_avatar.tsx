import { StyleSheet, Text, View } from "react-native";

type AvatarProps = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: number;
  borderRadius?: number;
};

const AVATAR_TONES = [
  { background: "#FAD8E9", foreground: "#B52266" },
  { background: "#DDF4E9", foreground: "#168054" },
  { background: "#FFF0DD", foreground: "#B66317" },
  { background: "#EEE7FF", foreground: "#6842B8" },
  { background: "#E2EEFF", foreground: "#2563C7" },
];

export function Avatar({ name, firstName, lastName, size = 48, borderRadius }: AvatarProps) {
  const nameParts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  const safeFirstName = String(firstName ?? nameParts[0] ?? "").trim();
  const safeLastName = String(lastName ?? nameParts.slice(1).join(" ") ?? "").trim();
  const initials = `${safeFirstName.charAt(0) || "P"}${safeLastName.charAt(0)}`.toUpperCase();
  const seed = `${safeFirstName}${safeLastName}`
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const tone = AVATAR_TONES[seed % AVATAR_TONES.length];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: borderRadius ?? Math.round(size * 0.22),
          backgroundColor: tone.background,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { color: tone.foreground, fontSize: Math.round(size * 0.34) },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
