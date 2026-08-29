import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export function WorkspaceFlatTabs<T extends string>({
  theme,
  tabs,
  activeKey,
  onChange,
}: {
  theme: any;
  tabs: {
    key: T;
    label: string;
    icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  }[];
  activeKey: T;
  onChange: (k: T) => void;
}) {
  return (
    <View style={[styles.tabsRow, { borderBottomColor: theme.colors.border }]}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[
              styles.tab,
              {
                backgroundColor: active ? theme.colors.surface : theme.colors.surfaceVariant,
                borderColor: active ? theme.colors.border : "transparent",
              },
            ]}
          >
            <View style={styles.tabInner}>
              {t.icon ? (
                <MaterialCommunityIcons
                  name={t.icon}
                  size={17}
                  color={active ? theme.colors.primary : theme.colors.textSecondary}
                />
              ) : null}
              <Text style={[styles.tabText, { opacity: active ? 1 : 0.75 }]}>{t.label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function WorkspaceReadOnlyField({
  theme,
  label,
  value,
  multiline,
  icon,
}: {
  theme: any;
  label: string;
  value: string;
  multiline?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}) {
  return (
    <View style={{ marginTop: 12, flex: 1 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: multiline ? "flex-start" : "center", gap: 8 }}>
        {icon ? (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.warningSoft,
              alignItems: "center",
              justifyContent: "center",
              marginTop: multiline ? 10 : 0,
            }}
          >
            <MaterialCommunityIcons name={icon} size={22} color={theme.colors.warning} />
          </View>
        ) : null}
      <View
        style={{
          borderWidth: 2,
          borderColor: theme.colors.primary + "59",
          borderRadius: 10,
          padding: 12,
          minHeight: multiline ? 88 : 56,
          backgroundColor: theme.colors.background,
          justifyContent: "center",
          flex: 1,
        }}
      >
        <Text style={{ fontWeight: "700", opacity: 0.75 }}>{value}</Text>
      </View>
      </View>
    </View>
  );
}

export function WorkspaceInputField({
  theme,
  label,
  value,
  onChange,
  multiline,
  icon,
}: {
  theme: any;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}) {
  return (
    <View style={{ marginTop: 12, flex: 1 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: "700", marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: multiline ? "flex-start" : "center", gap: 8 }}>
        {icon ? (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.warningSoft,
              alignItems: "center",
              justifyContent: "center",
              marginTop: multiline ? 10 : 0,
            }}
          >
            <MaterialCommunityIcons name={icon} size={22} color={theme.colors.warning} />
          </View>
        ) : null}
      <View
        style={{
          borderWidth: 2,
          borderColor: theme.colors.primary + "59",
          borderRadius: 10,
          minHeight: multiline ? 88 : 56,
          backgroundColor: theme.colors.background,
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 0,
          flex: 1,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          multiline={!!multiline}
          style={{
            flex: 1,
            minHeight: multiline ? 68 : 44,
            color: theme.colors.text,
            textAlignVertical: multiline ? "top" : "center",
            fontWeight: "700",
            ...(typeof window !== "undefined"
              ? ({
                  outlineStyle: "none",
                  outlineWidth: 0,
                } as any)
              : null),
          }}
        />
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  tabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabText: {
    fontWeight: "700",
  },
});
