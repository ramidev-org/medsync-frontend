import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PROCEDURES, type ProcedureKey } from "./odontogram";

const ALL_KEY = "All" as const;

export function ProcedureFilterPill({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: ProcedureKey | typeof ALL_KEY;
  onChange: (next: ProcedureKey | typeof ALL_KEY) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = React.useState(false);
  const current =
    value === ALL_KEY ? { key: ALL_KEY, label: "All", color: theme.colors.textSecondary } : (PROCEDURES.find((p) => p.key === value) ?? PROCEDURES[0]!);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.btn, { borderColor: `${current.color}66` }]}
        accessibilityRole="button"
        accessibilityLabel="Filter by procedure"
      >
        <View style={[styles.dot, { backgroundColor: current.color }]} />
        <Text style={[styles.btnText, { color: theme.colors.textSecondary }]}>Procedure</Text>
        <Text style={[styles.btnTextStrong, { color: theme.colors.text }]} numberOfLines={1}>
          {current.label}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={styles.backdrop}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>Filter procedure</Text>
            <ScrollView contentContainerStyle={{ paddingVertical: 6 }}>
              <TouchableOpacity
                onPress={() => {
                  onChange(ALL_KEY);
                  setOpen(false);
                }}
                style={[styles.item, { borderColor: value === ALL_KEY ? theme.colors.primary : theme.colors.border, backgroundColor: value === ALL_KEY ? theme.colors.primarySoft : theme.colors.surface }]}
              >
                <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
                <Text style={[styles.itemText, { color: theme.colors.text }]}>All</Text>
              </TouchableOpacity>
              {PROCEDURES.map((p) => {
                const active = p.key === value;
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => {
                      onChange(p.key);
                      setOpen(false);
                    }}
                    style={[
                      styles.item,
                      {
                        borderColor: active ? p.color : theme.colors.border,
                        backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface,
                      },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: p.color }]} />
                    <Text style={[styles.itemText, { color: theme.colors.text }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    btn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      maxWidth: 240,
    },
    dot: { width: 9, height: 9, borderRadius: 999 },
    btnText: { fontWeight: "700", fontSize: 12 },
    btnTextStrong: { fontWeight: "700", fontSize: 12, flexShrink: 1 },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },
    card: {
      width: "100%",
      maxWidth: 520,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden",
      padding: 14,
    },
    title: { fontWeight: "700", marginBottom: 8 },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 10,
    },
    itemText: { fontWeight: "700" },
  });

