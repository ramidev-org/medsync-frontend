import { DrugSuggestion, getPrescriptionItemsPage, searchDrugsByName } from "@/services/drugs.services";
import { PrescriptionBottlePillIcon } from "@/components/icons/PrescriptionBottlePillIcon";
import { getPrescriptions, upsertPrescription } from "@/services/prescriptions.services";
import type { PrescriptionRow } from "@/services/backend.types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
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
  catalogId?: string;
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

const LEFT_SUB_TABS: { key: LeftSubTabKey; label: string }[] = [
  { key: "types", label: "Ordonnances Type" },
  { key: "previous", label: "Ordonnances Précédentes" },
];

const MEDICATION_FILTERS = ["Tous", "Antibiotiques", "Anti-inflammatoires", "Corticoïdes", "Antalgiques"];
const MORE_MEDICATION_FILTERS = ["Antiviraux", "Antiparasitaires", "Antifongiques", "Antihistaminiques", "Dermatologiques"];
const MEDICATIONS_PER_PAGE = 7;
const MAX_PRESCRIPTION_MEDICATIONS = 6;

function mapPrescriptionRow(row: PrescriptionRow, index: number): Prescription {
  return {
    id: row.id,
    ref: String(index + 1).padStart(2, "0"),
    title: row.template_name || "Consultation",
    createdAt: row.created_at,
    drugs: (row.medications || []).map((medication) => ({
      id: medication.id,
      catalogId: medication.catalog_id || undefined,
      name: medication.medicine_name,
      validated: row.status === "signed",
      dose: medication.dose || "",
      frequency: medication.frequency || "",
      duration: medication.duration || "",
      instructions: medication.instructions || "",
      qty: String(medication.quantity || 1),
    })),
  };
}

