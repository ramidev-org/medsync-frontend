import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

/* ================= MOCK DATA ================= */

const VISITS = [
  { id: "1", name: "TEST Test", phone: "0794638935", time: "08:00", status: "traité" },
  { id: "2", name: "ILYES Ilyes", phone: "", time: "08:00", status: "en_cours" },
  { id: "3", name: "NADHIR Nadhir", phone: "", time: "09:00", status: "confirmé" },
  { id: "4", name: "LOUBNA Loubna", phone: "", time: "09:00", status: "annulé" },
  { id: "5", name: "OMAR Omar", phone: "", time: "11:00", status: "confirmé" },
  { id: "6", name: "NOM Prenom", phone: "", time: "11:30", status: "confirmé" },
];

/* ================= PAGE ================= */

export default function VisitsPage() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState("tous");
  const [search, setSearch] = useState("");

  const filteredVisits = useMemo(() => {
    return VISITS.filter(v => {
      const matchesStatus = filter === "tous" || v.status === filter;
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [filter, search]);

  const progress = Math.round(
    (VISITS.filter(v => v.status === "traité").length / VISITS.length) * 100
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TopBar theme={theme} />

      <View style={styles.page}>
        {/* ================= LEFT ================= */}
        <View style={styles.left}>
          {/* Search */}
          <View style={styles.searchRow}>
                      <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={22} color="#9ca3af" />
              <TextInput 
                placeholder="Rechercher..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>


          </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {[
              { key: "tous", label: "Tous" },
              { key: "en_cours", label: "En cours" },
              { key: "annulé", label: "Annulés" },
              { key: "traité", label: "Traités" },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[styles.tab, filter === tab.key && styles.tabActive]}
              >
                <Text style={[styles.tabText, filter === tab.key && { color: "#fff" }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ===== TABLE ===== */}
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.row, styles.header]}>
              <Text style={[styles.cell, { flex: 2 }]}>Nom complet</Text>
              <Text style={[styles.cell, { flex: 2 }]}>Téléphone</Text>
              <Text style={[styles.cell, { flex: 1 }]}>Heure</Text>
              <Text style={[styles.cell, { flex: 1 }]}>Status</Text>
              <Text style={[styles.cell, { flex: 0.5 }]} />
            </View>

            {/* Rows */}
            {filteredVisits.map(v => (
              <View key={v.id} style={styles.row}>
                <Text style={[styles.cell, { flex: 2 }]}>{v.name}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{v.phone || "-"}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{v.time}</Text>

                <View style={[styles.status, statusColor(v.status)]}>
                  <Text style={styles.statusText}>{v.status}</Text>
                </View>

                <TouchableOpacity style={{ flex: 0.5 }}>
                  <Ionicons name="ellipsis-vertical" size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* ================= RIGHT (WAITING ROOM) ================= */}
        <View style={styles.right}>
          {/* Progress */}
          <View style={styles.progressBox}>
            <View style={styles.progressHeader}>
              <Text style={{ fontWeight: "600" }}>Etat d'avancement – {progress}%</Text>
              <Text>{VISITS.filter(v => v.status === "traité").length}/{VISITS.length}</Text>
            </View>

            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Waiting room */}
          <Text style={styles.waitingTitle}>Salle d'attente d'aujourd'hui</Text>

          {VISITS.filter(v => v.status === "confirmé").map(v => (
            <View key={v.id} style={styles.waitingCard}>
              <Text style={styles.waitingTime}>{v.time}</Text>
              <View>
                <Text style={{ fontWeight: "600" }}>{v.name}</Text>
                <Text style={{ color: "#16a34a", fontSize: 12 }}>confirmé</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ================= HELPERS ================= */

function statusColor(status: string) {
  switch (status) {
    case "confirmé":
      return { backgroundColor: "#22c55e" };
    case "en_cours":
      return { backgroundColor: "#60a5fa" };
    case "annulé":
      return { backgroundColor: "#d1d5db" };
    case "traité":
      return { backgroundColor: "#38bdf8" };
    default:
      return {};
  }
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    flex: 1,
  },

  left: {
    flex: 3,
    padding: 24,
  },

  right: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9fafb",
  },

  searchRow: { marginBottom: 16 },
  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  searchInput: { flex: 1, padding: 12 },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#e5efff",
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
  },
  tab: { flex: 1, padding: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#3b82f6" },
  tabText: { fontWeight: "600", color: "#3b82f6" },

  table: { backgroundColor: "#fff", borderRadius: 12 },
  header: { backgroundColor: "#f3f4f6" },
  row: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  cell: { fontSize: 13 },

  status: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  statusText: { color: "#fff", fontSize: 12 },

  progressBox: { marginBottom: 20 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressBg: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  progressFill: {
    height: 8,
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },

  waitingTitle: { fontWeight: "700", marginBottom: 12 },
  waitingCard: {
    backgroundColor: "#fff7ed",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  waitingTime: { fontSize: 12, color: "#6b7280" },
});
