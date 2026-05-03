import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AppointmentRow = {
  id: string;
  scheduled_at: string;
  status: string;
  type: string;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  doctor_name?: string | null;
};

type RpcGetAppointmentsResponse = {
  appointments: AppointmentRow[];
};

const HOURS = Array.from({ length: 11 }, (_, idx) => idx + 7);
const ROOMS = ["Room 1", "Room 2", "Overflow", "Hygiene"];

const toHourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const toneBg = (status: string) => {
  const key = String(status || "").toLowerCase();
  if (key === "completed") return "#DCFCE7";
  if (key === "cancelled") return "#FEE2E2";
  if (key === "in_consultation") return "#DBEAFE";
  return "#F3E8FF";
};

export default function CalendarPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [rows, setRows] = React.useState<AppointmentRow[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const res = await callRpc<RpcGetAppointmentsResponse, Record<string, unknown>>("rpc_get_appointments", {
          p_requester_id: user.id,
          p_search: null,
          p_status: null,
          p_doctor_id: null,
          p_start_date: start.toISOString(),
          p_end_date: end.toISOString(),
          p_page: 1,
          p_items_per_page: 120,
        });
        if (!cancelled) setRows(res?.appointments ?? []);
      } catch {
        if (!cancelled) setRows([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const lanes = React.useMemo(() => {
    const grouped: Record<string, AppointmentRow[]> = {};
    for (const room of ROOMS) grouped[room] = [];
    rows.forEach((row, idx) => grouped[ROOMS[idx % ROOMS.length]].push(row));
    return grouped;
  }, [rows]);

  return (
    <PageShell
      title="Schedule"
      subtitle="Archy-inspired command schedule with timeline and patient context."
      actions={
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.actionBtn}><Ionicons name="chevron-back" size={16} color={theme.colors.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Today</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Ionicons name="chevron-forward" size={16} color={theme.colors.text} /></TouchableOpacity>
        </View>
      }
    >
      <View style={styles.shell}>
        <View style={styles.leftPanel}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>BP</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientName}>Brynn Pelerin</Text>
              <Text style={styles.patientMeta}>65, active • next at 11:20 AM</Text>
            </View>
          </View>

          <View style={styles.quickGrid}>
            {["Overview", "Insurance", "Medical Hx", "Imaging", "Charting", "Billing"].map((item) => (
              <View key={item} style={styles.quickChip}><Text style={styles.quickText}>{item}</Text></View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Next Appointment</Text>
            <Text style={styles.sectionItem}>Tue, Sep 23, 2025 • 11:20 PM</Text>
            <Text style={styles.sectionItem}>Dr. Daria • Room 1</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <View style={styles.tagRow}>
              <Text style={styles.tag}>Lab case</Text>
              <Text style={styles.tag}>Forms</Text>
              <Text style={styles.tag}>Clinical note</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal style={{ flex: 1 }} contentContainerStyle={styles.boardWrap}>
          <View style={styles.timeRail}>
            <View style={styles.headSpacer} />
            {HOURS.map((hour) => (
              <View key={hour} style={styles.hourRow}><Text style={styles.hourText}>{toHourLabel(hour)}</Text></View>
            ))}
          </View>

          {ROOMS.map((room) => (
            <View key={room} style={styles.roomCol}>
              <View style={styles.roomHead}><Text style={styles.roomTitle}>{room}</Text></View>
              <View style={styles.gridBody}>
                {HOURS.map((hour) => (
                  <View key={hour} style={styles.gridLine} />
                ))}
                <View style={styles.cardsLayer}>
                  {(lanes[room] || []).slice(0, 4).map((appt, index) => (
                    <TouchableOpacity key={appt.id} style={[styles.apptCard, { backgroundColor: toneBg(appt.status), top: 14 + index * 58 }]}>
                      <Text style={styles.apptTitle}>{(appt.patient_first_name || "") + " " + (appt.patient_last_name || "")}</Text>
                      <Text style={styles.apptMeta}>{appt.doctor_name ? `Dr. ${appt.doctor_name}` : "Doctor TBD"}</Text>
                      <Text style={styles.apptMeta}>{appt.type || "Procedure"}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    shell: { flexDirection: "row", gap: 12, minHeight: 680 },
    leftPanel: { width: 260, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, padding: 10, gap: 10 },
    profileCard: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 10 },
    avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.primarySoft },
    avatarText: { color: theme.colors.primary, fontWeight: "900", fontSize: 12 },
    patientName: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },
    patientMeta: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 11, fontWeight: "700" },
    quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    quickChip: { borderRadius: 9, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.background },
    quickText: { color: theme.colors.text, fontSize: 11, fontWeight: "800" },
    sectionCard: { borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, padding: 10, gap: 6 },
    sectionTitle: { color: theme.colors.text, fontWeight: "900" },
    sectionItem: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary },

    actionBtn: { height: 36, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface, flexDirection: "row" },
    actionText: { color: theme.colors.text, fontWeight: "800", fontSize: 12 },

    boardWrap: { minWidth: 980, gap: 0, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, overflow: "hidden", backgroundColor: theme.colors.surface },
    timeRail: { width: 76, borderRightWidth: 1, borderRightColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant },
    headSpacer: { height: 42, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    hourRow: { height: 58, justifyContent: "center", paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    hourText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11 },

    roomCol: { width: 226, borderRightWidth: 1, borderRightColor: theme.colors.border },
    roomHead: { height: 42, alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant },
    roomTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
    gridBody: { position: "relative" },
    gridLine: { height: 58, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    cardsLayer: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 8 },
    apptCard: { position: "absolute", left: 8, right: 8, minHeight: 52, borderRadius: 8, borderWidth: 1, borderColor: "rgba(15,23,42,0.08)", padding: 8 },
    apptTitle: { color: "#1F2937", fontWeight: "900", fontSize: 12 },
    apptMeta: { color: "#4B5563", fontWeight: "700", fontSize: 10, marginTop: 1 },
  });
