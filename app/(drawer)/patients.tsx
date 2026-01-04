import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { MOCK_PATIENTS } from "@/data/patients_data";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

/* ================= CUSTOM CSS FOR DATE PICKER ================= */
const datePickerStyles = `
  .rdp {
    --rdp-accent-color: #3b82f6;
    --rdp-background-color: #e0f2fe;
    margin: 0;
  }
  .rdp-months {
    justify-content: center;
  }
  .rdp-month {
    width: 100%;
  }
  .rdp-caption {
    display: flex;
    justify-content: center;
    padding: 12px 0;
    font-weight: 600;
    font-size: 16px;
  }
  .rdp-nav {
    position: absolute;
    top: 12px;
    display: flex;
    gap: 8px;
  }
  .rdp-nav_button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rdp-nav_button:hover {
    background: #f3f4f6;
  }
  .rdp-button_previous {
    left: 0;
  }
  .rdp-button_next {
    right: 0;
  }
  .rdp-head_cell {
    font-weight: 600;
    font-size: 14px;
    color: #6b7280;
    padding: 8px 0;
  }
  .rdp-cell {
    padding: 2px;
  }
  .rdp-day {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
    background-color: #f3f4f6;
  }
  .rdp-day_selected {
    background-color: #3b82f6 !important;
    color: white !important;
    font-weight: 600;
  }
  .rdp-day_today:not(.rdp-day_selected) {
    font-weight: 700;
    color: #3b82f6;
    background-color: #eff6ff;
  }
  .rdp-day_disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .rdp-day_outside {
    opacity: 0.5;
  }
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = datePickerStyles;
  document.head.appendChild(styleElement);
}

/* ================= PAGE ================= */

export default function PatientsPage() {
  const { theme } = useTheme();

  const [fromDate, setFromDate] = useState<Date>(new Date("2024-01-01"));
  const [toDate, setToDate] = useState<Date>(new Date("2024-12-31"));
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const itemsPerPage = 10;

  /* ================= FILTER LOGIC ================= */

  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS.filter((p) => {
      // date filter
      const patientDate = new Date(p.createdAt);
      if (patientDate < fromDate || patientDate > toDate) return false;

      // global name search
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
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const styles = createStyles(theme);

  /* ================= UI ================= */

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TopBar theme={theme} />

      {/* ===== STICKY HEADER ===== */}
      <View style={styles.stickyHeader}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Gestion des Patients</Text>
          <Text style={styles.subtitle}>
            {filteredPatients.length} patient{filteredPatients.length > 1 ? "s" : ""} trouvé{filteredPatients.length > 1 ? "s" : ""}
          </Text>
        </View>

        {/* Filter Section - All in one row */}
        <View style={styles.filterSection}>
          {/* Search Bar */}
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

          {/* Date Filters in same row */}
          <TouchableOpacity 
            style={styles.dateInputWrapper}
            onPress={() => setShowFromPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {formatDate(fromDate)}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>à</Text>

          <TouchableOpacity 
            style={styles.dateInputWrapper}
            onPress={() => setShowToPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={[styles.dateText, { color: theme.colors.text }]}>
              {formatDate(toDate)}
            </Text>
          </TouchableOpacity>

          {/* Reset Filters Button */}
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

      {/* Date Picker Modals */}
      <Modal
        visible={showFromPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFromPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFromPicker(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={[styles.datePickerTitle, { color: theme.colors.text }]}>
                  Date de début
                </Text>
                <TouchableOpacity onPress={() => setShowFromPicker(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <DayPicker
                mode="single"
                selected={fromDate}
                onSelect={(date) => {
                  if (date) {
                    setFromDate(date);
                    setShowFromPicker(false);
                  }
                }}
                defaultMonth={fromDate}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showToPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowToPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowToPicker(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={[styles.datePickerTitle, { color: theme.colors.text }]}>
                  Date de fin
                </Text>
                <TouchableOpacity onPress={() => setShowToPicker(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <DayPicker
                mode="single"
                selected={toDate}
                onSelect={(date) => {
                  if (date) {
                    setToDate(date);
                    setShowToPicker(false);
                  }
                }}
                defaultMonth={toDate}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== TABLE CARD ===== */}
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.headerCell}>
              <Ionicons name="image-outline" size={18} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Code</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Nom</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Prénom</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Âge</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Sexe</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Situation</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Téléphone</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Adresse</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerText}>Actions</Text>
            </View>
          </View>

          {/* Table Rows */}
          {currentPatients.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Aucun patient trouvé
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                Essayez d'ajuster vos filtres de recherche
              </Text>
            </View>
          ) : (
            currentPatients.map((p, i) => (
              <View 
                key={i} 
                style={[
                  styles.tableRow,
                  { backgroundColor: i % 2 === 0 ? theme.colors.background : "transparent" }
                ]}
              >
                <View style={styles.cell}>
                  <Avatar 
                    firstName={p.prenom} 
                    lastName={p.nom} 
                    size={56}
                    borderRadius={12}
                  />
                </View>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: theme.colors.primary, fontWeight: "600" }]}>
                    #{p.code}
                  </Text>
                </View>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: theme.colors.text, fontWeight: "600" }]}>
                    {p.nom}
                  </Text>
                </View>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: theme.colors.text }]}>
                    {p.prenom}
                  </Text>
                </View>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: theme.colors.text }]}>
                    {p.age} ans
                  </Text>
                </View>
                <View style={styles.cell}>
                  <View style={[styles.badge, { backgroundColor: p.sexe === "Masculin" ? "#dbeafe" : "#fce7f3" }]}>
                    <Text style={[styles.badgeText, { color: p.sexe === "Masculin" ? "#1e40af" : "#9f1239" }]}>
                      {p.sexe}
                    </Text>
                  </View>
                </View>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: theme.colors.text }]}>
                    {p.situation}
                  </Text>
                </View>
                <View style={styles.cell}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="call-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.cellText, { color: theme.colors.text }]}>
                      {p.telephone}
                    </Text>
                  </View>
                </View>
                <View style={styles.cell}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.cellText, { color: theme.colors.text }]}>
                      {p.adresse}
                    </Text>
                  </View>
                </View>
                <View style={styles.cell}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ===== PAGINATION ===== */}
        {filteredPatients.length > 0 && (
          <View style={styles.paginationContainer}>
            <Text style={[styles.paginationInfo, { color: theme.colors.textSecondary }]}>
              Affichage {startIndex + 1} - {Math.min(endIndex, filteredPatients.length)} sur {filteredPatients.length}
            </Text>
            
            <View style={styles.paginationButtons}>
              <TouchableOpacity
                style={[styles.paginationButton, { 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  opacity: currentPage === 1 ? 0.5 : 1 
                }]}
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
              </TouchableOpacity>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={[
                      styles.paginationButton,
                      {
                        backgroundColor: currentPage === pageNum ? theme.colors.primary : theme.colors.background,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => goToPage(pageNum)}
                  >
                    <Text style={[
                      styles.paginationText,
                      { color: currentPage === pageNum ? "#fff" : theme.colors.text }
                    ]}>
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.paginationButton, { 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  opacity: currentPage === totalPages ? 0.5 : 1 
                }]}
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

/* ================= STYLES ================= */

const createStyles = (theme: any) => StyleSheet.create({
  stickyHeader: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 10,
  },
  titleSection: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 150,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  resetButton: {
    padding: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 24,
    minWidth: 350,
    maxWidth: 450,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  container: {
    padding: 24,
  },
  tableCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
    paddingVertical: 12,
  },
  headerCell: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 16,
  },
  paginationInfo: {
    fontSize: 14,
    fontWeight: "500",
  },
  paginationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  paginationButton: {
    minWidth: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "600",
  },
});