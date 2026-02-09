import { ThemedCard } from "@/components/default_card";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function OrdonnancesTab({
  theme,
  currentPrescription,
  signedBy,
  onAddDrug,
}: any) {
  const styles = createStyles(theme);

  const [draft, setDraft] = useState({
    name: "",
    dose: "",
    frequency: "",
    duration: "",
  });

  return (
    <ThemedCard>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Ordonnances</Text>
          <Text style={styles.subTitle}>Ordonnance liée à la consultation (prototype)</Text>
        </View>

        <TouchableOpacity style={styles.outlineBtn} onPress={() => onAddDrug(draft)}>
          <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {!!currentPrescription?.drugs?.length ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          {currentPrescription.drugs.map((d: any, idx: number) => (
            <View key={idx} style={styles.rxItem}>
              <Text style={{ fontWeight: "800" }}>{d.name}</Text>
              <Text style={{ opacity: 0.65 }}>
                {d.dose || "-"} • {d.frequency || "-"} • {d.duration || "-"}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ opacity: 0.6, marginTop: 12 }}>Aucun médicament.</Text>
      )}

      <View style={{ height: 14 }} />
      <Text style={styles.addTitle}>Ajouter un médicament</Text>

      <LabelInput theme={theme} label="Nom" value={draft.name} onChangeText={(v: any) => setDraft((s) => ({ ...s, name: v }))} />

      <View style={styles.row}>
        <LabelInput theme={theme} label="Dose" value={draft.dose} onChangeText={(v: any) => setDraft((s) => ({ ...s, dose: v }))} />
        <LabelInput theme={theme} label="Fréquence" value={draft.frequency} onChangeText={(v: any) => setDraft((s) => ({ ...s, frequency: v }))} />
      </View>

      <LabelInput theme={theme} label="Durée" value={draft.duration} onChangeText={(v: any) => setDraft((s) => ({ ...s, duration: v }))} />

      {/* Big blue bar like screenshot */}
      <TouchableOpacity
        style={styles.bigAddBtn}
        onPress={() => onAddDrug(draft)}
      >
        <Ionicons name="add-outline" size={18} color="#fff" />
        <Text style={styles.bigAddBtnText}>AJOUTER</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 12, opacity: 0.6 }}>Signé : {signedBy}</Text>
    </ThemedCard>
  );
}

function LabelInput({ theme, label, ...props }: any) {
  return (
    <View style={{ flex: 1, marginTop: 12 }}>
      <Text style={{ fontWeight: "800", marginBottom: 8 }}>{label}</Text>
      <TextInput
        {...props}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 10,
          padding: 12,
          minHeight: 44,
        }}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    title: { fontSize: 16, fontWeight: "900" },
    subTitle: { opacity: 0.6, marginTop: 2, fontWeight: "700" },

    outlineBtn: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    outlineBtnText: { fontWeight: "900" },

    rxItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 12,
    },

    addTitle: { fontSize: 14, fontWeight: "900", marginTop: 6 },
    row: { flexDirection: "row", gap: 12 },

    bigAddBtn: {
      marginTop: 18,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    bigAddBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 0.4 },
  });
