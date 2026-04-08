import { ThemedCard } from "@/components/default_card";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DocItem = {
  id: string;
  patient_id: string;
  consultation_id: string;
  name: string;
  type: "Image" | "PDF" | "Scan";
  date: string;
};

export default function DocumentsTab({
  theme,
  consultationId,
  patientId,
}: {
  theme: any;
  consultationId: string;
  patientId: string;
}) {
  const styles = createStyles(theme);

  const seeded = useMemo<DocItem[]>(
    () => [
      { id: "d1", patient_id: patientId, consultation_id: consultationId, name: "Radio Thorax", type: "Image", date: "2026-02-10" },
      { id: "d2", patient_id: patientId, consultation_id: consultationId, name: "Analyse NFS.pdf", type: "PDF", date: "2026-02-10" },
      { id: "d3", patient_id: patientId, consultation_id: consultationId, name: "Compte rendu scanné", type: "Scan", date: "2026-02-10" },
    ],
    [consultationId, patientId]
  );

  const [docs, setDocs] = useState<DocItem[]>(seeded);

  const addDoc = () => {
    const next: DocItem = {
      id: `d_${docs.length + 1}`,
      patient_id: patientId,
      consultation_id: consultationId,
      name: "Nouveau document",
      type: "PDF",
      date: "2026-02-10",
    };
    setDocs((p) => [next, ...p]);
  };

  const remove = (id: string) => setDocs((p) => p.filter((x) => x.id !== id));

  return (
    <ThemedCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Documents</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={addDoc}>
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={styles.primaryText}>AJOUTER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Nom</Text>
        <Text style={[styles.th, { flex: 1 }]}>Type</Text>
        <Text style={[styles.th, { flex: 1 }]}>Date</Text>
        <Text style={[styles.th, { width: 90, textAlign: "right" }]}>Actions</Text>
      </View>

      {docs.map((d) => (
        <View key={d.id} style={styles.row}>
          <Text style={[styles.td, { flex: 2, fontWeight: "900" }]}>{d.name}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{d.type}</Text>
          <Text style={[styles.td, { flex: 1 }]}>{d.date}</Text>

          <View style={{ width: 90, flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
            <TouchableOpacity onPress={() => Alert.alert("Voir", "Prototype")}>
              <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remove(d.id)}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ThemedCard>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    title: { fontSize: 16, fontWeight: "900" },

    primaryBtn: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    primaryText: { color: "#fff", fontWeight: "900" },

    tableHeader: {
      marginTop: 14,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    th: { fontWeight: "900", opacity: 0.7 },

    row: {
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    td: { fontWeight: "800", opacity: 0.85 },
  });
