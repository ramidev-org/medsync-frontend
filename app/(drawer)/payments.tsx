import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { MOCK_PAYMENTS } from "@/data/payments_data";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import "react-day-picker/style.css";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function PaymentsPage() {
  const { theme } = useTheme();

  const [fromDate, setFromDate] = useState<Date>(new Date("2024-01-01"));
  const [toDate, setToDate] = useState<Date>(new Date("2024-12-31"));
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const itemsPerPage = 10;

  /* ================= FILTER ================= */

  const filteredPayments = useMemo(() => {
    return MOCK_PAYMENTS.filter((p) => {
      const paymentDate = new Date(p.createdAt);
      if (paymentDate < fromDate || paymentDate > toDate) return false;

      return (
        p.nom.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.prenom.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.method.toLowerCase().includes(globalSearch.toLowerCase())
      );
    });
  }, [fromDate, toDate, globalSearch]);

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

          {/* Dates */}
          <TouchableOpacity
            style={styles.dateInputWrapper}
            onPress={() => setShowFromPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} />
            <Text style={styles.dateText}>{fromDate.toLocaleDateString("fr-FR")}</Text>
          </TouchableOpacity>

          <Text style={styles.dateLabel}>à</Text>

          <TouchableOpacity
            style={styles.dateInputWrapper}
            onPress={() => setShowToPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} />
            <Text style={styles.dateText}>{toDate.toLocaleDateString("fr-FR")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== TABLE ===== */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tableCard}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.headerCell}><Ionicons name="image-outline" size={18} /></View>
            <View style={styles.headerCell}><Text style={styles.headerText}>Code</Text></View>
            <View style={styles.headerCell}><Text style={styles.headerText}>Nom</Text></View>
            <View style={styles.headerCell}><Text style={styles.headerText}>Prénom</Text></View>
            <View style={styles.headerCell}><Text style={styles.headerText}>Montant</Text></View>
            <View style={styles.headerCell}><Text style={styles.headerText}>Méthode</Text></View>
            <View style={styles.headerCell}><Text style={styles.headerText}>Statut</Text></View>
            <View style={styles.headerCell}><Text style={styles.headerText}>Date</Text></View>
            <View style={styles.headerCell}><Text style={styles.headerText}>Actions</Text></View>
          </View>

          {currentPayments.map((p, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                { backgroundColor: i % 2 === 0 ? theme.colors.background : "transparent" },
              ]}
            >
              {/* Avatar */}
              <View style={styles.cell}>
                <Avatar
                  firstName={p.prenom}
                  lastName={p.nom}
                  size={56}
                  borderRadius={12}
                />
              </View>

              <View style={styles.cell}>
                <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>
                  #{p.code}
                </Text>
              </View>

              <View style={styles.cell}>
                <Text style={{ fontWeight: "600" }}>{p.nom}</Text>
              </View>

              <View style={styles.cell}>
                <Text>{p.prenom}</Text>
              </View>

              <View style={styles.cell}>
                <Text style={{ fontWeight: "600" }}>{p.amount} DA</Text>
              </View>

              <View style={styles.cell}>
                <Text>{p.method}</Text>
              </View>

              <View style={styles.cell}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: p.status === "Payé" ? "#dcfce7" : "#fee2e2" },
                  ]}
                >
                  <Text
                    style={{
                      color: p.status === "Payé" ? "#166534" : "#991b1b",
                      fontWeight: "600",
                    }}
                  >
                    {p.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cell}>
                <Text>{formatDateTime(p.createdAt)}</Text>
              </View>

              <View style={styles.cell}>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-vertical" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
    dateInputWrapper: {
      flexDirection: "row",
      gap: 6,
      borderWidth: 1,
      padding: 10,
      borderRadius: 10,
    },
    dateText: { fontWeight: "500" },
    dateLabel: { alignSelf: "center" },
    container: { padding: 24 },
    tableCard: {
      borderWidth: 1,
      borderRadius: 12,
      overflow: "hidden",
      borderColor: theme.colors.border,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: theme.colors.background,
      paddingVertical: 12,
    },
    headerCell: { flex: 1, paddingHorizontal: 12 },
    headerText: { fontWeight: "700", fontSize: 12 },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    cell: { flex: 1, paddingHorizontal: 12 },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
  });