function toMedicationPayload(drugs: Drug[]) {
  return drugs.map((drug) => ({
    name: drug.name,
    catalogId: drug.catalogId ?? null,
    quantity: Math.max(1, Number.parseInt(drug.qty || "1", 10) || 1),
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
  resetSignal,
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
  resetSignal?: number;
  onPrint?: (rx?: Prescription) => void;
  onOverflow?: (rx?: Prescription) => void;
  onSelectedPrescriptionChange?: (rx?: Prescription) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [leftSubTab, setLeftSubTab] = React.useState<LeftSubTabKey>("types");
  const [activeMedicationFilter, setActiveMedicationFilter] = React.useState("Tous");
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false);
  const [templateMenuId, setTemplateMenuId] = React.useState<string | null>(null);
  const [templatePreview, setTemplatePreview] = React.useState<Prescription | null>(null);
  const [medQuery, setMedQuery] = React.useState("");
  const debouncedMedQuery = useDebouncedValue(medQuery, 200);
  const [suggestions, setSuggestions] = React.useState<DrugSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);
  const [dbItems, setDbItems] = React.useState<DrugSuggestion[]>([]);
  const [catalogPage, setCatalogPage] = React.useState(1);
  const [catalogTotal, setCatalogTotal] = React.useState<number | null>(null);
  const [catalogHasNext, setCatalogHasNext] = React.useState(false);
  const [catalogLoading, setCatalogLoading] = React.useState(false);
  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>([]);
  const [previousPrescriptions, setPreviousPrescriptions] = React.useState<Prescription[]>([]);
  const [selectedRxId, setSelectedRxId] = React.useState<string | undefined>(undefined);
  const [expandedDrugId, setExpandedDrugId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const selectedRx = prescriptions.find((p) => p.id === selectedRxId);
  const displayedRx = templatePreview ?? selectedRx;
  const visibleCatalogItems = dbItems;
  const catalogTotalPages = catalogTotal == null
    ? catalogPage + (catalogHasNext ? 1 : 0)
    : Math.max(1, Math.ceil(catalogTotal / MEDICATIONS_PER_PAGE));
  const catalogPageNumbers = Array.from(
    { length: Math.min(3, catalogTotalPages) },
    (_, index) => Math.max(1, Math.min(catalogTotalPages - 2, catalogPage - 1)) + index,
  ).filter((page, index, pages) => page <= catalogTotalPages && pages.indexOf(page) === index);
  const catalogRangeStart = visibleCatalogItems.length ? (catalogPage - 1) * MEDICATIONS_PER_PAGE + 1 : 0;
  const catalogRangeEnd = (catalogPage - 1) * MEDICATIONS_PER_PAGE + visibleCatalogItems.length;
  const namedCurrentPrescriptions = prescriptions.filter((prescription) => prescription.title !== "Consultation");
  const templatePrescriptions = [...namedCurrentPrescriptions, ...previousPrescriptions]
    .filter((prescription, index, rows) =>
      prescription.drugs.length > 0 &&
      rows.findIndex((row) => row.id === prescription.id) === index,
    );
  const onSelectedPrescriptionChangeRef = React.useRef(onSelectedPrescriptionChange);
  const resetSignalRef = React.useRef(resetSignal);
  const medicationTypeScrollRef = React.useRef<ScrollView>(null);
  const medicationTypeScrollXRef = React.useRef(0);

  const scrollMedicationTypes = (direction: -1 | 1) => {
    const nextOffset = Math.max(0, medicationTypeScrollXRef.current + direction * 180);
    medicationTypeScrollXRef.current = nextOffset;
    medicationTypeScrollRef.current?.scrollTo({ x: nextOffset, animated: true });
  };

  React.useEffect(() => {
    onSelectedPrescriptionChangeRef.current = onSelectedPrescriptionChange;
  }, [onSelectedPrescriptionChange]);

  const loadCatalogPage = React.useCallback(async (page: number) => {
    if (!requesterId) return;
    setCatalogLoading(true);
    try {
      const result = await getPrescriptionItemsPage(String(requesterId), page, MEDICATIONS_PER_PAGE);
      setDbItems(result.items);
      setCatalogPage(result.page);
      setCatalogTotal(result.totalCount);
      setCatalogHasNext(result.hasNextPage);
      setError(null);
    } catch (err) {
      console.error("Failed to load medication page:", err);
      setError(err instanceof Error ? err.message : "Impossible de charger les médicaments");
    } finally {
      setCatalogLoading(false);
    }
  }, [requesterId]);

  const loadPrescriptions = React.useCallback(async () => {
    if (!requesterId || !consultationId || !patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [catalogResult, currentRows, patientRows] = await Promise.all([
        getPrescriptionItemsPage(String(requesterId ?? ""), 1, MEDICATIONS_PER_PAGE).catch(() => null),
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

      if (catalogResult) {
        setDbItems(catalogResult.items);
        setCatalogPage(catalogResult.page);
        setCatalogTotal(catalogResult.totalCount);
        setCatalogHasNext(catalogResult.hasNextPage);
      }
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
    if (!requesterId || !consultationId || !patientId) return false;
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
      return true;
    } catch (err) {
      console.error("Failed to save prescription:", err);
      setError(err instanceof Error ? err.message : "Failed to save prescription");
      return false;
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

    const existing = active.drugs.find((item) =>
      item.catalogId === drug.id || item.name.trim().toLocaleLowerCase("fr") === drug.drugName.trim().toLocaleLowerCase("fr"),
    );
    if (existing) {
      setTemplatePreview(null);
      setSelectedRxId(active.id);
      setExpandedDrugId(existing.id);
      setError("Ce médicament est déjà dans l’ordonnance. Modifiez sa quantité à droite.");
      return;
    }
    if (active.drugs.length >= MAX_PRESCRIPTION_MEDICATIONS) {
      setError(`Vous pouvez ajouter au maximum ${MAX_PRESCRIPTION_MEDICATIONS} médicaments par ordonnance.`);
      return;
    }

    const newDrug: Drug = {
      id: `drug_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      catalogId: drug.id,
      name: drug.drugName,
      brand: drug.brand ?? null,
      form: drug.form ?? null,
      dosage: drug.dose ?? null,
      dose: drug.dose ?? "",
      laboratory: drug.laboratory ?? null,
      country: drug.country ?? null,
      validated: false,
      qty: "1",
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
    setError(null);
    setTemplatePreview(null);
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

  const changeDrugQuantity = async (drugId: string, delta: number) => {
    if (readOnly) return;
    await patchSelectedPrescription((current) => ({
      ...current,
      drugs: current.drugs.map((drug) => {
        if (drug.id !== drugId) return drug;
        const quantity = Math.max(1, Number.parseInt(drug.qty || "1", 10) || 1);
        return { ...drug, qty: String(Math.max(1, quantity + delta)) };
      }),
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

  const saveCurrentPrescription = async () => {
    if (readOnly || !selectedRx) return;
    setOverflowMenuOpen(false);
    const nextPrescription: Prescription = {
      ...selectedRx,
      title: selectedRx.title && selectedRx.title !== "Consultation"
        ? selectedRx.title
        : `Ordonnance du ${new Date().toLocaleDateString("fr-FR")}`,
    };
    const saved = await persistPrescription(nextPrescription);
    if (saved) {
      setPrescriptions((current) => current.map((row) => row.id === nextPrescription.id ? nextPrescription : row));
    }
  };

  const resetCurrentPrescription = async () => {
    if (readOnly || !selectedRx) return;
    setTemplatePreview(null);
    setExpandedDrugId(null);
    await patchSelectedPrescription((current) => ({ ...current, drugs: [] }));
  };

  const resetCurrentPrescriptionActionRef = React.useRef(resetCurrentPrescription);
  resetCurrentPrescriptionActionRef.current = resetCurrentPrescription;

  React.useEffect(() => {
    if (resetSignal == null || resetSignal === resetSignalRef.current) return;
    resetSignalRef.current = resetSignal;
    resetCurrentPrescriptionActionRef.current();
  }, [resetSignal]);

  const removeTemplate = (row: Prescription) => {
    setPreviousPrescriptions((prev) => prev.filter((item) => item.id !== row.id));
    setPrescriptions((prev) => prev.filter((item) => item.id !== row.id));
    setTemplatePreview((current) => (current?.id === row.id ? null : current));
    setTemplateMenuId(null);
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
      <View style={[styles.col, styles.leftCol, { flex: 0.4 }]}>
        <View style={styles.flatPanel}>
          <View style={styles.leftHeaderRow}>
            <View style={styles.sectionHeading}>
              <Ionicons name="bookmark-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.cleanSectionTitle}>MÉDICAMENTS</Text>
            </View>
            <Text style={styles.sectionTitle}>MÉDICAMENTS</Text>
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
              placeholder="Rechercher un médicament..."
              placeholderTextColor={theme.colors.textSecondary}
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

          <View style={styles.filterArea}>
            <View style={styles.filterNavigationRow}>
              <TouchableOpacity style={styles.filterNavigationButton} onPress={() => scrollMedicationTypes(-1)} accessibilityLabel="Types précédents"><Ionicons name="chevron-back" size={16} color={theme.colors.primary} /></TouchableOpacity>
              <ScrollView
                ref={medicationTypeScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                onScroll={(event) => { medicationTypeScrollXRef.current = event.nativeEvent.contentOffset.x; }}
                scrollEventThrottle={16}
              >
                <View style={styles.filterRow}>
                  {[...MEDICATION_FILTERS, ...MORE_MEDICATION_FILTERS].map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      onPress={() => setActiveMedicationFilter(filter)}
                      style={[styles.filterChip, activeMedicationFilter === filter && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterChipText, activeMedicationFilter === filter && styles.filterChipTextActive]}>{filter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity style={styles.filterNavigationButton} onPress={() => scrollMedicationTypes(1)} accessibilityLabel="Types suivants"><Ionicons name="chevron-forward" size={16} color={theme.colors.primary} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.catalogList}>
            {catalogLoading ? (
              <View style={styles.catalogLoading}><ActivityIndicator color={theme.colors.primary} /><Text style={styles.mutedText}>Chargement…</Text></View>
            ) : visibleCatalogItems.length ? visibleCatalogItems.map((item) => {
              const selectedDrug = selectedRx?.drugs.find((drug) => drug.catalogId === item.id || drug.name.trim().toLocaleLowerCase("fr") === item.drugName.trim().toLocaleLowerCase("fr"));
              const limitReached = (selectedRx?.drugs.length ?? 0) >= MAX_PRESCRIPTION_MEDICATIONS;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.catalogRow, selectedDrug && styles.catalogRowSelected, limitReached && !selectedDrug && styles.catalogRowDisabled]}
                  onPress={() => {
                    if (selectedDrug) {
                      setTemplatePreview(null);
                      setExpandedDrugId(selectedDrug.id);
                    } else {
                      addDrugFromCatalog(item);
                    }
                  }}
                  disabled={readOnly || (limitReached && !selectedDrug)}
                >
                  <View style={styles.catalogText}>
                    <Text style={styles.catalogName} numberOfLines={1}>{item.label}</Text>
                    <Text style={styles.catalogMeta} numberOfLines={1}>{item.form || "Spray nasal"} • {item.brand || item.laboratory || "Médicament"}</Text>
                  </View>
                  <View style={[styles.addMedicationButton, selectedDrug && styles.addMedicationButtonSelected]}>
                    <Ionicons name={selectedDrug ? "create-outline" : "add"} size={18} color={selectedDrug ? theme.colors.primary : theme.colors.success} />
                  </View>
                </TouchableOpacity>
              );
            }) : <Text style={styles.mutedText}>Aucun médicament trouvé.</Text>}
          </View>
          <View style={styles.paginationRow}>
            <Text style={styles.paginationLabel}>{catalogRangeStart}–{catalogRangeEnd}{catalogTotal != null ? ` sur ${catalogTotal}` : ""}</Text>
            <TouchableOpacity style={[styles.pageButton, catalogPage === 1 && styles.pageButtonDisabled]} onPress={() => loadCatalogPage(catalogPage - 1)} disabled={catalogPage === 1 || catalogLoading}><Ionicons name="chevron-back" size={14} color={theme.colors.textSecondary} /></TouchableOpacity>
            {catalogPageNumbers.map((page) => (
              <TouchableOpacity key={page} style={[styles.pageButton, page === catalogPage && styles.pageButtonActive]} onPress={() => loadCatalogPage(page)} disabled={catalogLoading}>
                <Text style={page === catalogPage ? styles.pageButtonActiveText : styles.pageButtonText}>{page}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.pageButton, !catalogHasNext && styles.pageButtonDisabled]} onPress={() => loadCatalogPage(catalogPage + 1)} disabled={!catalogHasNext || catalogLoading}><Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} /></TouchableOpacity>
          </View>

          <View style={styles.legacyLeftContent}>
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
      </View>

      <View style={[styles.col, { flex: 0.6 }]}>
        <View style={[styles.flatPanel, styles.rightPanel]}>
          <View style={styles.currentPrescriptionPanel}>
          <View style={styles.rightHeaderRow}>
            <View style={styles.sectionHeading}>
              <Ionicons name="bookmark-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.cleanSectionTitle}>ORDONNANCE EN COURS</Text>
              <View style={styles.medicationLimitBadge}><Text style={styles.medicationLimitText}>{selectedRx?.drugs.length ?? 0}/{MAX_PRESCRIPTION_MEDICATIONS}</Text></View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconButton} onPress={() => onPrint?.(displayedRx)}><MaterialCommunityIcons name="printer-outline" size={22} color={theme.colors.textSecondary} /></TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton} onPress={() => setOverflowMenuOpen((open) => !open)}><Ionicons name="ellipsis-vertical" size={22} color={theme.colors.textSecondary} /></TouchableOpacity>
              {overflowMenuOpen && (
                <View style={styles.overflowMenu}>
                  <TouchableOpacity style={styles.overflowMenuItem} onPress={saveCurrentPrescription} disabled={saving || readOnly || !selectedRx}>
                    <Ionicons name="save-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.overflowMenuText}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
                  </TouchableOpacity>
                  <View style={styles.overflowMenuDivider} />
                  <TouchableOpacity style={styles.overflowMenuItem} onPress={() => { setOverflowMenuOpen(false); resetCurrentPrescription(); }} disabled={readOnly || !selectedRx}>
                    <Ionicons name="refresh-outline" size={18} color={theme.colors.warning} />
                    <Text style={[styles.overflowMenuText, { color: theme.colors.warning }]}>Réinitialiser</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.sectionTitle}>ORDONNANCE EN COURS</Text>
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

          <View style={styles.rxDesign}>
            <View style={[styles.rxEmptyState, displayedRx?.drugs?.length ? styles.rxPopulatedState : null]}>
              {displayedRx?.drugs?.length ? (
                <View style={styles.rxDrugPreview}>
                  {displayedRx.drugs.map((drug) => {
                    const expanded = expandedDrugId === drug.id;
                    const editable = !templatePreview && selectedRx?.id === displayedRx.id && !readOnly;
                    return (
                      <View key={drug.id} style={[styles.selectedDrugCard, expanded && styles.selectedDrugCardExpanded]}>
                        <View style={styles.selectedDrugRow}>
                          <View style={styles.selectedDrugIcon}><MaterialCommunityIcons name="pill" size={20} color={theme.colors.primary} /></View>
                          <TouchableOpacity style={styles.selectedDrugCopy} onPress={() => editable && setExpandedDrugId(expanded ? null : drug.id)} disabled={!editable}>
                            <Text style={styles.rxPreviewName} numberOfLines={1}>{drug.name}</Text>
                            <Text style={styles.rxPreviewMeta} numberOfLines={1}>
                              {[drug.dosage || drug.dose, drug.frequency, drug.duration].filter(Boolean).join(" • ") || "Médicament sélectionné"}
                            </Text>
                          </TouchableOpacity>
                          {editable && (
                            <View style={styles.selectedDrugActions}>
                              <TouchableOpacity style={styles.medicationActionButton} onPress={() => setExpandedDrugId(expanded ? null : drug.id)} accessibilityLabel="Modifier le médicament"><Ionicons name="create-outline" size={17} color={theme.colors.primary} /></TouchableOpacity>
                              <TouchableOpacity style={styles.medicationActionButton} onPress={() => changeDrugQuantity(drug.id, -1)} accessibilityLabel="Diminuer la quantité"><Ionicons name="remove" size={18} color={theme.colors.textSecondary} /></TouchableOpacity>
                              <Text style={styles.medicationQuantity}>{drug.qty || "1"}</Text>
                              <TouchableOpacity style={styles.medicationActionButton} onPress={() => changeDrugQuantity(drug.id, 1)} accessibilityLabel="Augmenter la quantité"><Ionicons name="add" size={18} color={theme.colors.success} /></TouchableOpacity>
                              <TouchableOpacity style={[styles.medicationActionButton, styles.deleteMedicationButton]} onPress={() => deleteDrug(drug.id)} accessibilityLabel="Supprimer le médicament"><Ionicons name="trash-outline" size={17} color={theme.colors.error} /></TouchableOpacity>
                            </View>
                          )}
                        </View>
                        {expanded && editable && (
                          <View style={styles.inlineDrugEditor}>
                            <View style={styles.editorRow}>
                              <View style={styles.editorField}><Text style={styles.editorLabel}>Fréquence</Text><TextInput value={drug.frequency ?? ""} onChangeText={(value) => updateDrug(drug.id, { frequency: value })} placeholder="Ex. 2 fois/jour" placeholderTextColor={theme.colors.textSecondary} style={styles.editorInput} /></View>
                              <View style={styles.editorField}><Text style={styles.editorLabel}>Durée</Text><TextInput value={drug.duration ?? ""} onChangeText={(value) => updateDrug(drug.id, { duration: value })} placeholder="Ex. 7 jours" placeholderTextColor={theme.colors.textSecondary} style={styles.editorInput} /></View>
                            </View>
                            <Text style={styles.editorLabel}>Instructions</Text>
                            <TextInput value={drug.instructions ?? ""} onChangeText={(value) => updateDrug(drug.id, { instructions: value })} placeholder="Instructions pour le patient" placeholderTextColor={theme.colors.textSecondary} multiline style={styles.inlineInstructionsInput} />
                            <View style={styles.inlineEditorFooter}>
                              <TouchableOpacity style={styles.cancelEditorButton} onPress={() => setExpandedDrugId(null)}><Text style={styles.cancelEditorText}>ANNULER</Text></TouchableOpacity>
                              <TouchableOpacity style={styles.confirmEditorButton} onPress={saveExpandedDrug} disabled={saving}><Ionicons name="checkmark" size={17} color={theme.colors.textOnPrimary} /><Text style={styles.confirmEditorText}>{saving ? "ENREGISTREMENT…" : "ENREGISTRER"}</Text></TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <>
                  <View style={styles.emptyRxIcon}>
                    <PrescriptionBottlePillIcon size={96} color="#91A3C2" />
                  </View>
                  <Text style={styles.emptyRxTitle}>Aucun médicament ajouté</Text>
                  <Text style={styles.emptyRxText}>Ajoutez des médicaments depuis la liste à gauche{`\n`}pour composer cette ordonnance.</Text>
                </>
              )}
            </View>
            <View style={styles.signerRow}>
              <View style={styles.signerInfo}>
                <View style={[styles.signerIcon, styles.signatureIcon]}><MaterialCommunityIcons name="draw-pen" size={27} color={theme.colors.success} /></View>
                <View><Text style={styles.signerLabel}>Signé par</Text><Text style={styles.signerName}>{signedBy || "Dr Amina Rahmani"}</Text></View>
              </View>
              <View style={styles.signerInfo}>
                <View style={[styles.signerIcon, styles.calendarIcon]}><MaterialCommunityIcons name="calendar-month-outline" size={28} color={theme.colors.primary} /></View>
                <View><Text style={styles.signerLabel}>Date</Text><Text style={styles.signerName}>{new Date().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Text></View>
              </View>
            </View>
          </View>
          </View>
          <View style={styles.templatesPanel}>
            <View style={styles.templatesHeader}>
              <View style={styles.templatesHeadingCopy}>
                <View style={styles.sectionHeading}>
                  <Ionicons name="bookmark-outline" size={21} color={theme.colors.primary} />
                  <Text style={styles.templatesTitle}>ORDONNANCES ENREGISTRÉES (MODÈLES)</Text>
                </View>
                <Text style={styles.templatesSubtitle}>Accédez rapidement à vos ordonnances enregistrées.</Text>
              </View>
              <TouchableOpacity style={styles.viewAllButton}><Text style={styles.viewAllText}>VOIR TOUT</Text><Ionicons name="arrow-forward" size={14} color={theme.colors.primary} /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.templateRow}>
                {templatePrescriptions.slice(0, 5).map((row) => (
                  <View key={row.id} style={styles.templateCardWrap}>
                    <TouchableOpacity style={styles.templateCard} onPress={() => { setTemplatePreview(row); setTemplateMenuId(null); }}>
                    <View style={styles.templateCardTop}><MaterialCommunityIcons name="file-document-outline" size={21} color={theme.colors.primary} /><TouchableOpacity onPress={() => setTemplateMenuId((current) => current === row.id ? null : row.id)}><Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textSecondary} /></TouchableOpacity></View>
                    <Text style={styles.templateName} numberOfLines={1}>{row.title || "Ordonnance"}</Text>
                    <Text style={styles.templateCount}>{row.drugs.length} médicaments</Text>
                    <Text style={styles.templateDate}>Modifié le {row.createdAt ? new Date(row.createdAt).toLocaleDateString("fr-FR") : "02/08/2026"}</Text>
                    </TouchableOpacity>
                    {templateMenuId === row.id && (
                      <View style={styles.templateMenu}>
                        <TouchableOpacity onPress={() => { setTemplatePreview(row); setTemplateMenuId(null); }}><Text style={styles.templateMenuItem}>VOIR</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => removeTemplate(row)}><Text style={[styles.templateMenuItem, { color: theme.colors.error }]}>RETIRER</Text></TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
                {!templatePrescriptions.length && <Text style={styles.mutedText}>Aucune ordonnance enregistrée.</Text>}
              </View>
            </ScrollView>
          </View>

          <View style={styles.legacyRightContent}>
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
              <Text style={{ opacity: 0.65, fontWeight: "600", marginTop: 6 }}>
                Aucune ligne. Recherchez un médicament à gauche pour l&apos;ajouter.
              </Text>
            )}
          </View>

          {!!signedBy && <Text style={{ marginTop: 12, opacity: 0.6 }}>Signé : {signedBy}</Text>}
        </View>
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
    fontWeight: "700",
  },
});

const createStyles = (theme: any) =>
  StyleSheet.create({
    rootRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "stretch",
      width: "100%",
      alignSelf: "stretch",
      padding: 0,
      backgroundColor: "transparent",
      borderWidth: 0,
      borderRadius: 0,
      overflow: "visible",
    },
    col: {
      minWidth: 0,
    },
    leftCol: {},
    flatPanel: {
      backgroundColor: theme.colors.surface,
      padding: 18,
      minHeight: 720,
      height: "100%",
      flexDirection: "column",
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      ...(Platform.OS === "web"
        ? ({ boxShadow: "0 8px 24px rgba(23, 43, 77, 0.035)" } as any)
        : null),
    },
    rightPanel: {
      minHeight: 0,
      height: "auto",
      padding: 0,
      gap: 8,
      borderWidth: 0,
      borderRadius: 0,
      backgroundColor: "transparent",
      overflow: "visible",
      ...(Platform.OS === "web" ? ({ boxShadow: "none" } as any) : null),
    },
    currentPrescriptionPanel: {
      position: "relative",
      zIndex: 10,
      overflow: "visible",
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    templatesPanel: {
      position: "relative",
      zIndex: 1,
      minHeight: 216,
      paddingHorizontal: 14,
      paddingTop: 15,
      paddingBottom: 13,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    panelTitle: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.25,
      color: theme.colors.text,
      display: "none",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.25,
      color: theme.colors.text,
      display: "none",
    },
    cleanSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.25,
      color: theme.colors.text,
    },
    headerActions: { position: "relative", zIndex: 110, flexDirection: "row", alignItems: "center", gap: 9 },
    headerIconButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: "#FCFDFF", alignItems: "center", justifyContent: "center" },
    overflowMenu: { position: "absolute", top: 47, right: 0, zIndex: 120, elevation: 20, width: 184, paddingVertical: 7, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.surface, ...(Platform.OS === "web" ? ({ boxShadow: "0 12px 28px rgba(15,23,42,0.18)" } as any) : null) },
    overflowMenuItem: { minHeight: 42, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 },
    overflowMenuText: { fontSize: 12, fontWeight: "700", color: theme.colors.text },
    overflowMenuDivider: { height: 1, marginHorizontal: 9, backgroundColor: theme.colors.border },
    leftHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
    medicationLimitBadge: { minWidth: 38, height: 25, paddingHorizontal: 8, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
    medicationLimitText: { fontSize: 10, fontWeight: "700", color: theme.colors.primary },
    rightHeaderRow: {
      position: "relative",
      zIndex: 100,
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
      display: "none",
    },
    blueBtnText: {
      color: theme.colors.textOnPrimary,
      fontWeight: "700",
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
      display: "none",
    },
    greenBtnText: {
      color: theme.colors.textOnPrimary,
      fontWeight: "700",
      fontSize: 12,
    },
    searchWrap: {
      marginTop: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      minHeight: 50,
    },
    filterArea: { position: "relative", zIndex: 12, marginTop: 12 },
    filterNavigationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    filterNavigationButton: { width: 30, height: 32, flexShrink: 0, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: "#FCFDFF", alignItems: "center", justifyContent: "center" },
    filterScroll: { flex: 1, minWidth: 0 },
    filterRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    extraFilterRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 7 },
    filterChip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F7F9FD" },
    filterChipActive: { backgroundColor: theme.colors.primary },
    filterChipText: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary },
    filterChipTextActive: { color: theme.colors.textOnPrimary },
    catalogList: { marginTop: 14, gap: 7 },
    catalogRow: { minHeight: 56, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, backgroundColor: theme.colors.surface },
    catalogRowSelected: { borderColor: `${theme.colors.primary}66`, backgroundColor: "#F8FBFF" },
    catalogRowDisabled: { opacity: 0.45 },
    catalogLoading: { minHeight: 120, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
    catalogText: { flex: 1, minWidth: 0 },
    catalogName: { fontSize: 13, fontWeight: "700", color: theme.colors.text },
    catalogMeta: { marginTop: 5, fontSize: 11, color: theme.colors.textSecondary },
    addMedicationButton: { width: 34, height: 34, borderRadius: 9, backgroundColor: theme.colors.successSoft, alignItems: "center", justifyContent: "center" },
    addMedicationButtonSelected: { backgroundColor: theme.colors.primarySoft },
    paginationRow: { marginTop: "auto", paddingTop: 24, paddingBottom: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    paginationLabel: { fontSize: 11, color: theme.colors.textSecondary, marginRight: 8 },
    pageButton: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
    pageButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    pageButtonDisabled: { opacity: 0.35 },
    pageButtonText: { fontSize: 11, fontWeight: "600", color: theme.colors.textSecondary },
    pageButtonActiveText: { fontSize: 11, fontWeight: "700", color: theme.colors.textOnPrimary },
    legacyLeftContent: { display: "none" },
    legacyRightContent: { display: "none" },
    rxDesign: { position: "relative", zIndex: 1, marginTop: 18, gap: 14 },
    rxEmptyState: { minHeight: 330, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: "#FCFDFF", alignItems: "center", justifyContent: "center", padding: 24 },
    rxPopulatedState: { minHeight: 330, padding: 0, borderWidth: 0, borderRadius: 0, backgroundColor: "transparent", alignItems: "stretch", justifyContent: "flex-start" },
    emptyRxIcon: { width: 100, height: 100, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    emptyRxTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
    emptyRxText: { marginTop: 14, textAlign: "center", fontSize: 13, lineHeight: 22, color: theme.colors.textSecondary },
    rxDrugPreview: { width: "100%", gap: 8 },
    rxPreviewRow: { padding: 10, borderRadius: 8, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, flexDirection: "row", alignItems: "center", gap: 9 },
    rxPreviewName: { flex: 1, fontSize: 12, fontWeight: "700", color: theme.colors.text },
    rxPreviewMeta: { fontSize: 10, color: theme.colors.textSecondary },
    signerRow: { minHeight: 74, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, backgroundColor: theme.colors.surface },
    signerInfo: { flexDirection: "row", alignItems: "center", gap: 11 },
    signerIcon: { width: 48, height: 48, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    signatureIcon: { backgroundColor: "#F0FBF6" },
    calendarIcon: { backgroundColor: "#F3F7FF" },
    signerLabel: { fontSize: 11, color: theme.colors.textSecondary },
    signerName: { marginTop: 4, fontSize: 12, fontWeight: "600", color: theme.colors.text },
    templatesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    templatesHeadingCopy: { flex: 1, minWidth: 0 },
    templatesTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.text },
    templatesSubtitle: { marginTop: 4, fontSize: 11, color: theme.colors.textSecondary },
    viewAllButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7, borderWidth: 1, borderColor: theme.colors.primary, flexDirection: "row", alignItems: "center", gap: 5 },
    viewAllText: { fontSize: 9, fontWeight: "700", color: theme.colors.primary },
    templateRow: { flexDirection: "row", gap: 10, paddingTop: 13, paddingBottom: 1 },
    templateCardWrap: { position: "relative" },
    templateCard: { width: 174, minHeight: 118, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: "#FCFDFF" },
    selectedDrugCard: { overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, backgroundColor: theme.colors.surface },
    selectedDrugCardExpanded: { borderColor: `${theme.colors.primary}66`, ...(Platform.OS === "web" ? ({ boxShadow: "0 6px 18px rgba(37,99,235,0.08)" } as any) : null) },
    selectedDrugRow: { minHeight: 62, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 9 },
    selectedDrugIcon: { width: 38, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
    selectedDrugCopy: { flex: 1, minWidth: 110 },
    selectedDrugActions: { flexDirection: "row", alignItems: "center", gap: 5 },
    medicationActionButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: "#FCFDFF", alignItems: "center", justifyContent: "center" },
    deleteMedicationButton: { borderColor: `${theme.colors.error}30`, backgroundColor: `${theme.colors.error}08` },
    medicationQuantity: { minWidth: 22, textAlign: "center", fontSize: 12, fontWeight: "700", color: theme.colors.text },
    inlineDrugEditor: { padding: 13, gap: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: "#FBFCFF" },
    editorField: { flex: 1, minWidth: 110 },
    inlineInstructionsInput: { minHeight: 66, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9, backgroundColor: theme.colors.surface, color: theme.colors.text, textAlignVertical: "top" },
    inlineEditorFooter: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
    cancelEditorButton: { minHeight: 38, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, backgroundColor: theme.colors.surface },
    cancelEditorText: { fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary },
    confirmEditorButton: { minHeight: 38, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, backgroundColor: theme.colors.primary },
    confirmEditorText: { fontSize: 11, fontWeight: "700", color: theme.colors.textOnPrimary },
    templateCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    templateName: { marginTop: 8, fontSize: 12, fontWeight: "700", color: theme.colors.text },
    templateCount: { marginTop: 4, fontSize: 11, color: theme.colors.textSecondary },
    templateDate: { marginTop: 7, fontSize: 10, color: theme.colors.textSecondary },
    templateMenu: { position: "absolute", top: 26, right: 4, zIndex: 5, padding: 6, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 6, backgroundColor: theme.colors.surface, gap: 6, ...(Platform.OS === "web" ? ({ boxShadow: "0 4px 12px rgba(15,23,42,0.12)" } as any) : null) },
    templateMenuItem: { fontSize: 10, fontWeight: "700", color: theme.colors.primary },
    resetButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 7, borderWidth: 1, borderColor: theme.colors.primarySoft },
    resetButtonText: { fontSize: 10, fontWeight: "700", color: theme.colors.primary },
    searchInput: {
      flex: 1,
      minHeight: 26,
      padding: 0,
      fontSize: 13,
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
      fontWeight: "600",
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
      fontWeight: "700",
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
    mutedTitle: { fontWeight: "700", marginBottom: 6, opacity: 0.8, color: theme.colors.text },
    mutedText: { fontWeight: "600", opacity: 0.65, lineHeight: 18, color: theme.colors.textSecondary },
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
    errorText: { color: theme.colors.error, fontWeight: "600" },
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
    rxChipText: { fontWeight: "700", opacity: 0.75, fontSize: 12 },
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
      fontWeight: "700",
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
      fontWeight: "700",
      opacity: 0.9,
      color: theme.colors.text,
    },
    drugMeta: {
      fontWeight: "600",
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
    editorLabel: { fontWeight: "700", opacity: 0.7, marginBottom: 6, color: theme.colors.text },
    editorInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 42,
      fontWeight: "600",
    },
    editorTextarea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 90,
      fontWeight: "600",
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
    saveBtnText: { color: theme.colors.textOnPrimary, fontWeight: "700", letterSpacing: 0.3 },
  });
