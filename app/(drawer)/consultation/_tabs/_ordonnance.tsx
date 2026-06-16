import { DrugSuggestion, getPrescriptionItems, searchDrugsByName } from "@/services/drugs.services";
import { getPrescriptions, upsertPrescription } from "@/services/prescriptions.services";
import type { PrescriptionRow } from "@/services/backend.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

type Drug = {
  id: string;
  name: string;
  brand?: string | null;
  form?: string | null;
  dosage?: string | null;
  laboratory?: string | null;
  country?: string | null;
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
  createdAt?: string;
  drugs: Drug[];
};

type LeftSubTabKey = "types" | "previous";

const LEFT_SUB_TABS: Array<{ key: LeftSubTabKey; label: string }> = [
  { key: "types", label: "Ordonnances Type" },
  { key: "previous", label: "Ordonnances Précédentes" },
];

function mapPrescriptionRow(row: PrescriptionRow, index: number): Prescription {
  return {
    id: row.id,
    ref: String(index + 1).padStart(2, "0"),
    title: row.template_name || "Consultation",
    createdAt: row.created_at,
    drugs: (row.medications || []).map((medication) => ({
      id: medication.id,
      name: medication.medicine_name,
      validated: row.status === "signed",
      dose: medication.dose || "",
      frequency: medication.frequency || "",
      duration: medication.duration || "",
      instructions: medication.instructions || "",
      qty: "",
    })),
  };
}

function toMedicationPayload(drugs: Drug[]) {
  return drugs.map((drug) => ({
    name: drug.name,
    dose: drug.dose ?? "",
    frequency: drug.frequency ?? "",
    duration: drug.duration ?? "",
    instructions: drug.instructions ?? "",
  }));
}

