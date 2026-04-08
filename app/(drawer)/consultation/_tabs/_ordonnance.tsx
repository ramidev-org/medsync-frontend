import { ThemedCard } from "@/components/default_card";
import { DrugSuggestion, searchDrugsByName } from "@/services/drugs.services";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Ordonnances tab – UI cloned from the video/screenshots.
 *
 * Added now:
 * - "Ordonnances Type" rows auto-fill the selected ordonnance (replace its drugs)
 *
 * NOTE:
 * - Internal keys/variables are in English
 * - Visible labels are in French
 * - Comments are in English
 */

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

/* ==========================
   Left “types” list (prototype)
========================== */

const PROTO_RX_TYPES: Array<{ id: string; label: string }> = [
  { id: "t2", label: "2 - Lombalgie" },
  { id: "t1", label: "1 - 1ER TRIM" },
];

/**
 * Type templates (prototype)
 * - This is where you will later connect your backend templates.
 * - Each template is a list of drugs that should appear on the ordonnance when selected.
 */
const RX_TYPE_TEMPLATES: Record<
  string,
  Array<{
    name: string;
    qty?: string;
    dose?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>
> = {
  // Example: Lombalgie template
  t2: [
    {
      name: "DOLIPRANE 1000MG",
      dose: "1 cp",
      frequency: "3 fois/jour",
      duration: "5 jours",
      instructions: "Après repas si possible.",
    },
    {
      name: "SPASFON 80MG",
      dose: "2 cp",
      frequency: "2 fois/jour",
      duration: "5 jours",
      instructions: "Si douleurs/spasmes.",
    },
  ],

  // Example: 1er Trim template (pregnancy-safe prototype)
  t1: [
    {
      name: "SPASFON 80MG",
      dose: "2 cp",
      frequency: "2 fois/jour",
      duration: "3 jours",
      instructions: "Si douleurs abdominales légères.",
    },
    {
      name: "DOLIPRANE 1000MG",
      dose: "1 cp",
      frequency: "2 fois/jour",
      duration: "3 jours",
      instructions: "Uniquement si douleur/fièvre.",
    },
  ],
};

/* ==========================
   Types
========================== */

type Drug = {
  id: string;
  name: string;
  code?: string;
  form?: string | null;
  dosage?: string | null;
  validated: boolean;

  qty?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

type Prescription = {
  id: string;
  ref: string;
  title?: string;
  drugs: Drug[];
};

/* ==========================
   Helpers
========================== */

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/* ==========================
   Sub-tabs (left panel)
========================== */

type LeftSubTabKey = "types" | "previous";

const LEFT_SUB_TABS: Array<{ key: LeftSubTabKey; label: string }> = [
  { key: "types", label: "Ordonnances Type" },
  { key: "previous", label: "Ordonnances Précédentes" },
];

/* ==========================
   Main component
========================== */

export default function OrdonnancesTab({
  theme,
  signedBy,
  onPrint,
  onOverflow,
}: {
  theme: any;
  signedBy?: string;
  onPrint?: (rx?: Prescription) => void;
  onOverflow?: (rx?: Prescription) => void;
}) {
  const styles = createStyles(theme);

  const [leftSubTab, setLeftSubTab] = React.useState<LeftSubTabKey>("types");

  // Search (dropdown only when typing)
  const [medQuery, setMedQuery] = React.useState("");
  const debouncedMedQuery = useDebouncedValue(medQuery, 200);
  const [suggestions, setSuggestions] = React.useState<DrugSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);

  // Multiple ordonnances
  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>([
    {
      id: uid("rx"),
      ref: "23",
      title: "Consultation",
      drugs: [
        {
          id: uid("drug"),
          name: "AUGMENTIN COMP. 500MG/125MG",
          validated: false,
          qty: "",
          instructions: "",
        },
      ],
    },
  ]);

  const [selectedRxId, setSelectedRxId] = React.useState(prescriptions[0]?.id);
  const selectedRx = prescriptions.find((p) => p.id === selectedRxId);

  // Expand editor for a drug line
  const [expandedDrugId, setExpandedDrugId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = debouncedMedQuery.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    let alive = true;
    setSuggestionsLoading(true);

    searchDrugsByName(q, 7)
      .then((items) => {
        if (!alive) return;
        setSuggestions(items);
      })
      .catch((e) => {
        console.error("Drug search failed:", e);
        if (!alive) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (!alive) return;
        setSuggestionsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [debouncedMedQuery]);

  function addPrescription() {
    const nextRef = String(
      Math.max(0, ...prescriptions.map((p) => Number(p.ref) || 0)) + 1
    );
    const newRx: Prescription = { id: uid("rx"), ref: nextRef, title: "Consultation", drugs: [] };
    setPrescriptions((prev) => [newRx, ...prev]);
    setSelectedRxId(newRx.id);
    setExpandedDrugId(null);
  }

  function ensureSelectedRx(): Prescription {
    // Make sure there is always a selected ordonnance to fill.
    const found = prescriptions.find((p) => p.id === selectedRxId);
    if (found) return found;

    // If none found, create one and select it (sync-friendly approach).
    const nextRef = String(
      Math.max(0, ...prescriptions.map((p) => Number(p.ref) || 0)) + 1
    );
    const created: Prescription = { id: uid("rx"), ref: nextRef, title: "Consultation", drugs: [] };
    setPrescriptions((prev) => [created, ...prev]);
    setSelectedRxId(created.id);
    return created;
  }

  function addDrugFromCatalog(drug: DrugSuggestion) {
    const rx = ensureSelectedRx();

    const newDrug: Drug = {
      id: uid("drug"),
      name: drug.brandName,
      code: drug.code,
      form: drug.form ?? null,
      dosage: drug.dosage ?? null,
      validated: false,
      qty: "",
      instructions: "",
    };

    setPrescriptions((prev) =>
      prev.map((p) => (p.id === rx.id ? { ...p, drugs: [newDrug, ...p.drugs] } : p))
    );

    // After picking, close suggestions by clearing the query.
    setMedQuery("");
    setExpandedDrugId(newDrug.id);
  }

  /**
   * Apply a template to the selected ordonnance (video behavior).
   * - Prototype behavior: replace drugs with template drugs.
   * - If you want "append instead of replace", tell me and I’ll change it.
   */
  function applyTypeTemplate(typeId: string) {
    const template = RX_TYPE_TEMPLATES[typeId];
    if (!template?.length) return;

    const rx = ensureSelectedRx();

    const templateDrugs: Drug[] = template.map((t) => ({
      id: uid("drug"),
      name: t.name,
      validated: false,
      qty: t.qty ?? "",
      dose: t.dose ?? "",
      frequency: t.frequency ?? "",
      duration: t.duration ?? "",
      instructions: t.instructions ?? "",
    }));

    setPrescriptions((prev) =>
      prev.map((p) => (p.id === rx.id ? { ...p, drugs: templateDrugs } : p))
    );

    // Match UX: clear search + collapse editors after applying template.
    setMedQuery("");
    setExpandedDrugId(null);
  }

  function toggleValidated(drugId: string) {
    if (!selectedRx) return;
    setPrescriptions((prev) =>
      prev.map((p) => {
        if (p.id !== selectedRx.id) return p;
        return {
          ...p,
          drugs: p.drugs.map((d) => (d.id === drugId ? { ...d, validated: !d.validated } : d)),
        };
      })
    );
  }

  function deleteDrug(drugId: string) {
    if (!selectedRx) return;
    setPrescriptions((prev) =>
      prev.map((p) => {
        if (p.id !== selectedRx.id) return p;
        return { ...p, drugs: p.drugs.filter((d) => d.id !== drugId) };
      })
    );
    if (expandedDrugId === drugId) setExpandedDrugId(null);
  }

  function updateDrug(drugId: string, patch: Partial<Drug>) {
    if (!selectedRx) return;
    setPrescriptions((prev) =>
      prev.map((p) => {
        if (p.id !== selectedRx.id) return p;
        return { ...p, drugs: p.drugs.map((d) => (d.id === drugId ? { ...d, ...patch } : d)) };
      })
    );
  }

  function handlePrint() {
    if (onPrint) return onPrint(selectedRx);
  }

  function handleOverflow() {
    if (onOverflow) return onOverflow(selectedRx);
  }

  return (
    <View style={styles.rootRow}>
      {/* ================= LEFT PANEL ================= */}
      <View style={[styles.col, { flex: 1 }]}>
        <ThemedCard>
          <View style={styles.leftHeaderRow}>
            <Text style={styles.panelTitle}>Médicaments</Text>

            <TouchableOpacity style={styles.blueBtn} onPress={() => {}}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.blueBtnText}>NOUVEAU MÉDICAMENT</Text>
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={styles.searchWrap}>
            <TextInput
              value={medQuery}
              onChangeText={setMedQuery}
              placeholder=""
              style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}
            />
            <Ionicons name="search" size={18} color="rgba(0,0,0,0.45)" />
          </View>

          {/* Suggestions dropdown only when typing */}
          {!!medQuery.trim() && (suggestionsLoading || !!suggestions.length) && (
            <View style={styles.suggestDropdown}>
              {suggestionsLoading && !suggestions.length ? (
                <Text
                  style={[
                    styles.suggestText,
                    { paddingVertical: 10, paddingHorizontal: 12 },
                  ]}
                >
                  Recherche...
                </Text>
              ) : null}
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s.id || s.code}
                  onPress={() => addDrugFromCatalog(s)}
                  style={styles.suggestItem}
                >
                  <Text style={styles.suggestText} numberOfLines={1}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Left sub-tabs */}
          <PillTabs theme={theme} tabs={LEFT_SUB_TABS} activeKey={leftSubTab} onChange={setLeftSubTab} />

          {/* Left content */}
          {leftSubTab === "types" && (
            <View style={{ marginTop: 10, gap: 10 }}>
              {PROTO_RX_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.typeRow}
                  onPress={() => applyTypeTemplate(t.id)} // ✅ fills the ordonnance
                >
                  <Text style={styles.typeText}>{t.label}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#10A760" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {leftSubTab === "previous" && (
            <View style={styles.mutedBox}>
              <Text style={styles.mutedTitle}>Ordonnances Précédentes</Text>
              <Text style={styles.mutedText}>
                (Prototype) Chargez ici les ordonnances des visites précédentes.
              </Text>
            </View>
          )}
        </ThemedCard>
      </View>

      {/* ================= RIGHT PANEL ================= */}
      <View style={[styles.col, { flex: 1 }]}>
        <ThemedCard>
          <View style={styles.rightHeaderRow}>
            <Text style={styles.panelTitle}>Ordonnances</Text>

            <TouchableOpacity style={styles.greenBtn} onPress={addPrescription}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.greenBtnText}>AJOUTER ORDONNANCE</Text>
            </TouchableOpacity>
          </View>

          {/* Ordonance selector chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {prescriptions.map((p) => {
                const active = p.id === selectedRx?.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setSelectedRxId(p.id);
                      setExpandedDrugId(null);
                    }}
                    style={[styles.rxChip, active && styles.rxChipActive]}
                  >
                    <Text style={[styles.rxChipText, active && styles.rxChipTextActive]}>
                      REF {p.ref}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Orange banner */}
          <View style={styles.orangeBanner}>
            <Text style={styles.orangeBannerText}>REF ORDONNANCE : {selectedRx?.ref ?? "-"}</Text>

            <View style={styles.bannerRightIcons}>
              <TouchableOpacity onPress={handlePrint} style={styles.iconBtn}>
                <Ionicons name="print" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOverflow} style={styles.iconBtn}>
                <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Drugs list */}
          <View style={{ marginTop: 10, gap: 10 }}>
            {selectedRx?.drugs?.length ? (
              selectedRx.drugs.map((d) => {
                const expanded = expandedDrugId === d.id;
                return (
                  <View key={d.id} style={styles.drugCard}>
                    <TouchableOpacity
                      style={styles.drugRow}
                      onPress={() => setExpandedDrugId((cur) => (cur === d.id ? null : d.id))}
                    >
                      <View style={styles.drugLeftBar} />

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.drugName} numberOfLines={1}>
                          {d.name}
                        </Text>

                        {!!(d.dose || d.frequency || d.duration) && (
                          <Text style={styles.drugMeta} numberOfLines={1}>
                            {(d.dose || "-") + " • " + (d.frequency || "-") + " • " + (d.duration || "-")}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity onPress={() => toggleValidated(d.id)} style={styles.rowIconBtn}>
                        <Ionicons
                          name={d.validated ? "checkmark-circle" : "checkmark-circle-outline"}
                          size={20}
                          color={d.validated ? "#10A760" : "rgba(0,0,0,0.45)"}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => deleteDrug(d.id)} style={styles.rowIconBtn}>
                        <Ionicons name="trash" size={18} color="#E74C3C" />
                      </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Expanded editor */}
                    {expanded && (
                      <View style={styles.drugEditor}>
                        <View style={styles.editorRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.editorLabel}>Quantité</Text>
                            <TextInput
                              value={d.qty ?? ""}
                              onChangeText={(v) => updateDrug(d.id, { qty: v })}
                              placeholder=""
                              style={[styles.editorInput, { backgroundColor: theme.colors.surface }]}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.editorLabel}>Posologie</Text>
                            <TextInput
                              value={d.dose ?? ""}
                              onChangeText={(v) => updateDrug(d.id, { dose: v })}
                              placeholder=""
                              style={[styles.editorInput, { backgroundColor: theme.colors.surface }]}
                            />
                          </View>
                        </View>

                        <View style={styles.editorRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.editorLabel}>Fréquence</Text>
                            <TextInput
                              value={d.frequency ?? ""}
                              onChangeText={(v) => updateDrug(d.id, { frequency: v })}
                              placeholder=""
                              style={[styles.editorInput, { backgroundColor: theme.colors.surface }]}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.editorLabel}>Durée</Text>
                            <TextInput
                              value={d.duration ?? ""}
                              onChangeText={(v) => updateDrug(d.id, { duration: v })}
                              placeholder=""
                              style={[styles.editorInput, { backgroundColor: theme.colors.surface }]}
                            />
                          </View>
                        </View>

                        <Text style={styles.editorLabel}>Prescription</Text>
                        <TextInput
                          value={d.instructions ?? ""}
                          onChangeText={(v) => updateDrug(d.id, { instructions: v })}
                          multiline
                          placeholder=""
                          style={[styles.editorTextarea, { backgroundColor: theme.colors.surface }]}
                        />

                        <TouchableOpacity
                          style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
                          onPress={() => setExpandedDrugId(null)}
                        >
                          <Ionicons name="save-outline" size={16} color="#fff" />
                          <Text style={styles.saveBtnText}>ENREGISTRER</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={{ opacity: 0.65, fontWeight: "800", marginTop: 6 }}>
                Aucune ligne. Recherchez un médicament à gauche pour l’ajouter.
              </Text>
            )}
          </View>

          {!!signedBy && <Text style={{ marginTop: 12, opacity: 0.6 }}>Signé : {signedBy}</Text>}
        </ThemedCard>
      </View>
    </View>
  );
}

