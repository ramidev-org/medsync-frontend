// pages/PatientsPage.tsx
import DatePickerField from "@/components/datepicker";
import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { MOCK_PATIENTS } from "@/data/patients_data";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PatientsPage() {
  const { theme } = useTheme();
  const tableStyles = createTableStyles(theme);

  const [fromDate, setFromDate] = useState(new Date("2024-01-01"));
  const [toDate, setToDate] = useState(new Date("2024-12-31"));
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ================= FILTER LOGIC ================= */
  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS.filter((p) => {
      // date filter
      const patientDate = new Date(p.createdAt);
      if (patientDate < fromDate || patientDate > toDate) return false;

      // global name/code/phone search
      const nameMatch =
        p.nom.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.prenom.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.telephone.includes(globalSearch);

      return nameMatch;
    });
  }, [fromDate, toDate, globalSearch]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const styles = createStyles(theme);

  /* ================= UI ================= */
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TopBar theme={theme} />

      {/* ===== STICKY HEADER ===== */}
      <View style={styles.stickyHeader}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Gestion des Patients</Text>
          <Text style={styles.subtitle}>
            {filteredPatients.length} patient{filteredPatients.length > 1 ? "s" : ""} trouvé
            {filteredPatients.length > 1 ? "s" : ""}
          </Text>
        </View>

        {/* Filters Row */}
        <View style={styles.filterSection}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              placeholder="Rechercher par nom, prénom, code ou téléphone..."
              placeholderTextColor={theme.colors.textSecondary}
              value={globalSearch}
              onChangeText={setGlobalSearch}
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
            {globalSearch !== "" && (
              <TouchableOpacity onPress={() => setGlobalSearch("")}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Pickers */}
          <DatePickerField label="Date de début" date={fromDate} setDate={setFromDate} />
          <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>à</Text>
          <DatePickerField label="Date de fin" date={toDate} setDate={setToDate}  />

          {/* Reset Filters */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setGlobalSearch("");
              setFromDate(new Date("2024-01-01"));
              setToDate(new Date("2024-12-31"));
              setCurrentPage(1);
            }}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== TABLE ===== */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={tableStyles.tableCard}>
          {/* Table Header */}
          <View style={tableStyles.tableHeader}>
            {[
              { key: "avatar", label: "Photo" },
              { key: "code", label: "Code" },
              { key: "nom", label: "Nom" },
              { key: "prenom", label: "Prénom" },
              { key: "age", label: "Âge" },
              { key: "sexe", label: "Sexe" },
              { key: "situation", label: "Situation" },
              { key: "telephone", label: "Téléphone" },
              { key: "adresse", label: "Adresse" },
              { key: "actions", label: "Actions" },
            ].map((col) => (
              <View key={col.key} style={tableStyles.headerCell}>
                <Text style={tableStyles.headerText}>{col.label}</Text>
              </View>
            ))}
          </View>

          {/* Table Rows */}
          {currentPatients.length === 0 ? (
            <View style={tableStyles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={tableStyles.emptyText}>Aucun patient trouvé</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                Essayez d'ajuster vos filtres
              </Text>
            </View>
          ) : (
            currentPatients.map((p, i) => (
              <View
                key={i}
                style={[
                  tableStyles.tableRow,
                  { backgroundColor: i % 2 === 0 ? theme.colors.background : "transparent" },
                ]}
              >
                <View style={tableStyles.cell}>
                  <Avatar firstName={p.prenom} lastName={p.nom} size={56} borderRadius={12} />
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>#{p.code}</Text>
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{p.nom}</Text>
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.text }}>{p.prenom}</Text>
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.text }}>{p.age} ans</Text>
                </View>
                <View style={tableStyles.cell}>
                  <View
                    style={{
                      backgroundColor: p.sexe === "Masculin" ? "#dbeafe" : "#fce7f3",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ color: p.sexe === "Masculin" ? "#1e40af" : "#9f1239", fontWeight: "600" }}>
                      {p.sexe}
                    </Text>
                  </View>
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.text }}>{p.situation}</Text>
                </View>
                <View style={tableStyles.cell}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="call-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={{ color: theme.colors.text }}>{p.telephone}</Text>
                  </View>
                </View>
                <View style={tableStyles.cell}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={{ color: theme.colors.text }}>{p.adresse}</Text>
                  </View>
                </View>
                <View style={tableStyles.cell}>
                  <TouchableOpacity style={{ padding: 4 }}>
                    <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ===== PAGINATION ===== */}
        {filteredPatients.length > 0 && (
          <View style={tableStyles.paginationContainer}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: "500" }}>
              Affichage {startIndex + 1} - {Math.min(endIndex, filteredPatients.length)} sur {filteredPatients.length}
            </Text>
            <View style={tableStyles.paginationButtons}>
              <TouchableOpacity
                style={{ ...tableStyles.paginationButton, opacity: currentPage === 1 ? 0.5 : 1 }}
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
              </TouchableOpacity>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={{
                      ...tableStyles.paginationButton,
                      backgroundColor: currentPage === pageNum ? theme.colors.primary : theme.colors.background,
                    }}
                    onPress={() => goToPage(pageNum)}
                  >
                    <Text style={{ color: currentPage === pageNum ? "#fff" : theme.colors.text, fontWeight: "600" }}>
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={{ ...tableStyles.paginationButton, opacity: currentPage === totalPages ? 0.5 : 1 }}
                onPress={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ================= LOCAL STYLES ================= */
const createStyles = (theme: any) =>
  StyleSheet.create({
    stickyHeader: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      zIndex: 10,
    },
    titleSection: { marginBottom: 16 },
    pageTitle: { fontSize: 28, fontWeight: "bold", color: theme.colors.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: theme.colors.textSecondary },
    filterSection: { flexDirection: "row", alignItems: "center", gap: 12 },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, padding: 0 },
    dateLabel: { fontSize: 14, fontWeight: "500" },
    resetButton: {
      padding: 12,
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    container: { padding: 24 },
  });
