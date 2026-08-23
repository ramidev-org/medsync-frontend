import { PageShell } from "@/components/layout/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ConsultationListRow = {
  consultation_id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string | null;
  status: string;
  speciality_key: string | null;
  opened_at: string;
  closed_at: string | null;
  scheduled_at: string;
  patient_first_name: string;
  patient_last_name: string;
  doctor_name: string | null;
};

type RpcGetConsultationsResponse = {
  consultations: ConsultationListRow[];
  total: number;
  page: number;
  itemsPerPage: number;
};

export default function ConsultationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const tableStyles = createTableStyles(theme);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [searchInput, setSearchInput] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "cancelled">("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<ConsultationListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const itemsPerPage = 10;

  const fetchConsultations = useCallback(
    async (isRefresh = false, pageOverride?: number) => {
      if (!user?.id) return;

      try {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        const page = pageOverride ?? currentPage;

        const data = await callRpc<RpcGetConsultationsResponse, Record<string, unknown>>("rpc_get_consultations", {
          p_requester_id: user.id,
          p_search: globalSearch.trim() ? globalSearch.trim() : null,
          p_status: statusFilter === "all" ? null : statusFilter,
          p_page: page,
          p_items_per_page: itemsPerPage,
        });

        setRows(data?.consultations ?? []);
        setTotal(typeof data?.total === "number" ? data.total : 0);
      } catch (e: any) {
        // Helpful message if DB migration not applied yet
        const msg = String(e?.message || "");
        if (msg.toLowerCase().includes("was not found") || msg.includes("404")) {
          Alert.alert(
            "DB migration manquante",
            "La RPC rpc_get_consultations n'est pas deployee. Applique database/sql/2026_04_29_full_upgrade.sql dans Supabase.",
          );
        } else {
          Alert.alert("Erreur", e?.message || "Impossible de charger les consultations");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id, currentPage, globalSearch, statusFilter],
  );

  useEffect(() => {
    if (!user?.id) return;
    setCurrentPage(1);
    fetchConsultations(false, 1);
  }, [user?.id, globalSearch, statusFilter, fetchConsultations]);

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + rows.length;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchConsultations(false, page);
  };

  const statusLabel = (s: string) => {
    if (s === "open") return "Ouverte";
    if (s === "closed") return "Clôturée";
    if (s === "cancelled") return "Annulee";
    return s;
  };

  const fmt = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <PageShell
      title="Consultations"
      subtitle="Historique des consultations - style analyses medicales"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchConsultations(true, 1)} />}
      actions={
        <View style={styles.filtersRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Patient, médecin, ID..."
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.searchInput}
              onSubmitEditing={() => setGlobalSearch(searchInput)}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => setGlobalSearch(searchInput)}>
            <Text style={styles.searchBtnText}>Rechercher</Text>
          </TouchableOpacity>
        </View>
      }
    >

        <View style={styles.statusRow}>
          {(["all", "open", "closed", "cancelled"] as const).map((k) => {
            const active = statusFilter === k;
            const label =
              k === "all"
                ? "Toutes"
                : k === "open"
                  ? "Ouvertes"
                  : k === "closed"
                    ? "Clôturées"
                    : "Annulees";
            return (
              <TouchableOpacity
                key={k}
                onPress={() => setStatusFilter(k)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ color: active ? "#fff" : theme.colors.text, fontWeight: "700" }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[tableStyles.tableHeader, styles.tableHeaderWorkspace]}>
          <Text style={[tableStyles.headerCell, { flex: 2 }]}>Patient</Text>
          <Text style={[tableStyles.headerCell, { flex: 1.5 }]}>Médecin</Text>
          <Text style={[tableStyles.headerCell, { flex: 1.5 }]}>Date</Text>
          <Text style={[tableStyles.headerCell, { flex: 1 }]}>Statut</Text>
          <Text style={[tableStyles.headerCell, { width: 110, textAlign: "right" }]}>Action</Text>
        </View>

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        )}

        {rows.map((r) => (
          <View key={r.consultation_id} style={[tableStyles.tableRow, styles.tableRowWorkspace]}>
            <Text style={[tableStyles.cell, { flex: 2, fontWeight: "700" }]}>
              {r.patient_first_name} {r.patient_last_name}
            </Text>
            <Text style={[tableStyles.cell, { flex: 1.5 }]}>{r.doctor_name || "—"}</Text>
            <Text style={[tableStyles.cell, { flex: 1.5 }]}>{fmt(r.opened_at || r.scheduled_at)}</Text>
            <Text style={[tableStyles.cell, { flex: 1 }]}>{statusLabel(String(r.status || ""))}</Text>

            <View style={{ width: 110, alignItems: "flex-end" }}>
              <TouchableOpacity
                style={[styles.openBtn, !r.appointment_id && styles.openBtnDisabled]}
                disabled={!r.appointment_id}
                onPress={() => {
                  if (!r.appointment_id) return;
                  router.push(`/consultation?id=${r.appointment_id}`);
                }}
              >
                <Ionicons name="open-outline" size={16} color="#fff" />
                <Text style={styles.openBtnText}>
                  {r.appointment_id ? "Ouvrir" : "Sans RDV"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.paginationRow}>
          <Text style={styles.paginationText}>
            {total === 0 ? "0" : `${startIndex + 1}-${endIndex}`} sur {total}
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 1 && { opacity: 0.5 }]}
              onPress={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
              <Text style={styles.pageBtnText}>Préc.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === totalPages && { opacity: 0.5 }]}
              onPress={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.pageBtnText}>Suiv.</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    filtersRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: "#BFDBFE",
      backgroundColor: "#EFF6FF",
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      minWidth: 260,
    },
    searchInput: { flex: 1, fontWeight: "600", color: theme.colors.text },
    searchBtn: {
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: "#2563EB",
      alignItems: "center",
      justifyContent: "center",
    },
    searchBtnText: { color: "#fff", fontWeight: "700" },

    statusRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },

    openBtn: {
      backgroundColor: "#1D4ED8",
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    openBtnDisabled: {
      opacity: 0.45,
    },
    openBtnText: { color: "#fff", fontWeight: "700" },

    paginationRow: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    paginationText: { color: theme.colors.textSecondary, fontWeight: "600" },
    pageBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: "#BFDBFE",
      backgroundColor: "#EFF6FF",
      borderRadius: 12,
      paddingHorizontal: 10,
      height: 40,
    },
    pageBtnText: { fontWeight: "700", color: theme.colors.text },

    loadingRow: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#BFDBFE",
      backgroundColor: "#EFF6FF",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    loadingText: { fontWeight: "600", color: theme.colors.textSecondary },
    tableHeaderWorkspace: {
      marginTop: 12,
      backgroundColor: "#DBEAFE",
      borderColor: "#BFDBFE",
    },
    tableRowWorkspace: {
      backgroundColor: "#F8FAFC",
      borderColor: "#E2E8F0",
    },
  });