/* ==========================
   Pills
========================== */

function PillTabs<T extends string>({
  theme,
  tabs,
  activeKey,
  onChange,
}: {
  theme: any;
  tabs: { key: T; label: string }[];
  activeKey: T;
  onChange: (k: T) => void;
}) {
  return (
    <View style={pillStyles.row}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[
              pillStyles.pill,
              {
                backgroundColor: active ? "#fff" : "rgba(0,0,0,0.03)",
                borderColor: active ? "rgba(0,0,0,0.14)" : "transparent",
              },
            ]}
          >
            <Text
              style={[
                pillStyles.pillText,
                { color: active ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.65)" },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pillStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontWeight: "900",
  },
});

/* ==========================
   Styles
========================== */

const createStyles = (theme: any) =>
  StyleSheet.create({
    rootRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
      width: "100%",
      alignSelf: "stretch",
    },
    col: {
      minWidth: 0,
    },

    panelTitle: {
      fontSize: 16,
      fontWeight: "900",
      opacity: 0.88,
    },

    leftHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    rightHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },

    blueBtn: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    blueBtnText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 12,
    },

    greenBtn: {
      backgroundColor: "#10A760",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    greenBtnText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 12,
    },

    searchWrap: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.12)",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    searchInput: {
      flex: 1,
      minHeight: 22,
      padding: 0,
    },

    suggestDropdown: {
      marginTop: 6,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.12)",
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: "#fff",
    },
    suggestItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.06)",
    },
    suggestText: {
      fontWeight: "800",
      opacity: 0.82,
    },

    typeRow: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.10)",
      borderRadius: 10,
      backgroundColor: "#fff",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    typeText: {
      fontWeight: "900",
      opacity: 0.82,
    },

    mutedBox: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.10)",
      borderRadius: 10,
      padding: 12,
      backgroundColor: "rgba(0,0,0,0.02)",
    },
    mutedTitle: { fontWeight: "900", marginBottom: 6, opacity: 0.8 },
    mutedText: { fontWeight: "800", opacity: 0.65, lineHeight: 18 },

    rxChip: {
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.12)",
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: "rgba(0,0,0,0.02)",
    },
    rxChipActive: {
      backgroundColor: "rgba(0, 140, 255, 0.10)",
      borderColor: "rgba(0, 140, 255, 0.28)",
    },
    rxChipText: { fontWeight: "900", opacity: 0.75, fontSize: 12 },
    rxChipTextActive: { opacity: 1, color: theme.colors.primary },

    orangeBanner: {
      marginTop: 10,
      backgroundColor: "#F5B301",
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    orangeBannerText: {
      color: "#fff",
      fontWeight: "900",
      letterSpacing: 0.3,
    },
    bannerRightIcons: { flexDirection: "row", alignItems: "center", gap: 10 },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.20)",
    },

    drugCard: {
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.10)",
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: "#fff",
    },
    drugRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    drugLeftBar: {
      width: 6,
      height: 24,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    drugName: {
      fontWeight: "900",
      opacity: 0.9,
    },
    drugMeta: {
      fontWeight: "800",
      opacity: 0.55,
      marginTop: 2,
      fontSize: 12,
    },
    rowIconBtn: {
      padding: 4,
    },

    drugEditor: {
      borderTopWidth: 1,
      borderTopColor: "rgba(0,0,0,0.08)",
      padding: 12,
      gap: 10,
      backgroundColor: "rgba(0,0,0,0.02)",
    },
    editorRow: { flexDirection: "row", gap: 12 },
    editorLabel: { fontWeight: "900", opacity: 0.7, marginBottom: 6 },
    editorInput: {
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.12)",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 42,
      fontWeight: "800",
    },
    editorTextarea: {
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.12)",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 90,
      fontWeight: "800",
      textAlignVertical: "top",
    },
    saveBtn: {
      borderRadius: 10,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    saveBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 0.3 },
  });
