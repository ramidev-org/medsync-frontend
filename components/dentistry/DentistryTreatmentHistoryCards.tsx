import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import DatePickerField from "@/components/datepicker";
import { PROCEDURES, type OdontogramState, type ProcedureKey, type ToothSurface } from "./odontogram";
import { ProcedureFilterPill } from "./ProcedureFilterPill";
import { OdontogramDialog } from "./OdontogramDialog";

type TreatmentEvent = {
  id: string;
  at: string;
  procedure: ProcedureKey;
  teeth: string[];
  note?: string;
};

function safeDate(iso: string) {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function flattenHistory(odontogram: OdontogramState): TreatmentEvent[] {
  const map = new Map<string, { at: string; procedure: ProcedureKey; note?: string; teeth: Set<string> }>();

  for (const tooth of Object.keys(odontogram || {})) {
    const toothChart = (odontogram as any)[tooth] || {};
    for (const surface of Object.keys(toothChart || {}) as ToothSurface[]) {
      const surfaceChart = toothChart[surface];
      const history = surfaceChart?.history ?? [];
      for (const h of history) {
        if (!h?.at || !h?.procedure) continue;
        const at = String(h.at);
        const proc = h.procedure as ProcedureKey;
        const note = h.note ? String(h.note) : undefined;
        const key = `${at}__${proc}__${note ?? ""}`;
        const prev = map.get(key);
        if (!prev) map.set(key, { at, procedure: proc, note, teeth: new Set([tooth]) });
        else prev.teeth.add(tooth);
      }
    }
  }

  const events: TreatmentEvent[] = Array.from(map.entries())
    .map(([key, v]) => ({
      id: key,
      at: v.at,
      procedure: v.procedure,
      note: v.note,
      teeth: Array.from(v.teeth).sort(),
    }))
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  return events;
}

export function DentistryTreatmentHistoryCards({
  theme,
  odontogram,
}: {
  theme: any;
  odontogram: OdontogramState;
}) {
  const all = React.useMemo(() => flattenHistory(odontogram), [odontogram]);
  const [from, setFrom] = React.useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [to, setTo] = React.useState<Date>(() => new Date());
  const [procedure, setProcedure] = React.useState<ProcedureKey | "All">("All");
  const [viewRow, setViewRow] = React.useState<TreatmentEvent | null>(null);

  const filtered = React.useMemo(() => {
    const fromYmd = toYmd(from);
    const toYmd_ = toYmd(to);
    return all.filter((r) => {
      const d = safeDate(r.at);
      if (!d) return false;
      const ymd = toYmd(d);
      if (ymd < fromYmd || ymd > toYmd_) return false;
      if (procedure !== "All" && r.procedure !== procedure) return false;
      return true;
    });
  }, [all, from, to, procedure]);

  const clear = () => {
    const d = new Date();
    const f = new Date(d);
    f.setDate(f.getDate() - 30);
    setFrom(f);
    setTo(d);
    setProcedure("All");
  };

  const viewOdontogram = React.useMemo(() => {
    if (!viewRow) return null;
    const next: any = {};
    for (const tooth of viewRow.teeth) {
      next[tooth] = {
        O: {
          procedure: viewRow.procedure,
          history: [
            {
              id: `${viewRow.id}__${tooth}`,
              at: viewRow.at,
              tooth,
              surface: "O",
              procedure: viewRow.procedure,
              note: viewRow.note,
            },
          ],
        },
      };
    }
    return next as OdontogramState;
  }, [viewRow]);

  return (
    <View style={{ gap: 10 }}>
      <OdontogramDialog
        theme={theme}
        open={!!viewRow}
        title="Treatment view"
        subtitle={
          viewRow
            ? `${PROCEDURES.find((p) => p.key === viewRow.procedure)?.label ?? viewRow.procedure} • Teeth ${viewRow.teeth.join(", ")} • ${new Date(viewRow.at).toLocaleString("fr-FR")}`
            : undefined
        }
        odontogram={(viewOdontogram ?? odontogram) as any}
        selectedTeethFdi={viewRow ? viewRow.teeth : []}
        onClose={() => setViewRow(null)}
        readOnly
      />

      <View style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border }}>
              <MaterialCommunityIcons name="calendar-check-outline" size={16} color={theme.colors.primary} />
            </View>
            <Text style={{ fontWeight: "900", color: theme.colors.text }}>Treatment history</Text>
            <ProcedureFilterPill theme={theme} value={procedure} onChange={setProcedure as any} />
          </View>
          <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>{filtered.length} items</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
          <View style={{ flexDirection: "column", gap: 6 }}>
            <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>From</Text>
            <DatePickerField label="From" date={from} setDate={setFrom} />
          </View>
          <View style={{ flexDirection: "column", gap: 6 }}>
            <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>To</Text>
            <DatePickerField label="To" date={to} setDate={setTo} />
          </View>
          <Pressable
            onPress={clear}
            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surface, flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <MaterialCommunityIcons name="broom" size={16} color={theme.colors.textSecondary} />
            <Text style={{ fontWeight: "900", color: theme.colors.textSecondary }}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface }}>
          <Text style={{ fontWeight: "900", color: theme.colors.text }}>No treatments in range</Text>
          <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>Adjust the date range or procedure filter.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((r) => {
            const proc = PROCEDURES.find((p) => p.key === r.procedure);
            const at = safeDate(r.at);
            const dateLabel = at ? at.toLocaleString("fr-FR") : r.at;
            return (
              <View key={r.id} style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: proc?.color ?? theme.colors.primary }} />
                    <Text style={{ fontWeight: "900", color: theme.colors.text }}>{proc?.label ?? r.procedure}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 }}>{dateLabel}</Text>
                    <Pressable
                      onPress={() => setViewRow(r)}
                      style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: theme.colors.background, flexDirection: "row", alignItems: "center", gap: 6 }}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={{ fontWeight: "900", color: theme.colors.textSecondary, fontSize: 12 }}>View</Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={{ fontWeight: "800", color: theme.colors.textSecondary }}>
                  Teeth: {r.teeth.join(", ")}
                </Text>
                {r.note ? <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>{r.note}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
