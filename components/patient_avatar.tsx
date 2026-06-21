import { StyleSheet, Text, View } from "react-native";

/* ================= TYPES ================= */

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
  borderRadius?: number; // Custom border radius (default is size/2 for circle)
}

/* ================= COLOR MAP ================= */

const COLOR_MAP: Record<string, { background: string; text: string }> = {
  A: { background: "#ef4444", text: "#fff" }, // Red
  B: { background: "#f97316", text: "#fff" }, // Orange
  C: { background: "#f59e0b", text: "#fff" }, // Amber
  D: { background: "#eab308", text: "#fff" }, // Yellow
  E: { background: "#84cc16", text: "#fff" }, // Lime
  F: { background: "#22c55e", text: "#fff" }, // Green
  G: { background: "#10b981", text: "#fff" }, // Emerald
  H: { background: "#14b8a6", text: "#fff" }, // Teal
  I: { background: "#06b6d4", text: "#fff" }, // Cyan
  J: { background: "#0ea5e9", text: "#fff" }, // Sky
  K: { background: "#3b82f6", text: "#fff" }, // Blue
  L: { background: "#6366f1", text: "#fff" }, // Indigo
  M: { background: "#8b5cf6", text: "#fff" }, // Violet
  N: { background: "#a855f7", text: "#fff" }, // Purple
  O: { background: "#d946ef", text: "#fff" }, // Fuchsia
  P: { background: "#ec4899", text: "#fff" }, // Pink
  Q: { background: "#f43f5e", text: "#fff" }, // Rose
  R: { background: "#dc2626", text: "#fff" }, // Red-600
  S: { background: "#ea580c", text: "#fff" }, // Orange-600
  T: { background: "#ca8a04", text: "#fff" }, // Yellow-600
  U: { background: "#65a30d", text: "#fff" }, // Lime-600
  V: { background: "#16a34a", text: "#fff" }, // Green-600
  W: { background: "#059669", text: "#fff" }, // Emerald-600
  X: { background: "#0891b2", text: "#fff" }, // Cyan-600
  Y: { background: "#0284c7", text: "#fff" }, // Sky-600
  Z: { background: "#2563eb", text: "#fff" }, // Blue-600
};

/* ================= COMPONENT ================= */

export function Avatar({ firstName, lastName, size = 48, borderRadius }: AvatarProps) {
  // Get first letter of first name and last name
  const firstInitial = firstName?.charAt(0).toUpperCase() || "";
  const lastInitial = lastName?.charAt(0).toUpperCase() || "";
  const initials = `${firstInitial}${lastInitial}`;

  // Get color based on first letter
  const colors = COLOR_MAP[firstInitial] || { background: "#6b7280", text: "#fff" };

  // Use custom borderRadius if provided, otherwise default to circle (size/2)
  const radius = borderRadius !== undefined ? borderRadius : size / 2;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.background,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            color: colors.text,
            fontSize: size * 0.4, // Dynamic font size based on avatar size
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

/* ================= USAGE EXAMPLE ================= */

// Import and use like this:

// Circle (default)
// <Avatar firstName="Ahmed" lastName="Benali" size={40} />

// Square
// <Avatar firstName="Sara" lastName="Kaci" size={60} borderRadius={0} />

// Rounded square
// <Avatar firstName="Yacine" lastName="Toumi" size={32} borderRadius={8} />

// Slightly rounded
// <Avatar firstName="Lina" lastName="Haddad" size={50} borderRadius={12} />
