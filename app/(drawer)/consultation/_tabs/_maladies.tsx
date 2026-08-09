import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

type DiseaseStatus = "Active" | "Antécédent" | "Chronique";
type Disease = {
  code: string;
  label: string;
  description: string;
  category: string;
  status: DiseaseStatus;
  date: string;
};

const ICD_CATALOG: Disease[] = [
  { code: "A00", label: "Choléra", description: "Infection intestinale aiguë causée par Vibrio cholerae.", category: "Infectieuses", status: "Active", date: "08/08/2026" },
  { code: "B01", label: "Varicelle", description: "Infection virale contagieuse caractérisée par une éruption cutanée.", category: "Infectieuses", status: "Antécédent", date: "12/07/2026" },
  { code: "C02", label: "Tumeur maligne de la langue (exemple)", description: "Tumeur maligne située sur la langue.", category: "Néoplasmes", status: "Antécédent", date: "15/05/2026" },
  { code: "J10", label: "Grippe due à un virus identifié", description: "Infection respiratoire aiguë due à un virus grippal identifié.", category: "Respiratoires", status: "Antécédent", date: "20/04/2026" },
  { code: "J20", label: "Bronchite aiguë", description: "Inflammation aiguë des bronches.", category: "Respiratoires", status: "Antécédent", date: "10/03/2026" },
  { code: "K29", label: "Gastrite", description: "Inflammation de la muqueuse de l’estomac.", category: "Digestives", status: "Chronique", date: "05/01/2026" },
  { code: "E11", label: "Diabète sucré de type 2", description: "Trouble métabolique chronique caractérisé par une hyperglycémie.", category: "Endocriniennes", status: "Chronique", date: "02/11/2025" },
  { code: "I10", label: "Hypertension artérielle essentielle", description: "Élévation persistante de la pression artérielle sans cause secondaire identifiée.", category: "Cardiovasculaires", status: "Chronique", date: "18/10/2025" },
  { code: "I25", label: "Cardiopathie ischémique chronique", description: "Insuffisance durable de l’apport sanguin au muscle cardiaque.", category: "Cardiovasculaires", status: "Chronique", date: "03/09/2025" },
  { code: "J45", label: "Asthme", description: "Maladie inflammatoire chronique des voies respiratoires.", category: "Respiratoires", status: "Chronique", date: "21/08/2025" },
  { code: "K21", label: "Reflux gastro-œsophagien", description: "Remontée du contenu gastrique dans l’œsophage.", category: "Digestives", status: "Active", date: "12/08/2025" },
  { code: "G43", label: "Migraine", description: "Céphalée récurrente souvent pulsatile et parfois accompagnée de nausées.", category: "Neurologiques", status: "Chronique", date: "26/07/2025" },
  { code: "G40", label: "Épilepsie", description: "Affection neurologique caractérisée par des crises récurrentes.", category: "Neurologiques", status: "Antécédent", date: "15/06/2025" },
  { code: "N39", label: "Infection urinaire", description: "Infection bactérienne affectant une partie des voies urinaires.", category: "Génito-urinaires", status: "Active", date: "04/06/2025" },
  { code: "S93", label: "Entorse de la cheville", description: "Lésion ligamentaire traumatique de l’articulation de la cheville.", category: "Traumatismes", status: "Antécédent", date: "19/05/2025" },
  { code: "L20", label: "Dermatite atopique", description: "Affection inflammatoire chronique de la peau avec démangeaisons.", category: "Peau et tissu sous-cutané", status: "Chronique", date: "08/04/2025" },
  { code: "L30", label: "Eczéma", description: "Inflammation cutanée provoquant rougeurs, sécheresse et prurit.", category: "Peau et tissu sous-cutané", status: "Active", date: "27/03/2025" },
  { code: "F41", label: "Trouble anxieux", description: "Anxiété excessive et persistante affectant le fonctionnement quotidien.", category: "Santé mentale", status: "Chronique", date: "14/02/2025" },
  { code: "F32", label: "Épisode dépressif", description: "Trouble de l’humeur associant tristesse durable et perte d’intérêt.", category: "Santé mentale", status: "Antécédent", date: "07/01/2025" },
  { code: "C50", label: "Tumeur maligne du sein", description: "Tumeur maligne développée aux dépens du tissu mammaire.", category: "Néoplasmes", status: "Antécédent", date: "12/12/2024" },
  { code: "E03", label: "Hypothyroïdie", description: "Production insuffisante d’hormones par la glande thyroïde.", category: "Endocriniennes", status: "Chronique", date: "29/11/2024" },
];

