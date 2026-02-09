import { BlueField, MetricCard } from "@/components/consultation_tabs/ui";
import { ThemedCard } from "@/components/default_card";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const LEFT_SUBTABS = [
  "Étiquette",
  "Gynécologie",
  "Antécédents et Commentaire",
  "Étiquettes précédentes",
] as const;

const RIGHT_SUBTABS = ["Paramètres de consultation", "Paramètres précédents"] as const;

export default function ObservationMedicalTab({
  theme,
  vitals,
  setVitals,
  parameters,
  setParameters,
  observations,
  setObservations,
  onSave,
}: any) {
  const styles = createStyles(theme);
  const [leftTab, setLeftTab] = React.useState<(typeof LEFT_SUBTABS)[number]>("Étiquette");
  const [rightTab, setRightTab] = React.useState<(typeof RIGHT_SUBTABS)[number]>("Paramètres de consultation");

  return (
    <View style={styles.twoColWrap}>
      {/* LEFT */}
      <ThemedCard>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabsWrap}>
          {LEFT_SUBTABS.map((t) => (
            <TouchableOpacity key={t} onPress={() => setLeftTab(t)} style={[styles.subTab, leftTab === t && styles.subTabActive]}>
              <Text style={[styles.subTabText, leftTab === t && styles.subTabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.metaRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.metaLine}>N° de consultation : 1436</Text>
            <Text style={styles.metaLine}>Date d'Impression : 31.05.2022</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.metaLine}>N° de visite : 6</Text>
            <Text style={styles.metaLine}>Type : Consultation</Text>
          </View>

          <TouchableOpacity style={styles.yellowBtn}>
            <Text style={styles.yellowBtnText}>MODIFIER ÉTIQUETTE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid2}>
          <MetricCard theme={theme} icon="resize-outline" label="Taille (Cm)" value={vitals.taille_cm || "-"} />
          <MetricCard theme={theme} icon="scale-outline" label="Poids (Kg)" value={vitals.poids_kg || "-"} />
          <MetricCard theme={theme} icon="heart-outline" label="Tension" value={vitals.tension || "-"} />
          <MetricCard theme={theme} icon="thermometer-outline" label="Température (°C)" value={vitals.temperature_c || "-"} />
        </View>

        <BlueField theme={theme} label="Observation" value={observations} onChange={setObservations} multiline minHeight={96} />
      </ThemedCard>

      {/* RIGHT */}
      <ThemedCard>
        <View style={styles.rightTopRow}>
          <View style={styles.rightSubTabs}>
            {RIGHT_SUBTABS.map((t) => (
              <TouchableOpacity key={t} onPress={() => setRightTab(t)} style={[styles.rightSubTab, rightTab === t && styles.rightSubTabActive]}>
                <Text style={[styles.rightSubTabText, rightTab === t && styles.rightSubTabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.yellowBtn}>
            <Text style={styles.yellowBtnText}>MODIFIER PARAMÈTRES</Text>
          </TouchableOpacity>
        </View>

        <BlueField
          theme={theme}
          label="Motif de consultation :"
          value={parameters.motif_consultation}
          onChange={(v: string) => setParameters((s: any) => ({ ...s, motif_consultation: v }))}
          minHeight={56}
        />

        <View style={styles.row}>
          <BlueField
            theme={theme}
            label="glycémie :"
            value={parameters.glycemie}
            onChange={(v: string) => setParameters((s: any) => ({ ...s, glycemie: v }))}
            minHeight={56}
          />
          <BlueField
            theme={theme}
            label="HbA1c :"
            value={parameters.hba1c}
            onChange={(v: string) => setParameters((s: any) => ({ ...s, hba1c: v }))}
            minHeight={56}
          />
        </View>

        <BlueField
          theme={theme}
          label="Examen clinique :"
          value={parameters.examen_clinique}
          onChange={(v: string) => setParameters((s: any) => ({ ...s, examen_clinique: v }))}
          multiline
          minHeight={88}
        />

        <BlueField
          theme={theme}
          label="Conclusion :"
          value={parameters.conclusion}
          onChange={(v: string) => setParameters((s: any) => ({ ...s, conclusion: v }))}
          multiline
          minHeight={88}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onSave}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>SAUVEGARDER</Text>
        </TouchableOpacity>
      </ThemedCard>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    twoColWrap: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    subTabsWrap: { marginBottom: 10 },
    subTab: { backgroundColor: theme.colors.surface, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8, opacity: 0.75 },
    subTabActive: { opacity: 1 },
    subTabText: { fontWeight: "900", opacity: 0.85 },
    subTabTextActive: { opacity: 1 },

    metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10, flexWrap: "wrap" },
    metaLine: { fontWeight: "800", opacity: 0.75, marginTop: 2 },

    yellowBtn: { backgroundColor: "#F5B301", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: "flex-start" },
    yellowBtnText: { fontWeight: "900", color: "#fff", fontSize: 12 },

    grid2: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
    row: { flexDirection: "row", gap: 12 },

    rightTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
    rightSubTabs: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    rightSubTab: { backgroundColor: theme.colors.surface, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, opacity: 0.75 },
    rightSubTabActive: { opacity: 1 },
    rightSubTabText: { fontWeight: "900", opacity: 0.85 },
    rightSubTabTextActive: { opacity: 1 },

    primaryBtn: { marginTop: 14, backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    primaryBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 0.5 },
  });
