import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
        <Ionicons name={icon} size={18} color={theme.colors.textOnPrimary} />
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

export function SelectionCard({
  theme,
  icon,
  title,
  description,
  active,
  onPress,
}: {
  theme: any;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 170,
        borderWidth: 1.5,
        borderColor: active ? theme.colors.primary : theme.colors.border,
        borderRadius: 16,
        padding: 14,
        backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
        gap: 10,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? theme.colors.primary : theme.colors.surfaceVariant,
        }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={active ? theme.colors.textOnPrimary : theme.colors.primary}
        />
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: "900", color: active ? theme.colors.primary : theme.colors.text }}>
          {title}
        </Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
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

/* ================= SUB TAB BAR (VIDEO STYLE) ================= */

/**
 * A small horizontal sub-tab bar (pill buttons) used inside each main tab.
 *
 * - Code names are in English (keys)
 * - Display labels can be French (like the MedSign+ video)
 */
export function SubTabBar<T extends string>({
  theme,
  tabs,
  activeKey,
  onChange,
}: {
  theme: any;
  tabs: { key: T; label: string }[];
  activeKey: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={subTabStyles.row}>
      {tabs.map((t) => {
        const isActive = t.key === activeKey;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[
              subTabStyles.pill,
              {
                backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Text
              style={[subTabStyles.pillText, { color: isActive ? theme.colors.textOnPrimary : theme.colors.primary }]}
              numberOfLines={1}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const subTabStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  pill: {
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: 260,
  },
  pillText: {
    fontWeight: "900",
    fontSize: 12,
  },
});

// Helper module (not a real screen) but expo-router scans `app/` for routes.
export default function ConsultationUiRoute() {
  return null;
}
