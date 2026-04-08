import { ThemedCard } from "@/components/default_card";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BilanStatus = "demandé" | "reçu" | "annulé";

type BilanItem = {
  id: string;
  consultation_id: string;
  patient_id: string;
  titre: string;
  date: string;
  statut: BilanStatus;
  laboratoire?: string;
  resultat?: string;
};

function badgeColor(statut: BilanStatus) {
  if (statut === "reçu") return "#16a34a";
  if (statut === "annulé") return "#ef4444";
  return "#f59e0b";
}

export default function BilansTab({
  theme,
  consultationId,
  patientId,
}: {
  theme: any;
  consultationId: string;
  patientId: string;
}) {
  const styles = createStyles(theme);

  // seeded mock data (since your JSON doesn't have bilans)
  const seeded = useMemo<BilanItem[]>(
    () => [
      {
        id: "b1",
        consultation_id: consultationId,
        patient_id: patientId,
        titre: "NFS + Plaquettes",
        date: "2026-02-10",
        statut: "reçu",
        laboratoire: "LAB Alger Centre",
        resultat: "Hb 13.2 / GB 7.8 / PLQ 250",
      },
      {
        id: "b2",
        consultation_id: consultationId,
        patient_id: patientId,
        titre: "Glycémie à jeun",
        date: "2026-02-10",
        statut: "demandé",
        laboratoire: "LAB Alger Centre",
      },
      {
        id: "b3",
        consultation_id: consultationId,
        patient_id: patientId,
        titre: "CRP",
        date: "2026-02-10",
        statut: "annulé",
      },
    ],
    [consultationId, patientId]
  );

  const [items, setItems] = useState<BilanItem[]>(seeded);

  const addBilan = () => {
    const next: BilanItem = {
      id: `b_${items.length + 1}`,
      consultation_id: consultationId,
      patient_id: patientId,
      titre: "Bilan lipidique",
      date: "2026-02-10",
      statut: "demandé",
      laboratoire: "LAB Alger Centre",
    };
    setItems((p) => [next, ...p]);
  };

  const markAsReceived = (id: string) => {
    setItems((p) =>
      p.map((x) =>
        x.id === id ? { ...x, statut: "reçu", resultat: x.resultat || "Résultat ajouté (prototype)" } : x
      )
    );
  };

  return (
    <ThemedCard>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Bilans</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={addBilan}>
          <Ionicons name="add-outline" size={18} color="#fff" />
          <Text style={styles.primaryText}>AJOUTER</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Bilan</Text>
        <Text style={[styles.th, { flex: 1 }]}>Date</Text>
        <Text style={[styles.th, { flex: 1 }]}>Statut</Text>
        <Text style={[styles.th, { flex: 1 }]}>Action</Text>
      </View>

      {items.map((b) => (
        <View key={b.id} style={styles.row}>
          <View style={{ flex: 2 }}>
            <Text style={styles.rowTitle}>{b.titre}</Text>
            {!!b.laboratoire && <Text style={styles.rowSub}>{b.laboratoire}</Text>}
            {!!b.resultat && <Text style={styles.rowSub}>Résultat: {b.resultat}</Text>}
          </View>

          <Text style={[styles.td, { flex: 1 }]}>{b.date}</Text>

          <View style={[styles.statusPill, { backgroundColor: badgeColor(b.statut) }]}>
            <Text style={styles.statusText}>{b.statut.toUpperCase()}</Text>
          </View>

          <View style={{ flex: 1, alignItems: "flex-end" }}>
            {b.statut === "demandé" ? (
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => markAsReceived(b.id)}
              >
                <Ionicons name="checkmark-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.outlineText, { color: theme.colors.primary }]}>Reçu</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => Alert.alert("Télécharger", "Prototype")}
              >
                <Ionicons name="download-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.outlineText, { color: theme.colors.primary }]}>PDF</Text>
              </TouchableOpacity>
            )}
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
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    td: { fontWeight: "800", opacity: 0.8 },

    rowTitle: { fontWeight: "900" },
    rowSub: { opacity: 0.7, marginTop: 2, fontWeight: "700" },

    statusPill: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      borderRadius: 999,
    },
    statusText: { color: "#fff", fontWeight: "900", fontSize: 12 },

    outlineBtn: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    outlineText: { fontWeight: "900" },
  });
