import { db } from "@/database/database_conn";
import { LineChart } from "react-native-chart-kit";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { SubTabBar } from "./_ui";
import { getConsultationFields, type ParameterField, type SpecialtyKey } from "./_observation_fields";

type ObservationHistoryRow = {
  consultation_id: string;
  created_at: string | null;
  updated_at: string | null;
  speciality_key: string | null;
  data: Record<string, unknown>;
};

type ChartField = ParameterField & {
  aliases?: string[];
  kind?: "number" | "blood_pressure" | "text";
};

const VITAL_CHART_FIELDS: ChartField[] = [
  { key: "weight_kg", label: "Poids (kg)", aliases: ["weight_kg", "poids_kg", "weight"], kind: "number" },
  { key: "height_cm", label: "Taille (cm)", aliases: ["height_cm", "taille_cm", "height"], kind: "number" },
  { key: "blood_pressure", label: "Tension arterielle", aliases: ["blood_pressure", "tension", "bloodPressure"], kind: "blood_pressure" },
  { key: "temperature_c", label: "Temperature (C)", aliases: ["temperature_c", "temperature"], kind: "number" },
];

function normalizeFieldLabel(label: string) {
  return String(label ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function trimValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}

function isPresent(value: unknown) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function pickFieldValue(data: Record<string, unknown>, field: ChartField): unknown {
  const keys = [field.key, ...(field.aliases ?? [])];
  for (const key of keys) {
    const value = trimValue(data[key]);
    if (isPresent(value)) return value;
  }

  if (field.kind === "blood_pressure") {
    const systolic = trimValue(data.systolic_bp);
    const diastolic = trimValue(data.diastolic_bp);
    if (isPresent(systolic) && isPresent(diastolic)) {
      return `${systolic}/${diastolic}`;
    }
  }

  return null;
}

function parseNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.replace(",", ".").trim();
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const next = Number(match[0]);
  return Number.isFinite(next) ? next : null;
}

function parseBloodPressure(data: Record<string, unknown>, value: unknown) {
  const fromColumns = {
    systolic: parseNumericValue(data.systolic_bp),
    diastolic: parseNumericValue(data.diastolic_bp),
  };
  if (fromColumns.systolic != null && fromColumns.diastolic != null) {
    return fromColumns;
  }

  if (typeof value !== "string") return { systolic: null, diastolic: null };

  const match = value.match(/(\d{2,3})\s*[/\\-]\s*(\d{2,3})/);
  if (!match) return { systolic: null, diastolic: null };

  return {
    systolic: Number(match[1]),
    diastolic: Number(match[2]),
  };
}