export default function OrdonnancesTab({
  theme,
  requesterId,
  consultationId,
  patientId,
  signedBy,
  readOnly,
  onPrint,
  onOverflow,
  onSelectedPrescriptionChange,
}: {
  theme: any;
  requesterId?: string;
  consultationId?: string;
  patientId?: string;
  signedBy?: string;
  readOnly?: boolean;
  onPrint?: (rx?: Prescription) => void;
  onOverflow?: (rx?: Prescription) => void;
  onSelectedPrescriptionChange?: (rx?: Prescription) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [leftSubTab, setLeftSubTab] = React.useState<LeftSubTabKey>("types");
  const [medQuery, setMedQuery] = React.useState("");
  const debouncedMedQuery = useDebouncedValue(medQuery, 200);
  const [suggestions, setSuggestions] = React.useState<DrugSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);
  const [dbItems, setDbItems] = React.useState<DrugSuggestion[]>([]);
  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>([]);
  const [previousPrescriptions, setPreviousPrescriptions] = React.useState<Prescription[]>([]);
  const [selectedRxId, setSelectedRxId] = React.useState<string | undefined>(undefined);
  const [expandedDrugId, setExpandedDrugId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const selectedRx = prescriptions.find((p) => p.id === selectedRxId);
  const onSelectedPrescriptionChangeRef = React.useRef(onSelectedPrescriptionChange);

  React.useEffect(() => {
    onSelectedPrescriptionChangeRef.current = onSelectedPrescriptionChange;
  }, [onSelectedPrescriptionChange]);

  const loadPrescriptions = React.useCallback(async () => {
    if (!requesterId || !consultationId || !patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [catalogItems, currentRows, patientRows] = await Promise.all([
        getPrescriptionItems(String(requesterId ?? ""), 12).catch(() => []),
        getPrescriptions({
          requesterId,
          consultationId,
          patientId,
          limit: 12,
        }),
        getPrescriptions({
          requesterId,
          patientId,
          limit: 12,
        }),
      ]);

      const currentList = currentRows.map(mapPrescriptionRow);
      const previousList = patientRows
        .filter((row) => row.consultation_id !== consultationId)
        .map(mapPrescriptionRow);

      setDbItems(catalogItems);
      setPrescriptions(currentList);
      setPreviousPrescriptions(previousList);
      setSelectedRxId(currentList[0]?.id);
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
      setError(err instanceof Error ? err.message : "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  }, [consultationId, patientId, requesterId]);

  React.useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  React.useEffect(() => {
    const q = debouncedMedQuery.trim();
    if (!q || !requesterId) {
      setSuggestions([]);
      return;
    }

    let alive = true;
    setSuggestionsLoading(true);

    searchDrugsByName(String(requesterId ?? ""), q, 7)
      .then((items) => {
        if (!alive) return;
        setSuggestions(items);
      })
      .catch(() => {
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
  }, [debouncedMedQuery, requesterId]);

  React.useEffect(() => {
    onSelectedPrescriptionChangeRef.current?.(selectedRx);
  }, [selectedRx]);

  const persistPrescription = async (nextPrescription: Prescription) => {
    if (!requesterId || !consultationId || !patientId) return;
    setSaving(true);
    setError(null);
    try {
      await upsertPrescription({
        requesterId,
        consultationId,
        patientId,
        prescriptionId: nextPrescription.id,
        templateName: nextPrescription.title || "Consultation",
        signedBy: signedBy ?? null,
        status:
          nextPrescription.drugs.length > 0 &&
          nextPrescription.drugs.every((drug) => drug.validated)
            ? "signed"
            : "draft",
        medications: toMedicationPayload(nextPrescription.drugs),
      });
    } catch (err) {
      console.error("Failed to save prescription:", err);
      setError(err instanceof Error ? err.message : "Failed to save prescription");
    } finally {
      setSaving(false);
    }
  };

  const addPrescription = async (): Promise<Prescription | null> => {
    if (!requesterId || !consultationId || !patientId) return null;
    setSaving(true);
    setError(null);
    try {
      const row = await upsertPrescription({
        requesterId,
        consultationId,
        patientId,
        templateName: "Consultation",
        signedBy: signedBy ?? null,
        status: "draft",
        medications: [],
      });
      const next = mapPrescriptionRow(row, prescriptions.length);
      setPrescriptions((prev) => [next, ...prev]);
      setSelectedRxId(next.id);
      setExpandedDrugId(null);
      return next;
    } catch (err) {
      console.error("Failed to create prescription:", err);
      setError(err instanceof Error ? err.message : "Failed to create prescription");
    } finally {
      setSaving(false);
    }
    return null;
  };

  const patchSelectedPrescription = async (
    patcher: (current: Prescription) => Prescription,
  ) => {
    if (!selectedRx) return;
    const nextPrescription = patcher(selectedRx);
    setPrescriptions((prev) =>
      prev.map((row) => (row.id === nextPrescription.id ? nextPrescription : row)),
    );
    await persistPrescription(nextPrescription);
  };

  const addDrugFromCatalog = async (drug: DrugSuggestion) => {
    if (readOnly) return;
    let active: Prescription | null = selectedRx ?? null;
    if (!active) {
      active = await addPrescription();
    }
    if (!active) return;

    const newDrug: Drug = {
      id: `drug_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: drug.drugName,
      brand: drug.brand ?? null,
      form: drug.form ?? null,
      dosage: drug.dose ?? null,
      laboratory: drug.laboratory ?? null,
      country: drug.country ?? null,
      validated: false,
      qty: "",
      instructions: "",
    };

    const nextPrescription = {
      ...active,
      drugs: [newDrug, ...active.drugs],
    };
    setPrescriptions((prev) =>
      prev.map((row) => (row.id === active.id ? nextPrescription : row)),
    );
    setMedQuery("");
    setExpandedDrugId(newDrug.id);
    await persistPrescription(nextPrescription);
  };

  const toggleValidated = async (drugId: string) => {
    if (readOnly) return;
    await patchSelectedPrescription((current) => ({
      ...current,
      drugs: current.drugs.map((drug) =>
        drug.id === drugId ? { ...drug, validated: !drug.validated } : drug,
      ),
    }));
  };

  const deleteDrug = async (drugId: string) => {
    if (readOnly) return;
    await patchSelectedPrescription((current) => ({
      ...current,
      drugs: current.drugs.filter((drug) => drug.id !== drugId),
    }));
    if (expandedDrugId === drugId) setExpandedDrugId(null);
  };

  const updateDrug = (drugId: string, patch: Partial<Drug>) => {
    if (readOnly) return;
    if (!selectedRx) return;
    setPrescriptions((prev) =>
      prev.map((row) => {
        if (row.id !== selectedRx.id) return row;
        return {
          ...row,
          drugs: row.drugs.map((drug) =>
            drug.id === drugId ? { ...drug, ...patch } : drug,
          ),
        };
      }),
    );
  };

  const saveExpandedDrug = async () => {
    if (readOnly) return;
    if (!selectedRx) return;
    await persistPrescription(selectedRx);
    setExpandedDrugId(null);
  };

  const reusePrescription = async (row: Prescription) => {
    if (readOnly) return;
    if (!requesterId || !consultationId || !patientId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await upsertPrescription({
        requesterId,
        consultationId,
        patientId,
        templateName: row.title || "Consultation",
        signedBy: signedBy ?? null,
        status: "draft",
        medications: toMedicationPayload(row.drugs),
      });
      const next = mapPrescriptionRow(created, prescriptions.length);
      setPrescriptions((prev) => [next, ...prev]);
      setSelectedRxId(next.id);
      setLeftSubTab("types");
    } catch (err) {
      console.error("Failed to reuse previous prescription:", err);
      setError(err instanceof Error ? err.message : "Failed to reuse prescription");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.rootRow}>
      <View style={[styles.col, { flex: 1 }]}>
        <View style={styles.flatPanel}>
          <View style={styles.leftHeaderRow}>
            <Text style={styles.panelTitle}>Médicaments</Text>
            <TouchableOpacity style={styles.blueBtn} onPress={loadPrescriptions}>
              <Ionicons name="refresh-outline" size={16} color={theme.colors.textOnPrimary} />
              <Text style={styles.blueBtnText}>REFRESH</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={medQuery}
              onChangeText={setMedQuery}
              placeholder=""
              style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}
            />
            <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
          </View>

          {!!medQuery.trim() && (suggestionsLoading || !!suggestions.length) && (
            <View style={styles.suggestDropdown}>
              {suggestionsLoading && !suggestions.length ? (
                <Text style={[styles.suggestText, { paddingVertical: 10, paddingHorizontal: 12 }]}>
                  Recherche...
                </Text>
              ) : null}
              {suggestions.map((s) => (
                <TouchableOpacity key={s.id} onPress={() => addDrugFromCatalog(s)} style={styles.suggestItem}>
                  <Text style={styles.suggestText} numberOfLines={1}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <PillTabs theme={theme} tabs={LEFT_SUB_TABS} activeKey={leftSubTab} onChange={setLeftSubTab} />

          {leftSubTab === "types" && (
            <View style={{ marginTop: 10, gap: 10 }}>
              {dbItems.length ? (
                dbItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.typeRow}
                    onPress={() => addDrugFromCatalog(item)}
                    disabled={readOnly}
                  >
                    <Text style={styles.typeText} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.success} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.mutedText}>
                  Aucun médicament trouvé dans `prescription_items`.
                </Text>
              )}
            </View>
          )}

          {leftSubTab === "previous" && (
            <View style={{ marginTop: 10, gap: 10 }}>
              {previousPrescriptions.length ? (
                previousPrescriptions.map((row) => (
                  <TouchableOpacity key={row.id} style={styles.typeRow} onPress={() => reusePrescription(row)} disabled={readOnly}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.typeText}>{row.title || "Prescription précédente"}</Text>
                      <Text style={styles.mutedText}>
                        {row.drugs.length} lignes • {row.createdAt ? new Date(row.createdAt).toLocaleDateString("fr-FR") : "Date inconnue"}
                      </Text>
                    </View>
                    <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.mutedBox}>
                  <Text style={styles.mutedTitle}>Ordonnances Précédentes</Text>
                  <Text style={styles.mutedText}>
                    Les ordonnances validées des autres consultations de ce patient s&apos;afficheront ici.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={[styles.col, { flex: 1 }]}>
        <View style={styles.flatPanel}>
          <View style={styles.rightHeaderRow}>
            <Text style={styles.panelTitle}>Ordonnances</Text>

            <TouchableOpacity style={[styles.greenBtn, (saving || readOnly) && { opacity: 0.7 }]} onPress={addPrescription} disabled={saving || readOnly}>
              <Ionicons name="add" size={16} color={theme.colors.textOnPrimary} />
              <Text style={styles.greenBtnText}>{readOnly ? "LECTURE SEULE" : saving ? "EN COURS..." : "AJOUTER ORDONNANCE"}</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.mutedText}>Chargement des ordonnances…</Text>
            </View>
          ) : null}

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
                    <Text style={[styles.rxChipText, active && styles.rxChipTextActive]}>REF {p.ref}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.orangeBanner}>
            <Text style={styles.orangeBannerText}>REF ORDONNANCE : {selectedRx?.ref ?? "-"}</Text>

            <View style={styles.bannerRightIcons}>
              <TouchableOpacity onPress={() => onPrint?.(selectedRx)} style={styles.iconBtn}>
                <Ionicons name="print" size={18} color={theme.colors.warning} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onOverflow?.(selectedRx)} style={styles.iconBtn}>
                <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.warning} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 10, gap: 10 }}>
            {selectedRx?.drugs?.length ? (
              selectedRx.drugs.map((d) => {
                const expanded = expandedDrugId === d.id;
                return (
                  <View key={d.id} style={styles.drugCard}>
                    <TouchableOpacity style={styles.drugRow} onPress={() => setExpandedDrugId((cur) => (cur === d.id ? null : d.id))}>
                      <View style={styles.drugLeftBar} />

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.drugName} numberOfLines={1}>{d.name}</Text>

                        {!!(d.dose || d.frequency || d.duration) && (
                          <Text style={styles.drugMeta} numberOfLines={1}>
                            {(d.dose || "-") + " • " + (d.frequency || "-") + " • " + (d.duration || "-")}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity onPress={() => toggleValidated(d.id)} style={styles.rowIconBtn} disabled={readOnly}>
                        <Ionicons
                          name={d.validated ? "checkmark-circle" : "checkmark-circle-outline"}
                          size={20}
                          color={d.validated ? theme.colors.success : theme.colors.textSecondary}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => deleteDrug(d.id)} style={styles.rowIconBtn} disabled={readOnly}>
                        <Ionicons name="trash" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </TouchableOpacity>

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
                              editable={!readOnly}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.editorLabel}>Posologie</Text>
                            <TextInput
                              value={d.dose ?? ""}
                              onChangeText={(v) => updateDrug(d.id, { dose: v })}
                              placeholder=""
                              style={[styles.editorInput, { backgroundColor: theme.colors.surface }]}
                              editable={!readOnly}
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
                              editable={!readOnly}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.editorLabel}>Durée</Text>
                            <TextInput
                              value={d.duration ?? ""}
                              onChangeText={(v) => updateDrug(d.id, { duration: v })}
                              placeholder=""
                              style={[styles.editorInput, { backgroundColor: theme.colors.surface }]}
                              editable={!readOnly}
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
                          editable={!readOnly}
                        />

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.primary }, readOnly && { opacity: 0.7 }]} onPress={saveExpandedDrug} disabled={readOnly}>
                          <Ionicons name="save-outline" size={16} color={theme.colors.textOnPrimary} />
                          <Text style={styles.saveBtnText}>{readOnly ? "LECTURE SEULE" : "ENREGISTRER"}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={{ opacity: 0.65, fontWeight: "800", marginTop: 6 }}>
                Aucune ligne. Recherchez un médicament à gauche pour l&apos;ajouter.
              </Text>
            )}
          </View>

          {!!signedBy && <Text style={{ marginTop: 12, opacity: 0.6 }}>Signé : {signedBy}</Text>}
        </View>
      </View>
    </View>
  );
}

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
                backgroundColor: active ? theme.colors.surface : theme.colors.surfaceVariant,
                borderColor: active ? theme.colors.border : "transparent",
              },
            ]}
          >
            <Text
              style={[
                pillStyles.pillText,
                { color: active ? theme.colors.text : theme.colors.textSecondary },
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
    flatPanel: {
      backgroundColor: "transparent",
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
      backgroundColor: theme.colors.info,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    blueBtnText: {
      color: theme.colors.textOnPrimary,
      fontWeight: "900",
      fontSize: 12,
    },
    greenBtn: {
      backgroundColor: theme.colors.success,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    greenBtnText: {
      color: theme.colors.textOnPrimary,
      fontWeight: "900",
      fontSize: 12,
    },
    searchWrap: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      borderColor: theme.colors.border,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
    },
    suggestItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    suggestText: {
      fontWeight: "800",
      opacity: 0.82,
    },
    typeRow: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    typeText: {
      fontWeight: "900",
      opacity: 0.82,
      color: theme.colors.text,
    },
    mutedBox: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      backgroundColor: theme.colors.surfaceVariant,
    },
    mutedTitle: { fontWeight: "900", marginBottom: 6, opacity: 0.8, color: theme.colors.text },
    mutedText: { fontWeight: "800", opacity: 0.65, lineHeight: 18, color: theme.colors.textSecondary },
    loadingBox: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      padding: 12,
    },
    errorBox: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: `${theme.colors.error}33`,
      borderRadius: 10,
      backgroundColor: `${theme.colors.error}10`,
      padding: 10,
    },
    errorText: { color: theme.colors.error, fontWeight: "800" },
    rxChip: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surfaceVariant,
    },
    rxChipActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.info,
    },
    rxChipText: { fontWeight: "900", opacity: 0.75, fontSize: 12 },
    rxChipTextActive: { opacity: 1, color: theme.colors.primary },
    orangeBanner: {
      marginTop: 10,
      backgroundColor: theme.colors.warning,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    orangeBannerText: {
      color: theme.colors.textOnPrimary,
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
      backgroundColor: theme.colors.primarySoft,
    },
    drugCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
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
      color: theme.colors.text,
    },
    drugMeta: {
      fontWeight: "800",
      opacity: 0.55,
      marginTop: 2,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    rowIconBtn: {
      padding: 4,
    },
    drugEditor: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: 12,
      gap: 10,
      backgroundColor: theme.colors.surfaceVariant,
    },
    editorRow: { flexDirection: "row", gap: 12 },
    editorLabel: { fontWeight: "900", opacity: 0.7, marginBottom: 6, color: theme.colors.text },
    editorInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 42,
      fontWeight: "800",
    },
    editorTextarea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    saveBtnText: { color: theme.colors.textOnPrimary, fontWeight: "900", letterSpacing: 0.3 },
  });
