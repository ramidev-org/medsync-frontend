import { DateRangePickerField } from "@/components/datepicker";
import { PageShell } from "@/components/page_shell";
import { Avatar } from "@/components/patient_avatar";
import { getPayments } from "@/services/payments.services";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PaymentsPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const tableStyles = createTableStyles(theme);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0));
  const [toDate, setToDate] = useState(new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999));
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const resetDateRange = useCallback(() => {
    setFromDate(new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0));
    setToDate(new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999));
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setPayments(await getPayments());
      setLoading(false);
    };
    run();
  }, []);

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const date = new Date(payment.createdAt);
        if (date < fromDate || date > toDate) return false;
        const q = globalSearch.toLowerCase();
        return (
          payment.nom.toLowerCase().includes(q) ||
          payment.prenom.toLowerCase().includes(q) ||
          payment.code.toLowerCase().includes(q) ||
          payment.method.toLowerCase().includes(q)
        );
      }),
    [payments, fromDate, toDate, globalSearch],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const visibleRows = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <PageShell
      title="Gestion des Paiements"
      subtitle={`${filteredPayments.length} paiement${filteredPayments.length > 1 ? "s" : ""}`}
      actions={
        <View style={styles.filterSection}>
          <View style={styles.searchFieldWrap}>
            <View style={styles.fieldLabelSpacer} />
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="Nom, code, méthode..."
                placeholderTextColor={theme.colors.textSecondary}
                value={globalSearch}
                onChangeText={setGlobalSearch}
                style={styles.searchInput}
              />
              {globalSearch ? (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setGlobalSearch("")} hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <DateRangePickerField
            label="Plage de date"
            startDate={fromDate}
            endDate={toDate}
            setStartDate={setFromDate}
            setEndDate={setToDate}
            onClear={resetDateRange}
          />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={tableStyles.tableCard}>
          <View style={tableStyles.tableHeader}>
            {["Avatar", "Code", "Nom", "Prénom", "Montant", "Méthode", "Statut", "Date"].map((header) => (
              <View key={header} style={tableStyles.headerCell}><Text style={tableStyles.headerText}>{header}</Text></View>
            ))}
          </View>

          {loading ? (
            <View style={tableStyles.emptyState}><Text style={tableStyles.emptyText}>Chargement…</Text></View>
          ) : visibleRows.length === 0 ? (
            <View style={tableStyles.emptyState}><Text style={tableStyles.emptyText}>Aucun paiement</Text></View>
          ) : (
            visibleRows.map((payment, index) => (
              <View key={`${payment.code}-${index}`} style={[tableStyles.tableRow, index % 2 === 0 ? tableStyles.tableRowAlt : null]}>
                <View style={tableStyles.cell}><Avatar firstName={payment.prenom} lastName={payment.nom} size={44} borderRadius={11} /></View>
                <View style={tableStyles.cell}><Text style={[tableStyles.cellText, { color: theme.colors.primary, fontWeight: "800" }]}>#{payment.code}</Text></View>
                <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{payment.nom}</Text></View>
                <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{payment.prenom}</Text></View>
                <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{payment.amount} DA</Text></View>
                <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{payment.method}</Text></View>
                <View style={tableStyles.cell}>
                  <View style={[tableStyles.badge, { backgroundColor: String(payment.status).toLowerCase() === "paid" ? "#DCFCE7" : "#FEE2E2" }]}>
                    <Text style={{ fontWeight: "800", color: String(payment.status).toLowerCase() === "paid" ? "#166534" : "#991B1B" }}>{payment.status}</Text>
                  </View>
                </View>
                <View style={tableStyles.cell}>
                  <Text style={tableStyles.cellText}>
                    {new Date(payment.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={tableStyles.paginationContainer}>
          <View style={tableStyles.paginationButtons}>
            <TouchableOpacity style={tableStyles.paginationButton} onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
              <Text style={tableStyles.paginationText}>{"<"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tableStyles.paginationButton} onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
              <Text style={tableStyles.paginationText}>{">"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={tableStyles.paginationText}>Page {currentPage} / {totalPages}</Text>
        </View>
      </ScrollView>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    filterSection: { flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "flex-end" },
    searchFieldWrap: { width: 340 },
    fieldLabelSpacer: { height: 22 },
    searchContainer: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.colors.surface, minHeight: 42 },
    searchInput: { flex: 1, color: theme.colors.text, fontWeight: "700" },
    clearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    container: { ...(Platform.OS === "web" ? ({ width: "100%" } as any) : null) },
  });
