import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebOdontogram } from "./WebOdontogram";
import type { OdontogramState } from "./odontogram";

export function OdontogramDialog({
  theme,
  open,
  title,
  subtitle,
  odontogram,
  selectedTeethFdi,
  onChangeSelectedTeethFdi,
  onClose,
  readOnly,
}: {
  theme: any;
  open: boolean;
  title: string;
  subtitle?: string;
  odontogram: OdontogramState;
  selectedTeethFdi: string[];
  onChangeSelectedTeethFdi?: (next: string[]) => void;
  onClose: () => void;
  readOnly?: boolean;
}) {
  const defaultSelected = React.useMemo(() => (selectedTeethFdi || []).map((t) => `teeth-${t}`), [selectedTeethFdi]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", padding: 18, justifyContent: "center" }}>
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            maxWidth: 1100,
            alignSelf: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border }}>
                <MaterialCommunityIcons name="tooth-outline" size={16} color={theme.colors.primary} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={{ fontWeight: "900", color: theme.colors.text }} numberOfLines={1}>
                  {title}
                </Text>
                {!!subtitle ? (
                  <Text style={{ marginTop: 2, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }} numberOfLines={2}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.colors.background, flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <MaterialCommunityIcons name="close" size={16} color={theme.colors.textSecondary} />
              <Text style={{ fontWeight: "900", color: theme.colors.textSecondary, fontSize: 12 }}>Close</Text>
            </Pressable>
          </View>

          <View style={{ padding: 14 }}>
            <WebOdontogram
              themeMode="light"
              odontogram={odontogram}
              defaultSelected={defaultSelected}
              onSelectionChange={(fdi) => onChangeSelectedTeethFdi?.(fdi)}
              splitUpperLower
              readOnly={!!readOnly || !onChangeSelectedTeethFdi}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

