import DatePickerField from "@/components/datepicker";
import { ThemedCard } from "@/components/default_card";
import { Avatar } from "@/components/patient_avatar";
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";

// JSON mock data
import data from "@/data/preview_data.json";
import { router } from "expo-router";

/* ================= STATUS LABELS ================= */
const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_consultation: "En consultation",
  completed: "Terminé",
  cancelled: "Annulé",
};

/* ================= TYPES ================= */
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  age?: number;
}

interface Appointment {
  id: string;
  patient_id: string;
  time: string;
  status: string;
  type: string;
  notes: string;
  patient?: Patient; // optional, attached dynamically
}

/* ================= MAIN COMPONENT ================= */
export default function VisitsPage() {
  const { theme } = useTheme();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const [detailsVisibleId, setDetailsVisibleId] = useState<string | null>(null);
  const [detailsPosition, setDetailsPosition] = useState<{ x: number; y: number } | null>(null);

  const infoIconRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const [selectedConsultation, setSelectedConsultation] = useState<Appointment | null>(null);

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ================= LOAD APPOINTMENTS WITH PATIENT ================= */
  useEffect(() => {
    const merged: Appointment[] = data.appointments.map(a => {
      const patient = data.patients.find(p => p.id === a.patient_id);
      return { ...a, patient };
    });
    setAppointments(merged);
  }, []);

  /* ================= FILTERED APPOINTMENTS ================= */
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchesStatus = filter === "all" || a.status === filter;
      const fullName = `${a.patient?.first_name || ""} ${a.patient?.last_name || ""}`.toLowerCase();
      return matchesStatus && fullName.includes(search.toLowerCase());
    });
  }, [appointments, filter, search]);

  const waitingRoomAppointments = useMemo(() => {
    return appointments.filter(a => a.status === "pending" || a.status === "in_consultation");
  }, [appointments]);

  const progress = Math.round(
    (appointments.filter(a => a.status === "completed").length / appointments.length) * 100
  );

  /* ================= UPDATE STATUS ================= */
  const updateStatus = (id: string, status: string) => {
    const updated = appointments.map(a =>
      a.id === id ? { ...a, status } : a
    );
    setAppointments(updated);
    setMenuVisibleId(null);
    setMenuPosition(null);
  };

  const openMenu = (id: string) => {
    const ref = rowRefs.current[id];
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    setMenuVisibleId(id);
    setMenuPosition({ x: rect.right - 320, y: rect.bottom - 25});
  };

  const openDetails = (id: string) => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    const ref = infoIconRefs.current[id];
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    setDetailsVisibleId(id);
    setDetailsPosition({
      x: rect.left - 260,
      y: rect.top - 10,
    });
  };

  const closeDetails = () => {
    hoverTimeout.current = setTimeout(() => {
      setDetailsVisibleId(null);
      setDetailsPosition(null);
    }, 120);
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <View style={styles.row}>
        {/* ================= LEFT ================= */}
        <View style={styles.left}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Filter Section */}
            <View style={styles.filterSection}>
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
              <TouchableOpacity style={styles.resetButton} onPress={() => setFromDate(new Date())}>
                <Ionicons name="refresh" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: theme.colors.surfaceVariant }]}>
              {[
                { key: "all", label: "Tous" },
                { key: "pending", label: "En attente" },
                { key: "in_consultation", label: "En consultation" },
                { key: "completed", label: "Terminé" },
                { key: "cancelled", label: "Annulé" },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setFilter(tab.key)}
                  style={[styles.tab, filter === tab.key && { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.tabText, filter === tab.key && { color: "#fff" }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ================= TABLE ================= */}
            <View style={styles.tableContainer}>
              <View style={[styles.tableRow, styles.header]}>
                <Text style={[styles.cell, { flex: 0.5 }]}>Avatar</Text>
                <Text style={[styles.cell, { flex: 1 }]}>Nom complet</Text>
                <Text style={[styles.cell, { flex: 1 }]}>Téléphone</Text>
                <Text style={[styles.cell, { flex: 0.5 }]}>Heure</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: "center" }]}>Status</Text>
                <Text style={{ flex: 0.5, textAlign: "center" }}>Actions</Text>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                {filteredAppointments.map(a => (
                  <View
                    key={a.id}
                    style={styles.tableRow}
                    ref={el => (rowRefs.current[a.id] = el as any)}
                  >
                    <View style={{ flex: 0.5 }}>
                      <Avatar firstName={a.patient?.first_name!} lastName={a.patient?.last_name!} size={46} borderRadius={10} />
                    </View>
                    <Text style={[styles.cell, { flex: 1 }]}>{a.patient?.first_name} {a.patient?.last_name}</Text>
                    <Text style={[styles.cell, { flex: 1 }]}>{a.patient?.phone || "-"}</Text>
                    <Text style={[styles.cell, { flex: 0.5 }]}>
                      {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <View style={{ flex: 1, alignContent: "center" }}>
                      <View style={[styles.status, statusColor(a.status)]}>
                        <Text style={styles.statusText}>{STATUS_LABELS[a.status]}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 0.5, alignItems: "center" }}>
                      <View style={styles.row}>
                        <TouchableOpacity onPress={() => openMenu(a.id)}>
                          <Ionicons name="ellipsis-vertical" size={24} color={"grey"} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push(`/consultation?id=${a.id}`)}>
                          <Ionicons name="document" size={24} color={"grey"} />
                        </TouchableOpacity>

                        <Pressable
                          ref={el => (infoIconRefs.current[a.id] = el as any)}
                          onHoverIn={() => openDetails(a.id)}
                          onHoverOut={closeDetails}>
                          <Ionicons name="information-circle" size={22} color={theme.colors.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>

        {/* ================= RIGHT ================= */}
        <View style={styles.right}>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Progress Card */}
            <ThemedCard style={{ marginBottom: 16 }}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Etat d'avancement</Text>
                <Text style={[styles.progressValue, { color: theme.colors.primary }]}>{progress}%</Text>
              </View>
              <View style={[styles.progressBg, { backgroundColor: theme.colors.border }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
              </View>
              <Text style={styles.progressText}>
                {appointments.filter(a => a.status === "completed").length} sur {appointments.length} patients traités
              </Text>
            </ThemedCard>

            {/* Waiting Room */}
            <ThemedCard>
              <Text style={styles.waitingTitle}>Salle d'attente</Text>
              <Text style={styles.waitingSubtitle}>Patients en attente ou en consultation</Text>
              <View style={{ marginTop: 16 }}>
                {waitingRoomAppointments.map(a => (
                  <View key={a.id} style={styles.waitingCard}>
                    <Avatar firstName={a.patient?.first_name!} lastName={a.patient?.last_name!} size={56} borderRadius={12} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontWeight: "600" }}>
                        {a.patient?.first_name} {a.patient?.last_name}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>
                        {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ThemedCard>
          </ScrollView>
        </View>
      </View>

      {/* ================= FLOATING MENU ================= */}
      {menuVisibleId && menuPosition && (
        <>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { setMenuVisibleId(null); setMenuPosition(null); }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
          />
          <View
            style={{
              position: "absolute",
              top: menuPosition.y,
              left: menuPosition.x,
              width: 150,
              backgroundColor: "#fff",
              borderRadius: 8,
              paddingVertical: 4,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
              zIndex: 1000,
            }}
          >
            {["pending", "in_consultation", "completed", "cancelled"].map(status => (
              <TouchableOpacity key={status} style={{ paddingVertical: 10, paddingHorizontal: 16 }} onPress={() => updateStatus(menuVisibleId, status)}>
                <Text style={{ fontSize: 14 }}>{STATUS_LABELS[status]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}



      {/* ================= DETAILS POPUP ================= */}
      {detailsVisibleId && detailsPosition && (() => {
        const a = appointments.find(ap => ap.id === detailsVisibleId);
        if (!a?.notes) return null;
        return (
          <Pressable
            onHoverIn={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); hoverTimeout.current = null; }}
            onHoverOut={closeDetails}
            style={{
              position: "absolute",
              top: detailsPosition.y,
              left: detailsPosition.x,
              width: 240,
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 14,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 6,
              zIndex: 1000,
            }}
          >
            <Text style={{ fontWeight: "700", marginBottom: 6 }}>Détails du rendez-vous</Text>
            <Text style={{ fontSize: 13 }}>{a.notes}</Text>
          </Pressable>
        );
      })()}

    </View>
  );
}

/* ================= HELPERS ================= */
function statusColor(status: string): ViewStyle {
  switch (status) {
    case "completed": return { backgroundColor: "#22c55e" };
    case "pending": return { backgroundColor: "#60a5fa" };
    case "cancelled": return { backgroundColor: "#9ca3af" };
    case "in_consultation": return { backgroundColor: "#38bdf8" };
    default: return {};
  }
}

/* ================= STYLES ================= */
const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    row: { flexDirection: "row" },
    filterSection: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    left: { flex: 2, padding: 24 },
    right: { flex: 1, padding: 20 },
    searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12 },
    searchInput: { flex: 1, padding: 12, fontSize: 14 },
    tabs: { flexDirection: "row", borderRadius: 12, padding: 6, marginBottom: 16 },
    tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
    tabText: { fontWeight: "600" },
    tableContainer: { height: 400, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
    tableRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    cell: { fontSize: 13 },
    header: { backgroundColor: "#f3f4f6" },
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
    resetButton: { padding: 12, backgroundColor: theme.colors.card, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  });
