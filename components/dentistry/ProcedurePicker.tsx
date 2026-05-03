import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { PROCEDURES, type ProcedureKey } from "./odontogram";

export function ProcedurePicker({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: ProcedureKey;
  onChange: (next: ProcedureKey) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = React.useState(false);
  const current = PROCEDURES.find((p) => p.key === value) ?? PROCEDURES[0]!;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.btn, { borderColor: current.color }]}
        accessibilityRole="button"
        accessibilityLabel="Select procedure"
      >
        <View style={[styles.dot, { backgroundColor: current.color }]} />
        <Text style={[styles.btnText, { color: theme.colors.text }]}>Procedure:</Text>
        <Text style={[styles.btnTextStrong, { color: current.color }]}>{current.label}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={styles.backdrop}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>Select procedure</Text>
            <ScrollView contentContainerStyle={{ paddingVertical: 6 }}>
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
      borderWidth: 1.5,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.surface,
    },
    dot: { width: 10, height: 10, borderRadius: 999 },
    btnText: { fontWeight: "900", opacity: 0.8 },
    btnTextStrong: { fontWeight: "900" },
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
    title: { fontWeight: "900", marginBottom: 8 },
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
    itemText: { fontWeight: "900" },
  });

