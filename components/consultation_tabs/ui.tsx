import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";

/* ================= METRIC CARD ================= */

export function MetricCard({
  theme,
  icon,
  label,
  value,
}: {
  theme: any;
  icon: any;
  label: string;
  value: string;
}) {
  const border = theme.colors.primary;

  return (
    <View style={[metricStyles.card, { borderColor: border }]}>
      <View style={[metricStyles.iconCircle, { backgroundColor: border }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[metricStyles.label, { color: theme.colors.primary }]}>{label}</Text>
        <Text style={metricStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    minHeight: 58,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontWeight: "800", fontSize: 13 },
  value: { fontWeight: "900", fontSize: 14, marginTop: 2 },
});

/* ================= BLUE FIELD ================= */

export function BlueField({
  theme,
  label,
  value,
  onChange,
  multiline,
  minHeight,
}: any) {
  const border = theme.colors.primary;

  return (
    <View style={{ marginTop: 12, flex: 1 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: "900", marginBottom: 6 }}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={!!multiline}
        style={{
          borderWidth: 2,
          borderColor: border,
          borderRadius: 10,
          padding: 10,
          minHeight: minHeight ?? 54,
          backgroundColor: theme.colors.background,
        }}
      />
    </View>
  );
}

/* ================= SIMPLE INPUT ================= */

export function SimpleInput({
  theme,
  label,
  value,
  onChange,
}: {
  theme: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flex: 1, marginTop: 12 }}>
      <Text style={{ fontWeight: "800", marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 10,
          padding: 12,
          minHeight: 44,
        }}
      />
    </View>
  );
}
