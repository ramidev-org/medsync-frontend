import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { getPatients, type PatientListRow } from "@/services/patients.services";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type NavTarget = { key: string; label: string; route: string; icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap };

// A small, deliberately independent list from the drawer's own nav array
// (apps/frontend/app/(drawer)/_layout.tsx) - kept local so this widget has
// no coupling to the drawer's internal NAV constant, which isn't exported.
const NAV_TARGETS: NavTarget[] = [
  { key: "dashboard", label: "Dashboard", route: "/dashboard", icon: "grid-outline" },
  { key: "calendar", label: "Calendar", route: "/calendar", icon: "calendar-outline" },
  { key: "patients", label: "Patients", route: "/patients", icon: "people-outline" },
  { key: "visits", label: "Visits", route: "/visits", icon: "clipboard-outline" },
  { key: "consultations", label: "Consultations", route: "/consultations", icon: "document-text-outline" },
  { key: "payments", label: "Billing", route: "/payments", icon: "card-outline" },
  { key: "reports", label: "Reports", route: "/reports", icon: "bar-chart-outline" },
  { key: "tasks", label: "Tasks", route: "/tasks", icon: "checkbox-outline" },
  { key: "inventory", label: "Inventory", route: "/inventory", icon: "cube-outline" },
  { key: "users", label: "Team", route: "/users", icon: "people-circle-outline" },
  { key: "chats", label: "Chats", route: "/chats", icon: "chatbubbles-outline" },
  { key: "settings", label: "Settings", route: "/settings", icon: "settings-outline" },
];

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function QuickSearch({ theme, visible, onClose }: { theme: any; visible: boolean; onClose: () => void }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const { clinic } = useAppData();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [patients, setPatients] = React.useState<PatientListRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (visible) {
      setQuery("");
      setPatients([]);
      // A short delay lets the modal actually mount before we try to focus.
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [visible]);

  React.useEffect(() => {
    let cancelled = false;
    const q = debouncedQuery.trim();
    if (!q || !user?.id || !clinic?.id) {
      setPatients([]);
      return;
    }
    setLoading(true);
    getPatients({ requesterId: user.id, clinicId: String(clinic.id), search: q, itemsPerPage: 6 })
      .then((res) => {
        if (!cancelled) setPatients(res?.patients ?? []);
      })
      .catch(() => {
        if (!cancelled) setPatients([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, user?.id, clinic?.id]);

  const matchingPages = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_TARGETS;
    return NAV_TARGETS.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  React.useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, onClose]);

  const goToPatient = (patient: PatientListRow) => {
    onClose();
    router.push({ pathname: "/patient_medical_info", params: { patientId: patient.id } } as any);
  };

  const goToPage = (target: NavTarget) => {
    onClose();
    router.push(target.route as any);
  };

  const showEmptyState = !loading && !!query.trim() && patients.length === 0 && matchingPages.length === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search patients, or jump to a page..."
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
              autoCorrect={false}
            />
            {loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
            <Pressable onPress={onClose} style={styles.closeChip}>
              <Text style={styles.closeChipText}>Esc</Text>
            </Pressable>
          </View>

          <View style={styles.resultsScroll}>
            {query.trim() && patients.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Patients</Text>
                {patients.map((patient) => (
                  <Pressable key={patient.id} style={styles.resultRow} onPress={() => goToPatient(patient)}>
                    <View style={styles.resultIcon}>
                      <Ionicons name="person" size={16} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {`${patient.first_name} ${patient.last_name}`.trim() || "Patient"}
                      </Text>
                      <Text style={styles.resultMeta} numberOfLines={1}>
                        {[patient.code, patient.phone].filter(Boolean).join(" • ") || "No further details"}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={theme.colors.textSecondary} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            {matchingPages.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Pages</Text>
                {matchingPages.map((target) => (
                  <Pressable key={target.key} style={styles.resultRow} onPress={() => goToPage(target)}>
                    <View style={styles.resultIcon}>
                      <Ionicons name={target.icon} size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.resultTitle}>{target.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {showEmptyState ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No patients or pages match &quot;{query.trim()}&quot;.</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.35)",
      alignItems: "center",
      paddingTop: 100,
    },
    panel: {
      width: "100%",
      maxWidth: 560,
      maxHeight: "70%",
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      paddingVertical: 4,
    },
    closeChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    closeChipText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.textSecondary,
    },
    resultsScroll: {
      paddingVertical: 8,
    },
    section: {
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      color: theme.colors.textSecondary,
      marginBottom: 4,
      marginTop: 8,
      marginLeft: 4,
    },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: 10,
    },
    resultIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.soft?.primary ?? theme.colors.accent,
    },
    resultTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      flexShrink: 1,
    },
    resultMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
    emptyState: {
      paddingVertical: 24,
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
  });
