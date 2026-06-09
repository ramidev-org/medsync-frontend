import { DateRangePickerField } from "@/components/datepicker";
import PatientFormWithMedical from "@/components/new_patient";
import { Avatar } from "@/components/patient_avatar";
import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Patient {
  id: string;
  code?: string | null;
  first_name: string;
  last_name: string;
  age: number;
  sex: "male" | "female";
  phone: string;
  address_city?: string;
}

type RpcGetPatientsResponse = {
  patients: Patient[];
  total: number;
};

export default function PatientsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tableStyles = createTableStyles(theme);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1, 0, 0));
  const [toDate, setToDate] = useState(new Date(new Date().getFullYear(), 11, 31, 23, 59));
  const [searchInput, setSearchInput] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [rows, setRows] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const resetDateRange = useCallback(() => {
    setFromDate(new Date(new Date().getFullYear(), 0, 1, 0, 0));
    setToDate(new Date(new Date().getFullYear(), 11, 31, 23, 59));
  }, []);

  const fetchRows = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const data = await callRpc<RpcGetPatientsResponse, Record<string, unknown>>("rpc_get_patients", {
        p_requester_id: user.id,
        p_search: globalSearch.trim() ? globalSearch.trim() : null,
        p_start_date: fromDate.toISOString(),
        p_end_date: toDate.toISOString(),
        p_page: 1,
        p_items_per_page: 50,
      });
      setRows(data?.patients ?? []);
      setTotal(data?.total ?? 0);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, globalSearch, fromDate, toDate]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return (
    <PageShell
      title="Patients"
      subtitle={`${total} patient${total > 1 ? "s" : ""}`}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchRows} />}
      actions={
        <View style={styles.actions}>
          <View style={styles.searchFieldWrap}>
            <View style={styles.fieldLabelSpacer} />
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput value={searchInput} onChangeText={setSearchInput} placeholder="Search patient..." placeholderTextColor={theme.colors.textSecondary} style={styles.searchInput} />
              {searchInput ? (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchInput("")} hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setGlobalSearch(searchInput)}>
            <Ionicons name="funnel-outline" size={18} color={theme.colors.text} />
          </TouchableOpacity>
          <DateRangePickerField
            label="Date range"
            startDate={fromDate}
            endDate={toDate}
            setStartDate={setFromDate}
            setEndDate={setToDate}
            onClear={resetDateRange}
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addTxt}>New Patient</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 18 }}>
        <View style={tableStyles.tableCard}>
          <View style={tableStyles.tableHeader}>
            {["Avatar", "Name", "Age", "Sex", "Phone", "City", "Action"].map((h) => (
              <View key={h} style={tableStyles.headerCell}><Text style={tableStyles.headerText}>{h}</Text></View>
            ))}
          </View>
          {rows.map((patient, index) => (
            <View key={patient.id} style={[tableStyles.tableRow, index % 2 === 0 ? tableStyles.tableRowAlt : null]}>
              <View style={tableStyles.cell}><Avatar firstName={patient.first_name} lastName={patient.last_name} size={40} borderRadius={10} /></View>
              <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{patient.first_name} {patient.last_name}</Text></View>
              <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{patient.age ?? "—"}</Text></View>
              <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{patient.sex}</Text></View>
              <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{patient.phone || "—"}</Text></View>
              <View style={tableStyles.cell}><Text style={tableStyles.cellText}>{patient.address_city || "—"}</Text></View>
              <View style={tableStyles.cell}>
                <TouchableOpacity onPress={() => router.push({ pathname: "/patient_medical_info", params: { patientId: patient.id } })}>
                  <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <PatientFormWithMedical visible={showAddForm} onClose={() => setShowAddForm(false)} onSuccess={fetchRows} />
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: 10 },
    searchFieldWrap: { width: 320 },
    fieldLabelSpacer: { height: 22 },
    searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.colors.surface, minHeight: 42 },
    searchInput: { flex: 1, color: theme.colors.text, fontWeight: "700" },
    clearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    iconBtn: { width: 42, height: 42, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 10, minHeight: 42 },
    addTxt: { color: "#fff", fontWeight: "800" },
  });
