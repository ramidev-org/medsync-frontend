import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";

type Symptom = { name: string; description: string; category: string; frequency: string };

const SYMPTOMS: Symptom[] = [
  { name: "Fièvre", description: "Élévation temporaire de la température corporelle.", category: "Généraux", frequency: "Fréquent" },
  { name: "Fatigue", description: "Sensation persistante de lassitude ou de manque d’énergie.", category: "Généraux", frequency: "Fréquent" },
  { name: "Toux", description: "Réflexe respiratoire destiné à dégager les voies aériennes.", category: "Respiratoires", frequency: "Fréquent" },
  { name: "Dyspnée", description: "Sensation de gêne ou de difficulté à respirer.", category: "Respiratoires", frequency: "À surveiller" },
  { name: "Céphalées", description: "Douleur localisée au niveau de la tête.", category: "Neurologiques", frequency: "Fréquent" },
  { name: "Vertiges", description: "Impression de mouvement ou de perte d’équilibre.", category: "Neurologiques", frequency: "Occasionnel" },
  { name: "Nausées", description: "Sensation désagréable précédant parfois un vomissement.", category: "Digestifs", frequency: "Occasionnel" },
  { name: "Douleur abdominale", description: "Douleur ressentie dans la région de l’abdomen.", category: "Digestifs", frequency: "À surveiller" },
  { name: "Douleur thoracique", description: "Douleur ou gêne située dans la région du thorax.", category: "Douleurs", frequency: "À surveiller" },
  { name: "Palpitations", description: "Perception inhabituelle ou accélérée des battements du cœur.", category: "Cardiovasculaires", frequency: "À surveiller" },
  { name: "Œdème des membres", description: "Gonflement causé par une accumulation de liquide dans les tissus.", category: "Cardiovasculaires", frequency: "Occasionnel" },
  { name: "Éruption cutanée", description: "Modification visible de la couleur ou de la texture de la peau.", category: "Dermatologiques", frequency: "Occasionnel" },
  { name: "Prurit", description: "Sensation cutanée provoquant le besoin de se gratter.", category: "Dermatologiques", frequency: "Fréquent" },
  { name: "Douleur lombaire", description: "Douleur localisée dans la partie basse du dos.", category: "Musculo-squelettiques", frequency: "Fréquent" },
  { name: "Raideur articulaire", description: "Diminution temporaire ou persistante de la mobilité d’une articulation.", category: "Musculo-squelettiques", frequency: "Occasionnel" },
  { name: "Vomissements", description: "Expulsion involontaire du contenu de l’estomac par la bouche.", category: "Digestifs", frequency: "À surveiller" },
  { name: "Diarrhée", description: "Émission fréquente de selles molles ou liquides.", category: "Digestifs", frequency: "Fréquent" },
  { name: "Frissons", description: "Contractions musculaires involontaires souvent associées à la fièvre.", category: "Généraux", frequency: "Occasionnel" },
  { name: "Perte d’appétit", description: "Diminution notable du désir de manger.", category: "Généraux", frequency: "Occasionnel" },
  { name: "Congestion nasale", description: "Obstruction des voies nasales liée au gonflement des muqueuses.", category: "Respiratoires", frequency: "Fréquent" },
  { name: "Troubles de la mémoire", description: "Difficulté inhabituelle à retenir ou restituer des informations.", category: "Neurologiques", frequency: "À surveiller" },
];

const PAGE_SIZE = 7;

const CATEGORIES = [
  { label: "Généraux", count: 48, icon: "body-outline" as const, color: "#0ca86b", soft: "#eaf9f1" },
  { label: "Respiratoires", count: 36, icon: "fitness-outline" as const, color: "#1769ff", soft: "#edf4ff" },
  { label: "Digestifs", count: 31, icon: "leaf-outline" as const, color: "#f97316", soft: "#fff3e9" },
  { label: "Neurologiques", count: 27, icon: "pulse-outline" as const, color: "#7c3aed", soft: "#f3edff" },
  { label: "Douleurs", count: 42, icon: "flash-outline" as const, color: "#f43f5e", soft: "#fff0f2" },
  { label: "Cardiovasculaires", count: 18, icon: "heart-outline" as const, color: "#e11d48", soft: "#fff0f3" },
  { label: "Dermatologiques", count: 24, icon: "water-outline" as const, color: "#0891b2", soft: "#eaf9fc" },
  { label: "Musculo-squelettiques", count: 29, icon: "bandage-outline" as const, color: "#d99a26", soft: "#fff7e9" },
];

function frequencyColors(value: string) {
  if (value === "À surveiller") return { text: "#dc5c05", border: "#ffd1aa", background: "#fff7ee" };
  if (value === "Occasionnel") return { text: "#6d3ed6", border: "#d9c8ff", background: "#f7f3ff" };
  return { text: "#0870dc", border: "#bedaff", background: "#f1f7ff" };
}

