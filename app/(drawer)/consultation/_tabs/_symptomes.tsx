import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const SYMPTOMS = [
  "Fievre",
  "Toux",
  "Cephalees",
  "Vertiges",
  "Nausees",
  "Douleur abdominale",
  "Fatigue",
  "Dyspnee",
  "Douleur thoracique",
];

export default function SymptomesTab({
  theme,
  value,
  onChange,
  readOnly,
}: {
  theme: any;
  value?: string[];
  onChange?: (items: string[]) => void;
  readOnly?: boolean;
}) {
  const styles = createStyles(theme);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(value || []);

  useEffect(() => {
    setSelected(value || []);
  }, [value]);

  useEffect(() => {
    onChange?.(selected);
  }, [onChange, selected]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SYMPTOMS;
    return SYMPTOMS.filter((item) => item.toLowerCase().includes(q));
  }, [query]);

  const add = (symptom: string) => {
    if (readOnly) return;
    setSelected((prev) => (prev.includes(symptom) ? prev : [...prev, symptom]));
  };

  const remove = (symptom: string) => {
    if (readOnly) return;
    setSelected((prev) => prev.filter((item) => item !== symptom));
  };

  return (
    <View style={styles.flatRoot}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Symptomes</Text>
        <View style={styles.infoPill}>
          <Ionicons name={readOnly ? "lock-closed-outline" : "sync-outline"} size={16} color={theme.colors.primary} />
          <Text style={styles.infoPillText}>{readOnly ? "Consultation cloturee" : "Saved with the consultation"}</Text>
        </View>
      </View>

      <Text style={styles.label}>Recherche</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Tapez un symptome..."
        placeholderTextColor={theme.colors.text + "66"}
        style={[styles.search, { backgroundColor: theme.colors.surface }]}
        editable={!readOnly}
      />

      <View style={styles.columns}>
        <View style={styles.col}>
          <Text style={styles.colTitle}>Resultats</Text>
          {results.map((symptom) => (
            <TouchableOpacity
              key={symptom}
              style={[styles.row, { backgroundColor: theme.colors.surface }, readOnly && styles.rowDisabled]}
              onPress={() => add(symptom)}
              disabled={readOnly}
            >
              <Text style={styles.rowMain}>{symptom}</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.col}>
          <Text style={styles.colTitle}>Selection</Text>
          {selected.length === 0 ? (
            <Text style={{ opacity: 0.6 }}>Aucun symptome selectionne</Text>
          ) : (
            selected.map((symptom) => (
              <View key={symptom} style={[styles.row, { backgroundColor: theme.colors.surface }]}>
                <Text style={styles.rowMain}>{symptom}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => remove(symptom)} disabled={readOnly}>
                  <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    flatRoot: { backgroundColor: "transparent" },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 16, fontWeight: "900" },
    infoPill: {
      backgroundColor: theme.colors.primarySoft,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    infoPillText: { color: theme.colors.primary, fontWeight: "900" },
    label: { marginTop: 14, fontWeight: "900", opacity: 0.8 },
    search: { marginTop: 8, borderRadius: 10, padding: 12, minHeight: 44 },
    columns: { marginTop: 14, flexDirection: "row", gap: 12, flexWrap: "wrap" },
    col: { flex: 1, minWidth: 320, gap: 10 },
    colTitle: { fontWeight: "900", opacity: 0.8 },
    row: {
      borderRadius: 10,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    rowDisabled: { opacity: 0.7 },
    rowMain: { fontWeight: "900" },
  });
