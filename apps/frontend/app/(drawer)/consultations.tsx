import { DataState } from "@/components/common/data_state";
import { PageShell } from "@/components/layout/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
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
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;
  // fetchConsultations is called from both the search/filter effect and
  // goToPage independently, so a plain per-effect `cancelled` flag isn't
  // enough - a request-sequence counter lets a slower earlier response
  // detect it's stale and skip applying its (now out-of-date) result,
  // instead of overwriting a faster, newer page/filter's rows.
  const requestSeqRef = useRef(0);

  const fetchConsultations = useCallback(
    async (isRefresh = false, pageOverride?: number) => {
      if (!user?.id) return;
      const seq = ++requestSeqRef.current;

      try {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const page = pageOverride ?? currentPage;

        const data = await callRpc<RpcGetConsultationsResponse, Record<string, unknown>>("rpc_get_consultations", {
          p_requester_id: user.id,
          p_search: globalSearch.trim() ? globalSearch.trim() : null,
          p_status: statusFilter === "all" ? null : statusFilter,
          p_page: page,
          p_items_per_page: itemsPerPage,
        });

        if (seq !== requestSeqRef.current) return;
        setRows(data?.consultations ?? []);
        setTotal(typeof data?.total === "number" ? data.total : 0);
      } catch (e: any) {
        if (seq !== requestSeqRef.current) return;
        const msg = String(e?.message || "");
        setRows([]);
        setTotal(0);
        setError(
          msg.toLowerCase().includes("was not found (404)")
            ? "The rpc_get_consultations function isn't deployed to the database yet."
            : msg || "Impossible de charger les consultations",
        );
      } finally {
        if (seq === requestSeqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
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

  const statusTone = (s: string) => {
    if (s === "closed") return { bg: theme.colors.successSoft, fg: theme.colors.success };
    if (s === "cancelled") return { bg: theme.colors.errorSoft, fg: theme.colors.error };
    return { bg: theme.colors.warningSoft, fg: theme.colors.warning };
  };

  const fmt = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const statusTabs: { key: "all" | "open" | "closed" | "cancelled"; label: string }[] = [
    { key: "all", label: "Toutes" },
    { key: "open", label: "Ouvertes" },
    { key: "closed", label: "Clôturées" },
    { key: "cancelled", label: "Annulees" },
  ];

  return (
    <PageShell scrollable={false}>
      <View style={styles.pageCard}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Consultations</Text>
            <View style={styles.pageSubtitleRow}>
              <Text style={styles.pageSubtitle}>
                {total} consultation{total > 1 ? "s" : ""}
              </Text>
              {isLoading && rows.length > 0 ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={styles.subtitleSpinner} />
              ) : null}
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
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
            <View style={styles.tabs}>
              {statusTabs.map(({ key, label }) => {
                const active = statusFilter === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setStatusFilter(key)}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.main}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchConsultations(true, 1)} />}
        >
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Patient</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Médecin</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Date</Text>
            <Text style={[styles.tableHeaderText, { width: 110 }]}>Statut</Text>
            <Text style={[styles.tableHeaderText, { width: 110, textAlign: "right" }]}>Action</Text>
          </View>

          <DataState
            loading={isLoading && rows.length === 0}
            error={error}
            onRetry={() => fetchConsultations(false, currentPage)}
            isEmpty={rows.length === 0}
            emptyIcon="document-text-outline"
            emptyTitle="No consultations found"
            emptyBody="Consultations you open or that match your filters will show up here."
            loadingLabel="Loading consultations…"
          >
            <View style={isLoading ? styles.rowsRefreshing : undefined}>
            {rows.map((r) => {
              const tone = statusTone(String(r.status || ""));
              return (
                <View key={r.consultation_id} style={styles.row}>
                  <View style={[styles.rowCell, { flex: 2 }]}>
                    <Text style={styles.rowName}>
                      {r.patient_first_name} {r.patient_last_name}
                    </Text>
                  </View>
                  <View style={[styles.rowCell, { flex: 1.5 }]}>
                    <Text style={styles.rowMeta}>{r.doctor_name || "—"}</Text>
                  </View>
                  <View style={[styles.rowCell, { flex: 1.5 }]}>
                    <Text style={styles.rowMeta}>{fmt(r.opened_at || r.scheduled_at)}</Text>
                  </View>
                  <View style={[styles.rowCell, { width: 110 }]}>
                    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.badgeText, { color: tone.fg }]}>{statusLabel(String(r.status || ""))}</Text>
                    </View>
                  </View>

                  <View style={{ width: 110, alignItems: "flex-end" }}>
                    <TouchableOpacity
                      style={[styles.openBtn, !r.appointment_id && styles.openBtnDisabled]}
                      disabled={!r.appointment_id}
                      onPress={() => {
                        if (!r.appointment_id) return;
                        router.push(`/consultation?id=${r.appointment_id}`);
                      }}
                    >
                      <Ionicons name="open-outline" size={14} color={theme.colors.textOnPrimary} />
                      <Text style={styles.openBtnText}>{r.appointment_id ? "Ouvrir" : "Sans RDV"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            </View>
          </DataState>

          <View style={tableStyles.paginationContainer}>
            <Text style={tableStyles.paginationText}>
              {total === 0 ? "0" : `${startIndex + 1}-${endIndex}`} sur {total}
            </Text>

            <View style={tableStyles.paginationButtons}>
              <TouchableOpacity
                style={[tableStyles.paginationButton, currentPage === 1 && { opacity: 0.5 }]}
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[tableStyles.paginationButton, currentPage === totalPages && { opacity: 0.5 }]}
                onPress={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    // Same continuous-card shell as users.tsx - header (title, search,
    // status tabs) and the table body below it are one bordered surface,
    // not a separate floating header card from PageShell's built-in title.
    pageCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      overflow: "hidden",
      ...(Platform.OS === "web" ? ({ boxShadow: "0px 8px 24px rgba(15,23,42,0.05)" } as any) : null),
    },
    pageHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 20,
      paddingHorizontal: 36,
      paddingTop: 30,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderMuted,
    },
    pageTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.3, color: theme.colors.text },
    pageSubtitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    pageSubtitle: { fontSize: 13, fontWeight: "500", color: theme.colors.textSecondary },
    subtitleSpinner: { marginLeft: 2 },
    // Dims (not unmounts) the existing rows while a background refetch is
    // in flight - e.g. clicking a status tab - so the list doesn't flash
    // out to a skeleton and back in for data that's already on screen.
    rowsRefreshing: { opacity: 0.45 },

    body: { flex: 1 },
    main: { paddingHorizontal: 36, paddingTop: 26, paddingBottom: 36 },

    headerActions: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 42,
      minWidth: 240,
    },
    searchInput: { flex: 1, fontSize: 13, fontWeight: "500", color: theme.colors.text },

    tabs: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 10,
    },
    tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 7 },
    tabActive: { backgroundColor: theme.colors.surface },
    tabText: { fontSize: 12.5, fontWeight: "600", color: theme.colors.textSecondary },
    tabTextActive: { color: theme.colors.text },

    tableHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderMuted,
    },
    tableHeaderText: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: theme.colors.muted,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderSubtle,
    },
    rowCell: { minWidth: 0, paddingRight: 10 },
    rowName: { fontSize: 14, fontWeight: "600", color: theme.colors.text },
    rowMeta: { fontSize: 12.5, fontWeight: "500", color: theme.colors.textSecondary },

    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    badgeText: { fontSize: 12.5, fontWeight: "600" },

    openBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    openBtnDisabled: { opacity: 0.45 },
    openBtnText: { color: theme.colors.textOnPrimary, fontWeight: "600", fontSize: 12.5 },
  });