function formatShortDate(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return String(input);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function formatLongDate(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return String(input);
  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanizeValue(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "string") return value.trim() || "-";
  return String(value);
}

function dedupeChartFields(fields: ChartField[]) {
  const seenKeys = new Set<string>();
  const seenLabels = new Set<string>();
  return fields.filter((field) => {
    const key = String(field.key ?? "").trim().toLowerCase();
    const label = normalizeFieldLabel(field.label);
    if (!key && !label) return false;
    if (seenKeys.has(key) || seenLabels.has(label)) return false;
    seenKeys.add(key);
    seenLabels.add(label);
    return true;
  });
}

function buildChartFields(workspaceKey: SpecialtyKey) {
  const specialtyFields = getConsultationFields(workspaceKey).map<ChartField>((field) => ({
    ...field,
    kind: field.multiline ? "text" : undefined,
  }));
  return dedupeChartFields([...VITAL_CHART_FIELDS, ...specialtyFields]);
}

export default function ConsultationChartsTab({
  theme,
  workspaceKey,
  patientId,
  consultationId,
  currentPayload,
}: {
  theme: any;
  workspaceKey: SpecialtyKey;
  patientId?: string | null;
  consultationId?: string | null;
  currentPayload?: Record<string, unknown> | null;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const chartFields = React.useMemo(() => buildChartFields(workspaceKey), [workspaceKey]);
  const [activeFieldKey, setActiveFieldKey] = React.useState<string>(chartFields[0]?.key ?? "weight_kg");
  const [historyRows, setHistoryRows] = React.useState<ObservationHistoryRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [chartWidth, setChartWidth] = React.useState(720);

  React.useEffect(() => {
    if (!chartFields.some((field) => field.key === activeFieldKey)) {
      setActiveFieldKey(chartFields[0]?.key ?? "weight_kg");
    }
  }, [activeFieldKey, chartFields]);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!patientId) {
        setHistoryRows([]);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const { data, error } = await db
          .from("consultation_observations")
          .select("consultation_id, created_at, updated_at, speciality_key, data")
          .eq("patient_id", patientId)
          .eq("speciality_key", workspaceKey)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (cancelled) return;

        setHistoryRows(
          (data ?? []).map((row: any) => ({
            consultation_id: String(row.consultation_id),
            created_at: row.created_at ? String(row.created_at) : null,
            updated_at: row.updated_at ? String(row.updated_at) : null,
            speciality_key: row.speciality_key ? String(row.speciality_key) : null,
            data: asRecord(row.data),
          })),
        );
      } catch (error: any) {
        if (!cancelled) {
          setHistoryRows([]);
          setErrorMessage(error?.message || "Impossible de charger l'historique des observations.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [patientId, workspaceKey]);

  const mergedRows = React.useMemo(() => {
    const rows = [...historyRows];
    const payload = asRecord(currentPayload);
    const hasPayload = Object.values(payload).some(isPresent);
    if (!hasPayload || !consultationId) return rows;

    const rowIndex = rows.findIndex((row) => row.consultation_id === consultationId);
    const nextRow: ObservationHistoryRow = {
      consultation_id: consultationId,
      created_at: rows[rowIndex]?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      speciality_key: workspaceKey,
      data: {
        ...(rows[rowIndex]?.data ?? {}),
        ...payload,
      },
    };

    if (rowIndex >= 0) {
      rows[rowIndex] = nextRow;
      return rows;
    }

    return [...rows, nextRow];
  }, [consultationId, currentPayload, historyRows, workspaceKey]);

  const activeField = React.useMemo(
    () => chartFields.find((field) => field.key === activeFieldKey) ?? chartFields[0] ?? null,
    [activeFieldKey, chartFields],
  );

  const fieldEntries = React.useMemo(() => {
    if (!activeField) return [];

    return mergedRows
      .map((row) => {
        const value = pickFieldValue(row.data, activeField);
        return {
          id: row.consultation_id,
          dateLabel: formatShortDate(row.updated_at ?? row.created_at),
          fullDateLabel: formatLongDate(row.updated_at ?? row.created_at),
          rawValue: value,
          displayValue: humanizeValue(value),
          numericValue: parseNumericValue(value),
          bloodPressure:
            activeField.kind === "blood_pressure"
              ? parseBloodPressure(row.data, value)
              : { systolic: null, diastolic: null },
        };
      })
      .filter((entry) => isPresent(entry.rawValue));
  }, [activeField, mergedRows]);

  const numericEntries = React.useMemo(
    () => fieldEntries.filter((entry) => entry.numericValue != null),
    [fieldEntries],
  );

  const bloodPressureEntries = React.useMemo(
    () =>
      fieldEntries.filter(
        (entry) => entry.bloodPressure.systolic != null && entry.bloodPressure.diastolic != null,
      ),
    [fieldEntries],
  );

  const activeFieldIsNumeric = React.useMemo(() => {
    if (!activeField) return false;
    if (activeField.kind === "blood_pressure") return true;
    if (activeField.kind === "text") return false;
    return numericEntries.length > 0;
  }, [activeField, numericEntries.length]);

  const latestEntry = fieldEntries[fieldEntries.length - 1] ?? null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Charts</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Evolution des champs de consultation pour {workspaceKey.replaceAll("_", " ")}.
          </Text>
        </View>
        <View style={[styles.metaBadge, { backgroundColor: theme.colors.primarySoft }]}>
          <Text style={[styles.metaBadgeText, { color: theme.colors.primary }]}>
            {mergedRows.length} visite{mergedRows.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {chartFields.length ? (
        <SubTabBar
          theme={theme}
          tabs={chartFields.map((field) => ({ key: field.key, label: field.label.replace(/\s*:\s*$/, "") }))}
          activeKey={activeFieldKey}
          onChange={setActiveFieldKey}
        />
      ) : null}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>Chargement des donnees...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateText, { color: theme.colors.danger ?? "#B42318" }]}>{errorMessage}</Text>
        </View>
      ) : !activeField ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
            Aucun champ de consultation a afficher.
          </Text>
        </View>
      ) : !fieldEntries.length ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
            Aucune valeur enregistree pour {activeField.label.replace(/\s*:\s*$/, "")}.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.metricsRow}>
            <View style={[styles.metricBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Derniere valeur</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                {activeField.kind === "blood_pressure" && latestEntry
                  ? `${latestEntry.bloodPressure.systolic}/${latestEntry.bloodPressure.diastolic}`
                  : latestEntry?.displayValue ?? "-"}
              </Text>
            </View>
            <View style={[styles.metricBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Derniere mise a jour</Text>
              <Text style={[styles.metricValueSmall, { color: theme.colors.text }]}>
                {latestEntry?.fullDateLabel ?? "-"}
              </Text>
            </View>
          </View>

          {activeField.kind === "blood_pressure" && bloodPressureEntries.length ? (
            <View
              onLayout={(event) => setChartWidth(Math.max(320, event.nativeEvent.layout.width - 12))}
              style={styles.chartWrap}
            >
              <LineChart
                data={{
                  labels: bloodPressureEntries.map((entry) => entry.dateLabel),
                  datasets: [
                    {
                      data: bloodPressureEntries.map((entry) => Number(entry.bloodPressure.systolic)),
                      strokeWidth: 3,
                      color: (opacity = 1) => `rgba(37,99,235,${opacity})`,
                    },
                    {
                      data: bloodPressureEntries.map((entry) => Number(entry.bloodPressure.diastolic)),
                      strokeWidth: 3,
                      color: (opacity = 1) => `rgba(239,68,68,${opacity})`,
                    },
                  ],
                  legend: ["Systolique", "Diastolique"],
                }}
                width={chartWidth}
                height={260}
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(37,99,235,${opacity})`,
                  labelColor: () => theme.colors.textSecondary,
                  propsForBackgroundLines: { stroke: theme.colors.border, strokeWidth: 1 },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          ) : activeFieldIsNumeric && numericEntries.length ? (
            <View
              onLayout={(event) => setChartWidth(Math.max(320, event.nativeEvent.layout.width - 12))}
              style={styles.chartWrap}
            >
              <LineChart
                data={{
                  labels: numericEntries.map((entry) => entry.dateLabel),
                  datasets: [
                    {
                      data: numericEntries.map((entry) => Number(entry.numericValue)),
                      strokeWidth: 3,
                      color: (opacity = 1) => `rgba(37,99,235,${opacity})`,
                    },
                  ],
                }}
                width={chartWidth}
                height={260}
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(37,99,235,${opacity})`,
                  labelColor: () => theme.colors.textSecondary,
                  propsForBackgroundLines: { stroke: theme.colors.border, strokeWidth: 1 },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.historyList}>
            {fieldEntries
              .slice()
              .reverse()
              .map((entry) => (
                <View
                  key={`${activeField.key}-${entry.id}`}
                  style={[styles.historyItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                >
                  <Text style={[styles.historyDate, { color: theme.colors.textSecondary }]}>{entry.fullDateLabel}</Text>
                  <Text style={[styles.historyValue, { color: theme.colors.text }]}>
                    {activeField.kind === "blood_pressure"
                      ? `${entry.bloodPressure.systolic}/${entry.bloodPressure.diastolic}`
                      : entry.displayValue}
                  </Text>
                </View>
              ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 14,
      backgroundColor: theme.colors.background,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 10,
    },
    title: {
      fontSize: 18,
      fontWeight: "900",
    },
    subtitle: {
      fontSize: 12,
      marginTop: 4,
    },
    metaBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    metaBadgeText: {
      fontSize: 12,
      fontWeight: "900",
    },
    centerState: {
      minHeight: 180,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 20,
    },
    stateText: {
      textAlign: "center",
      fontSize: 13,
      lineHeight: 19,
    },
    metricsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 12,
    },
    metricBox: {
      flex: 1,
      minWidth: 220,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    metricLabel: {
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 6,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: "900",
    },
    metricValueSmall: {
      fontSize: 14,
      fontWeight: "800",
    },
    chartWrap: {
      alignItems: "center",
      marginBottom: 12,
      paddingVertical: 6,
    },
    chart: {
      borderRadius: 12,
    },
    historyList: {
      gap: 10,
      paddingBottom: 4,
    },
    historyItem: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    historyDate: {
      fontSize: 12,
      marginBottom: 4,
    },
    historyValue: {
      fontSize: 14,
      fontWeight: "800",
    },
  });
