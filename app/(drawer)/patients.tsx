// pages/PatientsPage.tsx
import DatePickerField from "@/components/datepicker";
import PatientFormWithMedical from "@/components/new_patient";
import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { useAuth } from "@/contexts/auth_context";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { db } from "@/database/database_conn";
import { useRouter } from "expo-router";




interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number;
  sex: 'male' | 'female';
  marital_status?: 'single' | 'married' | 'divorced';
  phone: string;
  email?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  insurance_provider?: string;
  created_at: string;
}

export default function PatientsPage() {

  const router = useRouter();
  const [menuVisibleFor, setMenuVisibleFor] = useState<string | null>(null);

  const { theme } = useTheme();
  const { user } = useAuth();
  const tableStyles = createTableStyles(theme);

  const [fromDate, setFromDate] = useState(new Date("2025-01-01"));
  const [toDate, setToDate] = useState(new Date("2027-12-31"));

  const [searchInput, setSearchInput] = useState("");   // typing only
  const [globalSearch, setGlobalSearch] = useState(""); // confirmed search

  const [currentPage, setCurrentPage] = useState(1);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const itemsPerPage = 10;

  /* ================= FETCH PATIENTS ================= */
  const fetchPatients = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      // Fetch patients created by this user
      const { data, error } = await db
        .from("patients")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPatients(data || []);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les patients");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  


  useEffect(() => {
    if (!user?.id) return;

    setCurrentPage(1);   // reset pagination on any filter change
    fetchPatients();
  }, [
    user?.id,
    fromDate,
    toDate,
    globalSearch,
    fetchPatients,
  ]);

  /* ================= FILTER LOGIC ================= */
  const filteredPatients = useMemo(() => {
    const filtered = patients.filter((p) => {
      // date filter
      const patientDate = new Date(p.created_at);
      if (patientDate < fromDate || patientDate > toDate) {
        return false;
      }

      // global name/phone/email search
      const searchLower = globalSearch.toLowerCase();
      const nameMatch =
        p.first_name.toLowerCase().includes(searchLower) ||
        p.last_name.toLowerCase().includes(searchLower) ||
        p.phone.includes(globalSearch) ||
        (p.email && p.email.toLowerCase().includes(searchLower));

      return nameMatch;
    });
    return filtered;
  }, [patients, fromDate, toDate, globalSearch]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  /* ================= HELPER FUNCTIONS ================= */
  const getSexLabel = (sex: 'male' | 'female') => {
    return sex === 'male' ? 'Masculin' : 'Féminin';
  };

  const getMaritalStatusLabel = (status?: 'single' | 'married' | 'divorced') => {
    if (!status) return '-';
    const labels = {
      single: 'Célibataire',
      married: 'Marié(e)',
      divorced: 'Divorcé(e)'
    };
    return labels[status];
  };

  const getFullAddress = (patient: Patient) => {
    const parts = [
      patient.address_street,
      patient.address_city,
      patient.address_state
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const styles = createStyles(theme);

  /* ================= UI ================= */
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <TopBar theme={theme} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.text, marginTop: 16, fontSize: 16 }}>
            Chargement des patients...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TopBar theme={theme} />

      {/* ===== STICKY HEADER ===== */}
      <View style={styles.stickyHeader}>
        {/* Title with Add Button */}
        <View style={styles.titleSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.pageTitle}>Gestion des Patients</Text>
              <Text style={styles.subtitle}>
                {filteredPatients.length} patient{filteredPatients.length > 1 ? "s" : ""} trouvé
                {filteredPatients.length > 1 ? "s" : ""}
              </Text>
            </View>

          </View>
        </View>

        {/* Filters Row */}
        <View style={styles.filterSection}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              placeholder="Rechercher par nom, prénom, téléphone ou email..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchInput}
              onChangeText={setSearchInput}
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
            {searchInput !== "" && (
              <TouchableOpacity onPress={() => setSearchInput("")}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}

          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              setGlobalSearch(searchInput.trim());
              setCurrentPage(1);
              fetchPatients();
            }}
          >
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>


          {/* Date Pickers */}
          <DatePickerField label="Date de début" date={fromDate} setDate={setFromDate} />
          <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>à</Text>
          <DatePickerField label="Date de fin" date={toDate} setDate={setToDate} />

          {/* Reset Filters */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSearchInput("");
              setGlobalSearch("");
              setFromDate(new Date("2025-01-01"));
              setToDate(new Date("2027-12-31"));
              setCurrentPage(1);
            }}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== TABLE ===== */}
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchPatients(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={tableStyles.tableCard}>
          {/* Table Header */}
          <View style={tableStyles.tableHeader}>
            {[
              { key: "avatar", label: "Photo" },
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
                {patients.length === 0 
                  ? "Commencez par ajouter votre premier patient"
                  : "Essayez d'ajuster vos filtres"}
              </Text>
            </View>
          ) : (
            currentPatients.map((p, i) => (
              <View
                key={p.id}
                style={[
                  tableStyles.tableRow,
                  { backgroundColor: i % 2 === 0 ? theme.colors.background : "transparent" },
                ]}
              >
                <View style={tableStyles.cell}>
                  <Avatar firstName={p.first_name} lastName={p.last_name} size={56} borderRadius={12} />
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.text, fontWeight: "600" }}>{p.last_name}</Text>
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.text }}>{p.first_name}</Text>
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.text }}>{p.age} ans</Text>
                </View>
                <View style={tableStyles.cell}>
                  <View
                    style={{
                      backgroundColor: p.sex === "male" ? "#dbeafe" : "#fce7f3",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ 
                      color: p.sex === "male" ? "#1e40af" : "#9f1239", 
                      fontWeight: "600",
                      fontSize: 12
                    }}>
                      {getSexLabel(p.sex)}
                    </Text>
                  </View>
                </View>
                <View style={tableStyles.cell}>
                  <Text style={{ color: theme.colors.text }}>{getMaritalStatusLabel(p.marital_status)}</Text>
                </View>
                <View style={tableStyles.cell}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="call-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={{ color: theme.colors.text }}>{p.phone}</Text>
                  </View>
                </View>
                <View style={tableStyles.cell}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={{ color: theme.colors.text, fontSize: 13 }}>
                      {getFullAddress(p)}
                    </Text>
                  </View>
                </View>
                <View style={tableStyles.cell}>
                  <View style={{ position: "relative" }}>
                    <TouchableOpacity
                      style={{ padding: 4 }}
                      onPress={() =>
                        setMenuVisibleFor(menuVisibleFor === p.id ? null : p.id)
                      }
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {menuVisibleFor === p.id && (
                      <View style={styles.menu}>
                        {/* Medical Document */}
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => {
                            setMenuVisibleFor(null);
                            router.push({
                              pathname: "/patient_medical_info",
                              params: { patientId: p.id },
                            });
                          }}>
                          <Ionicons name="document-text-outline" size={16} color={theme.colors.text} />
                          <Text style={styles.menuText}>Dossier médical</Text>
                        </TouchableOpacity>


                        {/* You can add more items later */}
                      </View>
                    )}
                  </View>

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

      {/* ===== ADD PATIENT FORM ===== */}
      <PatientFormWithMedical
        visible={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={() => fetchPatients(true)}
      />
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
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
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
    searchButton: {
      padding: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
    },

    dateLabel: { fontSize: 14, fontWeight: "500" },
    resetButton: {
      padding: 12,
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    container: { padding: 24 },

    menu: {
      position: "absolute",
      top: 28,
      right: 0,
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: 180,
      paddingVertical: 6,
      zIndex: 100,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },

    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    menuText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: "500",
    },

    

  });
