import DatePickerField from "@/components/datepicker";
import { ThemedCard } from "@/components/default_card";
import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ================= MOCK DATA ================= */
const VISITS = [
  { id: "1", prenom: "Test", nom: "TEST", phone: "0794638935", time: "08:00", status: "treated" },
  { id: "2", prenom: "Ilyes", nom: "ILYES", phone: "", time: "08:00", status: "pending" },
  { id: "3", prenom: "Nadhir", nom: "NADHIR", phone: "", time: "09:00", status: "confirmed" },
  { id: "4", prenom: "Loubna", nom: "LOUBNA", phone: "", time: "09:00", status: "canceled" },
  { id: "5", prenom: "Omar", nom: "OMAR", phone: "", time: "11:00", status: "confirmed" },
  { id: "6", prenom: "Prenom", nom: "NOM", phone: "", time: "11:30", status: "confirmed" },
];

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmé",
  pending: "En attente",
  canceled: "Annulé",
  treated: "Traité",
};

/* ================= MAIN COMPONENT ================= */
export default function VisitsPage() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(new Date("2024-01-01"));

  const filteredVisits = useMemo(() => {
    return VISITS.filter(v => {
      const matchesStatus = filter === "all" || v.status === filter;
      const fullName = `${v.prenom} ${v.nom}`.toLowerCase();
      return matchesStatus && fullName.includes(search.toLowerCase());
    });
  }, [filter, search]);

  const progress = Math.round(
    (VISITS.filter(v => v.status === "treated").length / VISITS.length) * 100
  );

  const styles = createStyles(theme);

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />
      <View style={styles.row}>
        {/* ================= LEFT ================= */}
        <View style={styles.left}>
          <ScrollView>

            <View style={styles.filterSection}>
              {/* Search */}
              <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  placeholder="Rechercher..."
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                />

              </View>
              <DatePickerField label="Du" date={fromDate} setDate={setFromDate} />
                {/* Reset Filters */}
              <TouchableOpacity style={styles.resetButton} onPress={() => {}}>
                <Ionicons name="refresh" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: theme.colors.surfaceVariant }]}>
              {[
                { key: "all", label: "Tous" },
                { key: "pending", label: "En cours" },
                { key: "canceled", label: "Annulés" },
                { key: "treated", label: "Traités" },
                { key: "confirmed", label: "Confirmé" },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setFilter(tab.key)}
                  style={[
                    styles.tab,
                    filter === tab.key && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      filter === tab.key && { color: "#fff" },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Table */}
            <View style={styles.table}>
              {/* Header */}
              <View style={[styles.tableRow, styles.header]}>
                <Text style={[styles.cell, { flex: 0.5 }]}>Avatar</Text>
                <Text style={[styles.cell, { flex: 1 }]}>Nom complet</Text>
                <Text style={[styles.cell, { flex: 1 }]}>Téléphone</Text>
                <Text style={[styles.cell, { flex: 0.5 }]}>Heure</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: "center" }]}>Status</Text>
                <Text style={{ flex: 0.5, textAlign: "center" }}>Actions</Text>
              </View>

              {filteredVisits.map(v => (
                <View key={v.id} style={styles.tableRow}>
                  <View style={{ flex: 0.5 }}>
                    <Avatar firstName={v.prenom} lastName={v.nom} size={46} borderRadius={10} />
                  </View>
                  <Text style={[styles.cell, { flex: 1 }]}>{v.prenom} {v.nom}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>{v.phone || "-"}</Text>
                  <Text style={[styles.cell, { flex: 0.5 }]}>{v.time}</Text>
                  <View style={{ flex: 1, alignContent: "center" }}>
                    <View style={[styles.status, statusColor(v.status)]}>
                      <Text style={styles.statusText}>{STATUS_LABELS[v.status]}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={{ flex: 0.5, alignItems: "center" }}>
                    <Ionicons name="ellipsis-vertical" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ================= RIGHT ================= */}
        <View style={styles.right}>
          <ScrollView>
            {/* Progress */}
            <ThemedCard style={{ marginBottom: 16 }}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Etat d'avancement</Text>
                <Text style={[styles.progressValue, { color: theme.colors.primary }]}>{progress}%</Text>
              </View>

              <View style={[styles.progressBg, { backgroundColor: theme.colors.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
              </View>

              <Text style={styles.progressText}>
                {VISITS.filter(v => v.status === "treated").length} sur {VISITS.length} patients traités
              </Text>
            </ThemedCard>

            {/* Waiting Room */}
            <ThemedCard>
              <Text style={styles.waitingTitle}>Salle d'attente</Text>
              <Text style={styles.waitingSubtitle}>Patients confirmés aujourd'hui</Text>

              <View style={{ marginTop: 16 }}>
                {VISITS.filter(v => v.status === "pending").map(v => (
                  <View key={v.id} style={styles.waitingCard}>
                    <Avatar firstName={v.prenom} lastName={v.nom} size={56} borderRadius={12} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontWeight: "600" }}>{v.prenom} {v.nom}</Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>{v.time}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ThemedCard>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

/* ================= HELPERS ================= */
function statusColor(status: string) {
  switch (status) {
    case "confirmed": return { backgroundColor: "#22c55e" };
    case "pending": return { backgroundColor: "#60a5fa" };
    case "canceled": return { backgroundColor: "#d1d5db" };
    case "treated": return { backgroundColor: "#38bdf8" };
    default: return {};
  }
}

/* ================= STYLES ================= */
const createStyles = (theme: any) =>
  StyleSheet.create({
  page: { flex: 1 },
  row: { flexDirection: "row" },
  filterSection: { flexDirection: "row", alignItems: "center", gap: 12 ,marginBottom: 16 },
  left: { flex: 2, padding: 24 },
  right: { flex: 1, padding: 20 },
  searchBox: { flex: 1,flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, },
  searchInput: { flex: 1, padding: 12, fontSize: 14 },
  tabs: { flexDirection: "row", borderRadius: 12, padding: 6, marginBottom: 16 },
  tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  tabText: { fontWeight: "600" },
  table: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  header: { backgroundColor: "#f3f4f6" },
  tableRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  cell: { fontSize: 13 },
  status: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginHorizontal: 16 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "500", textAlign: "center" },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  progressTitle: { fontWeight: "600" },
  progressValue: { fontSize: 24, fontWeight: "700" },
  progressBg: { height: 10, borderRadius: 10 },
  progressFill: { height: 10, borderRadius: 10 },
  progressText: { marginTop: 12, fontSize: 13, color: "#6b7280" },
  waitingTitle: { fontSize: 16, fontWeight: "700" },
  waitingSubtitle: { fontSize: 13, color: "#6b7280" },
  waitingCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f8fd", padding: 12, borderRadius: 12, marginBottom: 10 },
      resetButton: {
      padding: 12,
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
});
