import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const SYMPTOMS = [
  "Fièvre",
  "Toux",
  "Céphalées",
  "Vertiges",
  "Nausées",
  "Douleur abdominale",
  "Fatigue",
  "Dyspnée",
  "Douleur thoracique",
];

export default function SymptomesTab({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value?: string[];
  onChange?: (items: string[]) => void;
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
    return SYMPTOMS.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  const add = (s: string) => setSelected((p) => (p.includes(s) ? p : [...p, s]));
  const remove = (s: string) => setSelected((p) => p.filter((x) => x !== s));

  return (
    <View style={styles.flatRoot}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Symptômes</Text>
        <View style={styles.infoPill}>
          <Ionicons name="sync-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.infoPillText}>Saved with the consultation</Text>
        </View>
      </View>

      <Text style={styles.label}>Recherche</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Tapez un symptôme…"
        placeholderTextColor={theme.colors.text + "66"}
        style={[styles.search, { backgroundColor: theme.colors.surface }]}
      />

      <View style={styles.columns}>
        <View style={styles.col}>
          <Text style={styles.colTitle}>Résultats</Text>
          {results.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.row, { backgroundColor: theme.colors.surface }]}
              onPress={() => add(s)}
            >
              <Text style={styles.rowMain}>{s}</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.col}>
          <Text style={styles.colTitle}>Sélection</Text>
          {selected.length === 0 ? (
            <Text style={{ opacity: 0.6 }}>Aucun symptôme sélectionné</Text>
          ) : (
            selected.map((s) => (
              <View key={s} style={[styles.row, { backgroundColor: theme.colors.surface }]}>
                <Text style={styles.rowMain}>{s}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => remove(s)}>
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
    rowMain: { fontWeight: "900" },
  });