export default function SymptomesTab({ theme, value, onChange, readOnly }: { theme: any; value?: string[]; onChange?: (items: string[]) => void; readOnly?: boolean }) {
  const { width } = useWindowDimensions();
  const compact = width < 920;
  const styles = createStyles(theme, compact);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>(value || []);

  useEffect(() => setSelected(value || []), [value]);
  useEffect(() => onChange?.(selected), [onChange, selected]);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");
    return SYMPTOMS.filter((item) => (!q || item.name.toLocaleLowerCase("fr").includes(q) || item.description.toLocaleLowerCase("fr").includes(q)) && (!category || item.category === category));
  }, [category, query]);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageRows = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [category, query]);

  const toggle = (name: string) => {
    if (readOnly) return;
    setSelected((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  const addFromSearch = () => {
    if (readOnly) return;
    const match = results[0];
    if (match) setSelected((current) => current.includes(match.name) ? current : [...current, match.name]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.layout}>
        <View style={styles.filtersCard}>
          <Text style={styles.filterTitle}>Rechercher un symptôme</Text>
          <View style={styles.searchBox}>
            <TextInput value={query} onChangeText={setQuery} placeholder="Tapez le nom d’un symptôme..." placeholderTextColor={theme.colors.muted} style={styles.searchInput} editable={!readOnly} />
            <Ionicons name="search-outline" size={19} color="#60759a" />
          </View>
          <Text style={styles.categoriesTitle}>Catégories de symptômes</Text>
          <View style={styles.categoryList}>
            {CATEGORIES.map((item) => {
              const active = category === item.label;
              return (
                <TouchableOpacity key={item.label} onPress={() => setCategory(active ? null : item.label)} style={[styles.categoryRow, active && styles.categoryRowActive]}>
                  <View style={[styles.categoryIcon, { backgroundColor: item.soft }]}><Ionicons name={item.icon} size={19} color={item.color} /></View>
                  <Text numberOfLines={1} style={styles.categoryLabel}>{item.label}</Text>
                  <View style={styles.categoryCount}><Text style={styles.categoryCountText}>{item.count}</Text></View>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setCategory(null)} style={styles.allCategories}><Text style={styles.allCategoriesText}>VOIR TOUTES LES CATÉGORIES</Text></TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeading}>
            <View><Text style={styles.listTitle}>Liste des symptômes</Text><Text style={styles.listCount}>{results.length} symptôme{results.length === 1 ? "" : "s"}</Text></View>
            {!readOnly && <TouchableOpacity onPress={addFromSearch} style={styles.addButton}><Ionicons name="add" size={20} color={theme.colors.primary} /><Text style={styles.addButtonText}>AJOUTER UN SYMPTÔME</Text></TouchableOpacity>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.headerText, styles.symptomCell]}>Symptôme  ↕</Text>
                <Text style={[styles.headerText, styles.categoryCell]}>Catégorie</Text>
                <Text style={[styles.headerText, styles.frequencyCell]}>Indication</Text>
                <Text style={[styles.headerText, styles.selectionCell]}>Sélection</Text>
                <Text style={[styles.headerText, styles.actionsCell]}>Actions</Text>
              </View>
              {pageRows.map((item) => {
                const checked = selected.includes(item.name);
                const colors = frequencyColors(item.frequency);
                return (
                  <View key={item.name} style={styles.tableRow}>
                    <View style={styles.symptomCell}><Text style={styles.symptomName}>{item.name}</Text><Text numberOfLines={2} style={styles.description}>{item.description}</Text></View>
                    <Text style={[styles.categoryText, styles.categoryCell]}>{item.category}</Text>
                    <View style={styles.frequencyCell}><View style={[styles.statusBadge, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.statusText, { color: colors.text }]}>{item.frequency}</Text></View></View>
                    <TouchableOpacity onPress={() => toggle(item.name)} disabled={readOnly} style={styles.selectionCell} accessibilityRole="checkbox" accessibilityState={{ checked }}><View style={[styles.radio, checked && styles.radioSelected]}>{checked && <View style={styles.radioDot} />}</View></TouchableOpacity>
                    <TouchableOpacity onPress={() => toggle(item.name)} disabled={readOnly} style={styles.actionsCell} accessibilityLabel={checked ? `Retirer ${item.name}` : `Sélectionner ${item.name}`}><Ionicons name="ellipsis-vertical" size={19} color="#06204d" /></TouchableOpacity>
                  </View>
                );
              })}
              {results.length === 0 && <View style={styles.empty}><Ionicons name="search-outline" size={25} color={theme.colors.muted} /><Text style={styles.emptyText}>Aucun symptôme trouvé</Text></View>}
            </View>
          </ScrollView>
          <View style={styles.pagination}><Text style={styles.paginationLabel}>{results.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, results.length)} sur ${results.length}` : "0 résultat"}</Text><TouchableOpacity onPress={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} style={[styles.pageArrow, page === 1 && styles.pageArrowDisabled]}><Ionicons name="chevron-back" size={17} color="#637695" /></TouchableOpacity><View style={styles.currentPage}><Text style={styles.currentPageText}>{page}</Text></View><TouchableOpacity onPress={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} style={[styles.pageArrow, page === pageCount && styles.pageArrowDisabled]}><Ionicons name="chevron-forward" size={17} color="#637695" /></TouchableOpacity></View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, compact: boolean) => StyleSheet.create({
  root: { backgroundColor: "transparent" },
  layout: { flexDirection: compact ? "column" : "row", alignItems: "stretch", gap: 12 },
  filtersCard: { width: compact ? "100%" : 306, flexShrink: 0, padding: 22, borderRadius: 14, borderWidth: 1, borderColor: "#e4eaf2", backgroundColor: theme.colors.surface, ...(Platform.OS === "web" ? ({ boxShadow: "0 6px 18px rgba(28,48,78,0.04)" } as any) : null) },
  filterTitle: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: theme.colors.text },
  searchBox: { height: 46, marginTop: 16, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#d9e2ef", borderRadius: 8, backgroundColor: "#fff" },
  searchInput: { flex: 1, height: 44, padding: 0, paddingRight: 8, fontSize: 12, color: theme.colors.text, outlineStyle: "none" } as any,
  categoriesTitle: { marginTop: 30, marginBottom: 12, fontSize: 14, fontWeight: "700", color: theme.colors.text },
  categoryList: { gap: 7 },
  categoryRow: { minHeight: 43, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#dde5ef", borderRadius: 8, backgroundColor: "#fff" },
  categoryRowActive: { borderColor: "#8cb5ff", backgroundColor: "#f7faff" },
  categoryIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  categoryLabel: { flex: 1, fontSize: 12, fontWeight: "700", color: theme.colors.text },
  categoryCount: { minWidth: 28, height: 25, paddingHorizontal: 6, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f6fa" },
  categoryCountText: { color: "#435878", fontSize: 12, fontWeight: "700" },
  allCategories: { height: 48, marginTop: 23, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "#f1f6fd" },
  allCategoriesText: { fontSize: 11, fontWeight: "700", color: theme.colors.primary },
  listCard: { flex: 1, minWidth: 0, minHeight: 680, padding: 22, borderRadius: 14, borderWidth: 1, borderColor: "#e4eaf2", backgroundColor: theme.colors.surface, ...(Platform.OS === "web" ? ({ boxShadow: "0 6px 18px rgba(28,48,78,0.04)" } as any) : null) },
  listHeading: { minHeight: 55, marginBottom: 18, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  listTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  listCount: { marginTop: 6, fontSize: 12, color: "#3c5173" },
  addButton: { height: 43, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderWidth: 1, borderColor: "#9fc0ff", borderRadius: 8, backgroundColor: "#fff" },
  addButtonText: { fontSize: 11, fontWeight: "700", color: theme.colors.primary },
  tableScroll: { flexGrow: 1 },
  table: { minWidth: 790, flex: 1 },
  tableRow: { minHeight: 81, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#e4e9f0" },
  tableHeader: { minHeight: 50, backgroundColor: "#f7f9fc", borderBottomColor: "#dfe6ef" },
  headerText: { fontSize: 11, fontWeight: "700", color: "#071833" },
  symptomCell: { flex: 1, minWidth: 315, paddingRight: 20 },
  categoryCell: { width: 145 },
  frequencyCell: { width: 135 },
  selectionCell: { width: 105, minHeight: 44, alignItems: "center", justifyContent: "center" },
  actionsCell: { width: 62, minHeight: 44, alignItems: "center", justifyContent: "center" },
  symptomName: { fontSize: 12, lineHeight: 18, fontWeight: "700", color: "#071833" },
  description: { marginTop: 3, fontSize: 11, lineHeight: 17, color: "#324d74" },
  categoryText: { fontSize: 11, fontWeight: "600", color: "#243b60" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: "#3d5a85", alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: theme.colors.primary, borderWidth: 5 },
  radioDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#fff" },
  empty: { height: 180, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { fontSize: 12, color: theme.colors.textSecondary },
  pagination: { minHeight: 82, paddingTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
  paginationLabel: { marginRight: 4, fontSize: 12, fontWeight: "700", color: "#1d3151" },
  pageArrow: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f6fa" },
  pageArrowDisabled: { opacity: 0.45 },
  currentPage: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primary, ...(Platform.OS === "web" ? ({ boxShadow: "0 5px 10px rgba(37,99,235,0.2)" } as any) : null) },
  currentPageText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
