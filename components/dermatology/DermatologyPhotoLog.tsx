import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import DatePickerField from "@/components/datepicker";
import { TextArea, TextField } from "@/components/input_fields";
import type { DermatologyPhotoEntry } from "./types";

function makeId() {
  return `photo_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeDate(iso: string) {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DermatologyPhotoLog({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: DermatologyPhotoEntry[];
  onChange: (next: DermatologyPhotoEntry[]) => void;
}) {
  const [uri, setUri] = React.useState("");
  const [note, setNote] = React.useState("");

  const add = () => {
    const clean = uri.trim();
    if (!clean) return;
    const next: DermatologyPhotoEntry = { id: makeId(), uri: clean, note: note.trim() || undefined, createdAtIso: new Date().toISOString() };
    onChange([next, ...(value || [])]);
    setUri("");
    setNote("");
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
            <MaterialCommunityIcons name="camera-outline" size={16} color={theme.colors.primary} />
          </View>
          <Text style={{ fontWeight: "700", color: theme.colors.text }}>Add photo reference</Text>
        </View>

        <TextField label="Photo URI" value={uri} onChangeText={setUri} prefixIcon="link-outline" placeholder="Paste a secure URL or local file reference…" />
        <TextArea label="Note" value={note} onChangeText={setNote} prefixIcon="document-text-outline" rows={3} placeholder="Lighting, angle, location, consent, etc." />

        <Pressable
          onPress={add}
          style={{
            alignSelf: "flex-start",
            borderWidth: 1,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.surface,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
          <Text style={{ fontWeight: "700", color: theme.colors.primary }}>Add photo</Text>
        </Pressable>
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.background }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>Filters</Text>
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
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>No photos logged</Text>
            <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>Store photo links and notes for later review.</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface }}>
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>No photos in range</Text>
            <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>Adjust the date range.</Text>
          </View>
        ) : (
          filtered.map((p) => (
            <View key={p.id} style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <Text style={{ fontWeight: "700", color: theme.colors.text, flex: 1 }} numberOfLines={1}>
                  {p.uri}
                </Text>
                <Text style={{ fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 }}>
                  {(safeDate(p.createdAtIso) ?? new Date()).toLocaleDateString("fr-FR")}
                </Text>
                <Pressable
                  onPress={() => remove(p.id)}
                  style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: theme.colors.background, flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MaterialCommunityIcons name="delete-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={{ fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 }}>Remove</Text>
                </Pressable>
              </View>
              {p.note ? <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>{p.note}</Text> : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