const PAGE_SIZE = 7;

const CATEGORIES = [
  { label: "Infectieuses", count: 152, icon: "bug-outline" as const, color: "#0ca86b", soft: "#eaf9f1" },
  { label: "Néoplasmes", count: 98, icon: "medical-outline" as const, color: "#7c3aed", soft: "#f3edff" },
  { label: "Endocriniennes", count: 62, icon: "flame-outline" as const, color: "#f97316", soft: "#fff3e9" },
  { label: "Cardiovasculaires", count: 112, icon: "heart-outline" as const, color: "#f43f5e", soft: "#fff0f2" },
  { label: "Respiratoires", count: 89, icon: "fitness-outline" as const, color: "#1769ff", soft: "#edf4ff" },
  { label: "Digestives", count: 76, icon: "leaf-outline" as const, color: "#10a76f", soft: "#ebfaf3" },
  { label: "Neurologiques", count: 54, icon: "pulse-outline" as const, color: "#7c3aed", soft: "#f4efff" },
  { label: "Génito-urinaires", count: 67, icon: "body-outline" as const, color: "#0891b2", soft: "#eaf9fc" },
  { label: "Traumatismes", count: 45, icon: "bandage-outline" as const, color: "#d99a26", soft: "#fff7e9" },
  { label: "Peau et tissu sous-cutané", count: 33, icon: "water-outline" as const, color: "#db2777", soft: "#fff0f7" },
  { label: "Santé mentale", count: 28, icon: "bulb-outline" as const, color: "#1677ff", soft: "#edf5ff" },
];

function statusColors(status: DiseaseStatus) {
  if (status === "Active") return { text: "#14843e", border: "#bde8cb", background: "#eefaf2" };
  if (status === "Chronique") return { text: "#f06a00", border: "#ffd5ad", background: "#fff7ee" };
  return { text: "#0864e8", border: "#bdd8ff", background: "#f1f7ff" };
}

