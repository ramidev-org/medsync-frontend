import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from "react-native";

const COLORS = {
  page: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  blue: "#2563EB",
  dark: "#0F172A",
  blueSoft: "#EFF6FF",
};

type ModeKey = "form" | "widgets" | "history";

export type InteractiveField = {
  key: string;
  label: string;
  multiline?: boolean;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
};

export type InteractiveWidgetPoint = {
  label: string;
  value: number;
  displayValue?: string;
};

type Props = {
  theme: any;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  heroTitle: string;
  heroSubtitle: string;
  workspaceTitle: string;
  workspaceSubtitle: string;
  actionLabel: string;
  formFields: InteractiveField[];
  values: Record<string, string>;
  onChangeValue: (key: string, value: string) => void;
  widgetTitle: string;
  widgetHint: string;
  widgetPoints: InteractiveWidgetPoint[];
  historyTitle: string;
  historyRows: string[];
  warningText?: string;
  modalTitle: string;
  modalSubtitle: string;
  modalFields?: InteractiveField[];
  onSave?: () => void;
};

function Card({
  children,
  theme,
  padding = 14,
}: {
  children: React.ReactNode;
  theme: any;
  padding?: number;
}) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 22,
          backgroundColor: theme.colors.surface,
          padding,
        },
        Platform.OS === "web"
          ? ({ boxShadow: "0px 10px 22px rgba(15,23,42,0.05)" } as any)
          : null,
      ]}
    >
      {children}
    </View>
  );
}

function Field({
  theme,
  field,
  value,
  onChange,
}: {
  theme: any;
  field: InteractiveField;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ flex: 1, minWidth: field.multiline ? 280 : 220 }}>
      <Text style={{ marginBottom: 6, fontWeight: "700", color: theme.colors.text }}>{field.label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={!!field.multiline}
        keyboardType={field.keyboardType}
        placeholder={field.placeholder}
        placeholderTextColor="#94A3B8"
        style={{
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 14,
          backgroundColor: COLORS.page,
          paddingHorizontal: 14,
          paddingVertical: 11,
          minHeight: field.multiline ? 90 : 44,
          color: COLORS.text,
          textAlignVertical: field.multiline ? "top" : "center",
          fontWeight: "700",
          fontSize: 14,
        }}
      />
    </View>
  );
}

export function SpecialtyInteractiveWorkspace({
  theme,
  icon,
  heroTitle,
  heroSubtitle,
  workspaceTitle,
  workspaceSubtitle,
  actionLabel,
  formFields,
  values,
  onChangeValue,
  widgetTitle,
  widgetHint,
  widgetPoints,
  historyTitle,
  historyRows,
  warningText,
  modalTitle,
  modalSubtitle,
  modalFields,
  onSave,
}: Props) {
  const [mode, setMode] = React.useState<ModeKey>("form");
  const [modalOpen, setModalOpen] = React.useState(false);

  const pointsMax = React.useMemo(() => Math.max(1, ...widgetPoints.map((p) => p.value)), [widgetPoints]);
  const fieldsForModal = modalFields?.length ? modalFields : formFields.slice(0, Math.min(4, formFields.length));

  return (
    <View style={{ gap: 12 }}>
      <Card theme={theme}>
        <View
          style={{
            alignSelf: "flex-start",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: COLORS.blueSoft,
          }}
        >
          <MaterialCommunityIcons name={icon} size={14} color="#1D4ED8" />
          <Text style={{ color: "#1D4ED8", fontWeight: "600", fontSize: 12 }}>MedSync Specialty</Text>
        </View>
        <Text style={{ color: COLORS.text, fontSize: 27, fontWeight: "700", letterSpacing: -0.4 }}>{heroTitle}</Text>
        <Text style={{ marginTop: 6, color: COLORS.muted, fontWeight: "700", lineHeight: 21 }}>{heroSubtitle}</Text>
      </Card>

      <Card theme={theme}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <View style={{ flex: 1, minWidth: 240 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: theme.colors.text }}>{workspaceTitle}</Text>
            <Text style={{ marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700", lineHeight: 20 }}>
              {workspaceSubtitle}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalOpen(true)}
            style={{
              borderRadius: 18,
              backgroundColor: COLORS.blue,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{actionLabel}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card theme={theme}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "form", label: "Form" },
            { key: "widgets", label: "Widgets / Chart" },
            { key: "history", label: "History Treatments" },
          ].map((tab) => {
            const active = mode === (tab.key as ModeKey);
            return (
              <Pressable
                key={tab.key}
                onPress={() => setMode(tab.key as ModeKey)}
                style={{
                  borderWidth: 1,
                  borderColor: active ? COLORS.blue : COLORS.border,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: active ? COLORS.blue : "#F1F5F9",
                }}
              >
                <Text style={{ fontWeight: "700", color: active ? "#FFFFFF" : "#334155", fontSize: 12 }}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {mode === "form" ? (
          <View style={{ marginTop: 12, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {formFields.map((field) => (
                <Field
                  key={field.key}
                  theme={theme}
                  field={field}
                  value={values[field.key] ?? ""}
                  onChange={(value) => onChangeValue(field.key, value)}
                />
              ))}
            </View>
            {warningText ? (
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "#FDE68A",
                  backgroundColor: "#FEF3C7",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#92400E", fontWeight: "600" }}>{warningText}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {mode === "widgets" ? (
          <View style={{ marginTop: 12, gap: 10 }}>
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>{widgetTitle}</Text>
            <View style={{ minHeight: 156, flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
              {widgetPoints.map((point, index) => {
                const barHeight = Math.max(24, Math.round((point.value / pointsMax) * 120));
                return (
                  <View key={`${point.label}-${index}`} style={{ alignItems: "center", gap: 5 }}>
                    <View
                      style={{
                        width: 24,
                        height: barHeight,
                        borderRadius: 10,
                        backgroundColor: COLORS.blue,
                      }}
                    />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary }}>
                      {point.displayValue ?? String(point.value)}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: theme.colors.textSecondary }}>
                      {point.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>{widgetHint}</Text>
          </View>
        ) : null}

        {mode === "history" ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>{historyTitle}</Text>
            {historyRows.map((row) => (
              <View
                key={row}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 16,
                paddingHorizontal: 10,
                paddingVertical: 10,
                backgroundColor: COLORS.page,
              }}
            >
                <Text style={{ fontWeight: "600", color: theme.colors.text }}>{row}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.backdrop}>
          <View
            style={[
              {
                width: "100%",
                maxWidth: 780,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                overflow: "hidden",
              },
              Platform.OS === "web"
                ? ({ boxShadow: "0px 18px 40px rgba(15,23,42,0.2)" } as any)
                : null,
            ]}
          >
            <View style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.text }}>{modalTitle}</Text>
              <Text style={{ marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700" }}>{modalSubtitle}</Text>
            </View>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                {fieldsForModal.map((field) => (
                  <Field
                    key={field.key}
                    theme={theme}
                    field={field}
                    value={values[field.key] ?? ""}
                    onChange={(value) => onChangeValue(field.key, value)}
                  />
                ))}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setModalOpen(false)}
                  style={{ borderRadius: 14, backgroundColor: "#F1F5F9", paddingHorizontal: 14, paddingVertical: 11 }}
                >
                  <Text style={{ color: "#334155", fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    onSave?.();
                    setModalOpen(false);
                  }}
                  style={{ borderRadius: 14, backgroundColor: COLORS.dark, paddingHorizontal: 14, paddingVertical: 11 }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.45)",
    justifyContent: "center",
    padding: 16,
    alignItems: "center",
  },
});
