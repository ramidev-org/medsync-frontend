import { DataState } from "@/components/common/data_state";
import { DateRangePickerField } from "@/components/common/datepicker";
import { PageShell } from "@/components/layout/page_shell";
import { Avatar } from "@/components/common/patient_avatar";
import { useAuth } from "@/contexts/auth_context";
import { getPayments } from "@/services/payments.services";
import type { Payment } from "@/services/payments.services";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PaymentsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const tableStyles = createTableStyles(theme);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0));
  const [toDate, setToDate] = useState(new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999));
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;
  // loadPayments has two independent call sites (the mount effect below and
  // the manual "Actualiser" button) - a simple single cancelledRef isn't
  // enough because a stale request from one call site could still resolve
  // after a newer request from the other. A monotonic sequence number
  // (same pattern as consultations.tsx) lets each call detect if it's been
  // superseded before applying its result.
  const requestSeqRef = useRef(0);

  const resetDateRange = useCallback(() => {
    setFromDate(new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0));
    setToDate(new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999));
  }, []);

  const loadPayments = useCallback(async () => {
    const requestId = ++requestSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      if (!user?.id || !user.clinic_id) throw new Error("Your account is not connected to a clinic.");
      const rows = await getPayments({ requesterId: user.id, clinicId: user.clinic_id });
      if (requestSeqRef.current !== requestId) return;
      setPayments(rows);
    } catch (err) {
      if (requestSeqRef.current !== requestId) return;
      setPayments([]);
      setError(err instanceof Error ? err.message : "Impossible de charger les paiements");
    } finally {
      if (requestSeqRef.current === requestId) setLoading(false);
    }
  }, [user?.clinic_id, user?.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, globalSearch]);

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
          payment.method.toLowerCase().includes(q) ||
          getPaymentReason(payment).toLowerCase().includes(q)
        );
      }),
    [payments, fromDate, toDate, globalSearch],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRows = filteredPayments.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <PageShell
      title="Gestion des Paiements"
      subtitle={`${filteredPayments.length} paiement${filteredPayments.length > 1 ? "s" : ""}`}
      scrollable={false}
      actions={
        <View style={styles.filterSection}>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadPayments} disabled={loading}>
            <Ionicons name="refresh-outline" size={16} color={theme.colors.textOnPrimary} />
            <Text style={styles.refreshBtnText}>{loading ? "Chargement..." : "Actualiser"}</Text>
          </TouchableOpacity>
          <View style={styles.searchFieldWrap}>
            <View style={styles.fieldLabelSpacer} />
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="Nom, code, motif..."
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
      <View style={styles.pageContent}>
        <View style={[tableStyles.tableCard, styles.tableCard]}>
          <View style={tableStyles.tableHeader}>
            {["Avatar", "Code", "Nom", "Prenom", "Montant", "Motif", "Statut", "Date"].map((header) => (
              <View key={header} style={tableStyles.headerCell}>
                <Text style={tableStyles.headerText}>{header}</Text>
              </View>
            ))}
          </View>
          <ScrollView style={styles.tableScroller} contentContainerStyle={styles.tableScrollerContent}>
            <DataState
              loading={loading}
              error={error}
              onRetry={loadPayments}
              isEmpty={visibleRows.length === 0}
              emptyIcon="card-outline"
              emptyTitle="Aucun paiement"
              emptyBody="Les paiements correspondant a vos filtres apparaitront ici."
              loadingLabel="Chargement des paiements…"
            >
              {visibleRows.map((payment, index) => (
                <View key={`${payment.code}-${index}`} style={[tableStyles.tableRow, index % 2 === 0 ? tableStyles.tableRowAlt : null]}>
                  <View style={tableStyles.cell}>
                    <Avatar firstName={payment.prenom} lastName={payment.nom} size={48} borderRadius={12} />
                  </View>
                  <View style={tableStyles.cell}>
                    <Text style={[tableStyles.cellText, { color: theme.colors.primary, fontWeight: "600" }]}>#{payment.code}</Text>
                  </View>
                  <View style={tableStyles.cell}>
                    <Text style={tableStyles.cellText}>{payment.nom}</Text>
                  </View>
                  <View style={tableStyles.cell}>
                    <Text style={tableStyles.cellText}>{payment.prenom}</Text>
                  </View>
                  <View style={tableStyles.cell}>
                    <Text style={tableStyles.cellText}>{payment.amount} DA</Text>
                  </View>
                  <View style={tableStyles.cell}>
                    <Text style={tableStyles.cellText}>{getPaymentReason(payment)}</Text>
                  </View>
                  <View style={tableStyles.cell}>
                    <View style={[tableStyles.badge, styles.statusBadge, getStatusBadgeStyle(payment.status)]}>
                      <Text style={[styles.statusBadgeText, getStatusTextStyle(payment.status)]}>{payment.status}</Text>
                    </View>
                  </View>
                  <View style={tableStyles.cell}>
                    <Text style={tableStyles.cellText}>
                      {new Date(payment.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </Text>
                  </View>
                </View>
              ))}
            </DataState>
          </ScrollView>
        </View>

        <View style={tableStyles.paginationContainer}>
          <View style={styles.paginationRight}>
            <Text style={tableStyles.paginationText}>Page {safePage} / {totalPages}</Text>
            <View style={tableStyles.paginationButtons}>
              <TouchableOpacity style={tableStyles.paginationButton} onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
                <Text style={tableStyles.paginationText}>{"<"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tableStyles.paginationButton} onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
                <Text style={tableStyles.paginationText}>{">"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </PageShell>
  );
}

function getPaymentReason(payment: Payment) {
  const reference = String(payment.reference ?? "").trim();
  if (reference) {
    const lower = reference.toLowerCase();
    if (lower.includes("consult")) return "Consultation";
    if (lower.includes("lab")) return "Analyses medicales";
    if (lower.includes("diag")) return "Diagnostic";
    if (lower.includes("visit")) return "Visite de suivi";
    if (lower.includes("scan") || lower.includes("radio") || lower.includes("imag")) return "Imaging";
    if (!/^pay[-_ ]?\d+/i.test(reference)) return reference;
  }
  if (payment.visitId) return "Consultation";
  return "Paiement clinique";
}

function getStatusBadgeStyle(status: string) {
  const value = String(status).toLowerCase();

  if (value.includes("pay")) {
    return { backgroundColor: "#E8F6EE", borderColor: "#B7E4C7" };
  }

  if (value.includes("attente") || value.includes("partiel")) {
    return { backgroundColor: "#FFF4DE", borderColor: "#F3D19C" };
  }

  return { backgroundColor: "#FEEAEC", borderColor: "#F3C4CB" };
}

function getStatusTextStyle(status: string) {
  const value = String(status).toLowerCase();

  if (value.includes("pay")) {
    return { color: "#1E7A46" };
  }

  if (value.includes("attente") || value.includes("partiel")) {
    return { color: "#A15C00" };
  }

  return { color: "#B42318" };
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    filterSection: { flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "flex-end" },
    refreshBtn: {
      minHeight: 42,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    refreshBtnText: { color: theme.colors.textOnPrimary, fontWeight: "600" },
    searchFieldWrap: { width: 340 },
    fieldLabelSpacer: { height: 22 },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      minHeight: 42,
    },
    searchInput: { flex: 1, color: theme.colors.text, fontWeight: "700" },
    clearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
    statusBadgeText: { fontWeight: "600", fontSize: 12 },
    paginationRight: { flexDirection: "row", alignItems: "center", gap: 10, marginLeft: "auto" },
    pageContent: { flex: 1, minHeight: 0, ...(Platform.OS === "web" ? ({ width: "100%" } as any) : null) },
    tableCard: { flex: 1, minHeight: 0 },
    tableScroller: { flex: 1 },
    tableScrollerContent: { flexGrow: 1 },
  });