export default function MaladiesTab({
  theme,
  initialDiagnosisCodes,
  onChangeDiagnosisCodes,
  readOnly,
}: {
  theme: any;
  initialDiagnosisCodes: string[];
  onChangeDiagnosisCodes?: (codes: string[]) => void;
  readOnly?: boolean;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 920;
  const styles = createStyles(theme, compact);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>(initialDiagnosisCodes || []);

  useEffect(() => setSelected(initialDiagnosisCodes || []), [initialDiagnosisCodes]);
  useEffect(() => onChangeDiagnosisCodes?.(selected), [onChangeDiagnosisCodes, selected]);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");
    return ICD_CATALOG.filter((item) => {
      const matchesQuery = !q || item.code.toLowerCase().includes(q) || item.label.toLocaleLowerCase("fr").includes(q);
      return matchesQuery && (!category || item.category === category);
    });
  }, [category, query]);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageRows = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [category, query]);

  const toggle = (code: string) => {
    if (readOnly) return;
    setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  };

  const addFromSearch = () => {
    if (readOnly) return;
    const match = results[0];
    if (match) setSelected((current) => current.includes(match.code) ? current : [...current, match.code]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.layout}>
        <View style={styles.filtersCard}>
          <Text style={styles.filterTitle}>Rechercher une maladie (ICD)</Text>
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tapez un code ICD ou un nom..."
              placeholderTextColor={theme.colors.muted}
              style={styles.searchInput}
              editable={!readOnly}
            />
            <Ionicons name="search-outline" size={19} color="#60759a" />
          </View>

          <Text style={styles.categoriesTitle}>Catégories ICD</Text>
          <View style={styles.categoryList}>
            {CATEGORIES.map((item) => {
              const active = category === item.label;
              return (
                <TouchableOpacity key={item.label} onPress={() => setCategory(active ? null : item.label)} style={[styles.categoryRow, active && styles.categoryRowActive]}>
                  <View style={[styles.categoryIcon, { backgroundColor: item.soft }]}>
                    <Ionicons name={item.icon} size={19} color={item.color} />
                  </View>
                  <Text numberOfLines={1} style={styles.categoryLabel}>{item.label}</Text>
                  <View style={styles.categoryCount}><Text style={styles.categoryCountText}>{item.count}</Text></View>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setCategory(null)} style={styles.allCategories}>
            <Text style={styles.allCategoriesText}>VOIR TOUTES LES CATÉGORIES</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeading}>
            <View>
              <Text style={styles.listTitle}>Liste des maladies</Text>
              <Text style={styles.listCount}>{results.length} maladie{results.length === 1 ? "" : "s"}</Text>
            </View>
            {!readOnly && (
              <TouchableOpacity onPress={addFromSearch} style={styles.addButton}>
                <Ionicons name="add" size={20} color={theme.colors.primary} />
                <Text style={styles.addButtonText}>AJOUTER UNE MALADIE</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.headerText, styles.codeCell]}>Code ICD  ↕</Text>
                <Text style={[styles.headerText, styles.diseaseCell]}>Maladie  ↕</Text>
                <Text style={[styles.headerText, styles.statusCell]}>Statut</Text>
                <Text style={[styles.headerText, styles.dateCell]}>Date d’ajout  ↕</Text>
                <Text style={[styles.headerText, styles.selectionCell]}>Sélection</Text>
                <Text style={[styles.headerText, styles.actionsCell]}>Actions</Text>
              </View>
              {pageRows.map((item) => {
                const checked = selected.includes(item.code);
                const colors = statusColors(item.status);
                return (
                  <View key={item.code} style={styles.tableRow}>
                    <View style={styles.codeCell}><View style={styles.codeBadge}><Text style={styles.codeText}>{item.code}</Text></View></View>
                    <View style={styles.diseaseCell}>
                      <Text style={styles.diseaseName}>{item.label}</Text>
                      <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
                    </View>
                    <View style={styles.statusCell}><View style={[styles.statusBadge, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text></View></View>
                    <Text style={[styles.dateText, styles.dateCell]}>{item.date}</Text>
                    <TouchableOpacity onPress={() => toggle(item.code)} disabled={readOnly} style={styles.selectionCell} accessibilityRole="checkbox" accessibilityState={{ checked }}>
                      <View style={[styles.radio, checked && styles.radioSelected]}>{checked && <View style={styles.radioDot} />}</View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggle(item.code)} disabled={readOnly} style={styles.actionsCell} accessibilityLabel={checked ? `Retirer ${item.label}` : `Sélectionner ${item.label}`}>
                      <Ionicons name="ellipsis-vertical" size={19} color="#06204d" />
                    </TouchableOpacity>
                  </View>
                );
              })}
              {results.length === 0 && <View style={styles.empty}><Ionicons name="search-outline" size={25} color={theme.colors.muted} /><Text style={styles.emptyText}>Aucune maladie trouvée</Text></View>}
            </View>
          </ScrollView>

          <View style={styles.pagination}>
            <Text style={styles.paginationLabel}>{results.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, results.length)} sur ${results.length}` : "0 résultat"}</Text>
            <TouchableOpacity onPress={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} style={[styles.pageArrow, page === 1 && styles.pageArrowDisabled]}><Ionicons name="chevron-back" size={17} color="#637695" /></TouchableOpacity>
            <View style={styles.currentPage}><Text style={styles.currentPageText}>{page}</Text></View>
            <TouchableOpacity onPress={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} style={[styles.pageArrow, page === pageCount && styles.pageArrowDisabled]}><Ionicons name="chevron-forward" size={17} color="#637695" /></TouchableOpacity>
          </View>
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
  table: { minWidth: 870, flex: 1 },
  tableRow: { minHeight: 81, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#e4e9f0" },
  tableHeader: { minHeight: 50, backgroundColor: "#f7f9fc", borderBottomColor: "#dfe6ef" },
  headerText: { fontSize: 11, fontWeight: "700", color: "#071833" },
  codeCell: { width: 100 },
  diseaseCell: { flex: 1, minWidth: 310, paddingRight: 18 },
  statusCell: { width: 130 },
  dateCell: { width: 140 },
  selectionCell: { width: 105, minHeight: 44, alignItems: "center", justifyContent: "center" },
  actionsCell: { width: 62, minHeight: 44, alignItems: "center", justifyContent: "center" },
  codeBadge: { alignSelf: "flex-start", minWidth: 44, height: 29, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#d8e1ed", borderRadius: 7, backgroundColor: "#fff" },
  codeText: { fontSize: 12, fontWeight: "700", color: "#0b1e3c" },
  diseaseName: { fontSize: 12, lineHeight: 18, fontWeight: "700", color: "#071833" },
  description: { marginTop: 3, fontSize: 11, lineHeight: 17, color: "#324d74" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderRadius: 7 },
  statusText: { fontSize: 11, fontWeight: "700" },
  dateText: { fontSize: 11, fontWeight: "600", color: "#091a36" },
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
