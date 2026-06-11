import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const ICD_CATALOG = [
  { code: "A00", label: "Choléra" },
  { code: "B01", label: "Varicelle" },
  { code: "C02", label: "Tumeur maligne de la langue (exemple)" },
  { code: "J10", label: "Grippe due à un virus identifié" },
  { code: "J20", label: "Bronchite aiguë" },
  { code: "K29", label: "Gastrite" },
  { code: "E11", label: "Diabète type 2" },
];

export default function MaladiesTab({
  theme,
  initialDiagnosisCodes,
  onChangeDiagnosisCodes,
}: {
  theme: any;
  initialDiagnosisCodes: string[];
  onChangeDiagnosisCodes?: (codes: string[]) => void;
}) {
  const styles = createStyles(theme);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initialDiagnosisCodes || []);

  useEffect(() => {
    setSelected(initialDiagnosisCodes || []);
  }, [initialDiagnosisCodes]);

  useEffect(() => {
    onChangeDiagnosisCodes?.(selected);
  }, [onChangeDiagnosisCodes, selected]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICD_CATALOG;
    return ICD_CATALOG.filter(
      (x) => x.code.toLowerCase().includes(q) || x.label.toLowerCase().includes(q)
    );
  }, [query]);

  const add = (code: string) => {
    setSelected((p) => (p.includes(code) ? p : [...p, code]));
  };

  const remove = (code: string) => {
    setSelected((p) => p.filter((x) => x !== code));
  };

  return (
    <View style={styles.flatRoot}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Maladies</Text>
        <View style={styles.infoPill}>
          <Ionicons name="sync-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.infoPillText}>Synced with consultation save</Text>
        </View>
      </View>

      <Text style={styles.label}>Recherche ICD</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Tapez un code ou un nom…"
        placeholderTextColor={theme.colors.text + "66"}
        style={[styles.search, { backgroundColor: theme.colors.surface }]}
      />

      <View style={styles.columns}>
        <View style={styles.col}>
          <Text style={styles.colTitle}>Résultats</Text>
          {results.map((x) => (
            <TouchableOpacity
              key={x.code}
              style={[styles.row, { backgroundColor: theme.colors.surface }]}
              onPress={() => add(x.code)}
            >
              <Text style={styles.rowMain}>{x.code}</Text>
              <Text style={styles.rowSub}>{x.label}</Text>
              <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.col}>
          <Text style={styles.colTitle}>Sélection</Text>
          {selected.length === 0 ? (
            <Text style={{ opacity: 0.6 }}>Aucune maladie sélectionnée</Text>
          ) : (
            selected.map((code) => {
              const item = ICD_CATALOG.find((x) => x.code === code);
              return (
                <View key={code} style={[styles.row, { backgroundColor: theme.colors.surface }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowMain}>{code}</Text>
                    <Text style={styles.rowSub}>{item?.label || "—"}</Text>
                  </View>
                  <TouchableOpacity onPress={() => remove(code)}>
                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              );
            })
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
    rowSub: { flex: 1, opacity: 0.7, fontWeight: "700" },
  });
