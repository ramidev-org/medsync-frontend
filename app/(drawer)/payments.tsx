import DatePickerField from "@/components/datepicker";
import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { getPayments } from "@/services/payments.services";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PaymentsPage() {
  const { theme } = useTheme();

  const [fromDate, setFromDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1);
  });
  const [toDate, setToDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  });
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const data = await getPayments();
      setPayments(data);
      setLoading(false);
    };
    fetchPayments();
  }, []);

  /* ================= FILTER ================= */

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const paymentDate = new Date(p.createdAt);
      if (paymentDate < fromDate || paymentDate > toDate) return false;

      return (
        p.nom.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.prenom.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.method.toLowerCase().includes(globalSearch.toLowerCase())
      );
    });
  }, [payments, fromDate, toDate, globalSearch]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const styles = createStyles(theme);
  const tableStyles = createTableStyles(theme);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TopBar theme={theme} />

      {/* ===== STICKY HEADER ===== */}
      <View style={styles.stickyHeader}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Gestion des Paiements</Text>
          <Text style={styles.subtitle}>
            {filteredPayments.length} paiement
            {filteredPayments.length > 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.filterSection}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              placeholder="Nom, prénom, code, méthode..."
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
          <DatePickerField label="Du" date={fromDate} setDate={setFromDate} />
          <Text style={styles.dateLabel}>à</Text>
          <DatePickerField label="Au" date={toDate} setDate={setToDate}  />
        </View>
      </View>

      {/* ===== TABLE ===== */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={tableStyles.tableCard}>
          {/* Header */}
          <View style={tableStyles.tableHeader}>
            <View style={tableStyles.headerCell}><Ionicons name="image-outline" size={18} /></View>
            <View style={tableStyles.headerCell}><Text style={tableStyles.headerText}>Code</Text></View>
            <View style={tableStyles.headerCell}><Text style={tableStyles.headerText}>Nom</Text></View>
            <View style={tableStyles.headerCell}><Text style={tableStyles.headerText}>Prénom</Text></View>
            <View style={tableStyles.headerCell}><Text style={tableStyles.headerText}>Montant</Text></View>
            <View style={tableStyles.headerCell}><Text style={tableStyles.headerText}>Méthode</Text></View>
            <View style={tableStyles.headerCell}><Text style={tableStyles.headerText}>Statut</Text></View>
            <View style={tableStyles.headerCell}><Text style={tableStyles.headerText}>Date</Text></View>
            <View style={tableStyles.headerCell}><Text style={tableStyles.headerText}>Actions</Text></View>
          </View>

          {loading && (
            <View style={tableStyles.emptyState}>
              <Text style={tableStyles.emptyText}>Chargement…</Text>
            </View>
          )}

          {!loading && currentPayments.length === 0 && (
            <View style={tableStyles.emptyState}>
              <Text style={tableStyles.emptyText}>Aucun paiement trouvé</Text>
            </View>
          )}

          {currentPayments.map((p, i) => (
            <View
              key={i}
              style={[
                tableStyles.tableRow,
                i % 2 === 0 ? tableStyles.tableRowAlt : null,
              ]}
            >
              <View style={tableStyles.cell}>
                <Avatar firstName={p.prenom} lastName={p.nom} size={56} borderRadius={12} />
              </View>
              <View style={tableStyles.cell}>
                <Text style={[tableStyles.cellText, { fontWeight: "600", color: theme.colors.primary }]}>
                  #{p.code}
                </Text>
              </View>
              <View style={tableStyles.cell}>
                <Text style={[tableStyles.cellText, { fontWeight: "600" }]}>{p.nom}</Text>
              </View>
              <View style={tableStyles.cell}>
                <Text style={tableStyles.cellText}>{p.prenom}</Text>
              </View>
              <View style={tableStyles.cell}>
                <Text style={[tableStyles.cellText, { fontWeight: "600" }]}>{p.amount} DA</Text>
              </View>
              <View style={tableStyles.cell}>
                <Text style={tableStyles.cellText}>{p.method}</Text>
              </View>
              <View style={tableStyles.cell}>
                {(() => {
                  const raw = String(p.status ?? "");
                  const low = raw.toLowerCase();
                  const isPaid = low === "paid" || low.includes("pay");

                  return (
                    <View
                      style={[
                        tableStyles.badge,
                        { backgroundColor: isPaid ? "#dcfce7" : "#fee2e2" },
                      ]}
                    >
                      <Text
                        style={{
                          color: isPaid ? "#166534" : "#991b1b",
                          fontWeight: "600",
                        }}
                      >
                        {raw}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              <View style={tableStyles.cell}>
                <Text style={tableStyles.cellText}>{formatDateTime(p.createdAt)}</Text>
              </View>
              <View style={tableStyles.cell}>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-vertical" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* ===== PAGINATION ===== */}
          {totalPages > 1 && (
            <View style={tableStyles.paginationContainer}>
              <View style={tableStyles.paginationButtons}>
                <TouchableOpacity
                  style={tableStyles.paginationButton}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <Text style={tableStyles.paginationText}>{"<"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tableStyles.paginationButton}
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  <Text style={tableStyles.paginationText}>{">"}</Text>
                </TouchableOpacity>
              </View>
              <Text style={tableStyles.paginationText}>
                Page {currentPage} / {totalPages}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const createStyles = (theme: any) =>
  StyleSheet.create({
    stickyHeader: {
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    titleSection: { marginBottom: 16 },
    pageTitle: { fontSize: 28, fontWeight: "bold", color: theme.colors.text },
    subtitle: { color: theme.colors.textSecondary },
    filterSection: { flexDirection: "row", gap: 12 },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      gap: 8,
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
      borderColor: theme.colors.border,
    },
    searchInput: { flex: 1 },
    dateLabel: { alignSelf: "center" },
    container: { padding: 24 },
  });
