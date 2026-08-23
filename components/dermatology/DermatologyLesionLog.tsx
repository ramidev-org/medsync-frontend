import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Dropdown, NumberField, TextArea, TextField } from "@/components/common/input_fields";
import DatePickerField from "@/components/common/datepicker";
import type { BodySide, DermatologyLesionEntry } from "./types";

const MORPHOLOGY = [
  "Macule",
  "Papule",
  "Plaque",
  "Nodule",
  "Vesicle",
  "Pustule",
  "Ulcer",
  "Scale",
  "Other",
] as const;

const REGIONS = [
  "Scalp",
  "Face",
  "Neck",
  "Chest",
  "Back",
  "Abdomen",
  "Upper limb",
  "Lower limb",
  "Hands",
  "Feet",
  "Other",
] as const;

function makeId() {
  return `lesion_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeDate(iso: string) {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DermatologyLesionLog({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: DermatologyLesionEntry[];
  onChange: (next: DermatologyLesionEntry[]) => void;
}) {
  const [draft, setDraft] = React.useState<{
    side: BodySide;
    region: string;
    morphology: string;
    sizeMm: string;
    symptoms: string;
    note: string;
  }>({
    side: "front",
    region: "Face",
    morphology: "Papule",
    sizeMm: "",
    symptoms: "",
    note: "",
  });

  const add = () => {
    const next: DermatologyLesionEntry = {
      id: makeId(),
      side: draft.side,
      region: draft.region,
      morphology: draft.morphology,
      sizeMm: draft.sizeMm.trim() || undefined,
      symptoms: draft.symptoms.trim() || undefined,
      note: draft.note.trim() || undefined,
      createdAtIso: new Date().toISOString(),
    };
    onChange([next, ...(value || [])]);
    setDraft((d) => ({ ...d, sizeMm: "", symptoms: "", note: "" }));
  };

  const remove = (id: string) => onChange((value || []).filter((x) => x.id !== id));

  const [from, setFrom] = React.useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [to, setTo] = React.useState<Date>(() => new Date());

  const filtered = React.useMemo(() => {
    const fromYmd = toYmd(from);
    const toYmd_ = toYmd(to);
    return (value || []).filter((r) => {
      const d = safeDate(r.createdAtIso);
      if (!d) return false;
      const ymd = toYmd(d);
      return ymd >= fromYmd && ymd <= toYmd_;
    });
  }, [from, to, value]);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border }}>
            <MaterialCommunityIcons name="beaker-outline" size={16} color={theme.colors.primary} />
          </View>
          <Text style={{ fontWeight: "700", color: theme.colors.text }}>Create lesion</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
            <Dropdown label="Side" value={draft.side} options={["front", "back"]} onChange={(v) => setDraft((d) => ({ ...d, side: v as any }))} prefixIcon="body-outline" />
          </View>
          <View style={{ minWidth: 240, flexGrow: 1, flexBasis: 240 }}>
            <Dropdown label="Region" value={draft.region} options={[...REGIONS]} onChange={(region) => setDraft((d) => ({ ...d, region }))} prefixIcon="map-outline" />
          </View>
          <View style={{ minWidth: 240, flexGrow: 1, flexBasis: 240 }}>
            <Dropdown label="Morphology" value={draft.morphology} options={[...MORPHOLOGY]} onChange={(morphology) => setDraft((d) => ({ ...d, morphology }))} prefixIcon="apps-outline" />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <View style={{ minWidth: 220, flexGrow: 1, flexBasis: 220 }}>
            <NumberField label="Size (mm)" value={draft.sizeMm} onChangeText={(sizeMm) => setDraft((d) => ({ ...d, sizeMm }))} prefixIcon="resize-outline" allowDecimal />
          </View>
          <View style={{ minWidth: 260, flexGrow: 1, flexBasis: 260 }}>
            <TextField label="Symptoms" value={draft.symptoms} onChangeText={(symptoms) => setDraft((d) => ({ ...d, symptoms }))} prefixIcon="pulse-outline" placeholder="e.g. pruritus, pain, bleeding" />
          </View>
        </View>

        <TextArea label="Note" value={draft.note} onChangeText={(note) => setDraft((d) => ({ ...d, note }))} prefixIcon="document-text-outline" placeholder="Distribution, border, color, evolution..." rows={3} />

        <Pressable
          onPress={add}
          style={{
            alignSelf: "flex-start",
            borderWidth: 1,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MaterialCommunityIcons name="plus" size={16} color={theme.colors.textOnPrimary} />
          <Text style={{ fontWeight: "700", color: theme.colors.textOnPrimary }}>Create</Text>
        </Pressable>
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.background }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>History</Text>
            <Text style={{ fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 }}>{filtered.length} items</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            <View style={{ flexDirection: "column", gap: 6 }}>
              <Text style={{ fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 }}>From</Text>
              <DatePickerField label="From" date={from} setDate={setFrom} />
            </View>
            <View style={{ flexDirection: "column", gap: 6 }}>
              <Text style={{ fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 }}>To</Text>
              <DatePickerField label="To" date={to} setDate={setTo} />
            </View>
          </View>
        </View>

        {(value || []).length === 0 ? (
          <View style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface }}>
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>No lesions logged</Text>
            <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>Use the form above to add structured entries.</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface }}>
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>No lesions in range</Text>
            <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>Adjust the date range.</Text>
          </View>
        ) : (
          filtered.map((l) => (
            <View key={l.id} style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border }}>
                    <MaterialCommunityIcons name="tag-outline" size={14} color={theme.colors.primary} />
                  </View>
                  <Text style={{ fontWeight: "700", color: theme.colors.text }}>
                    {l.morphology} • {l.region} • {l.side}
                  </Text>
                </View>
                <Text style={{ fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 }}>
                  {(safeDate(l.createdAtIso) ?? new Date()).toLocaleDateString("fr-FR")}
                </Text>
                <Pressable
                  onPress={() => remove(l.id)}
                  style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: theme.colors.background, flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MaterialCommunityIcons name="delete-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={{ fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>Remove</Text>
                </Pressable>
              </View>
              {(l.sizeMm || l.symptoms) ? (
                <Text style={{ fontWeight: "600", color: theme.colors.textSecondary }}>
                  {l.sizeMm ? `Size: ${l.sizeMm} mm` : ""}
                  {l.sizeMm && l.symptoms ? " • " : ""}
                  {l.symptoms ? `Symptoms: ${l.symptoms}` : ""}
                </Text>
              ) : null}
              {l.note ? <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>{l.note}</Text> : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
