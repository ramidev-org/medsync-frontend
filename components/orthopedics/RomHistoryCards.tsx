import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import DatePickerField from "@/components/datepicker";
import { Dropdown } from "@/components/input_fields";
import type { OrthoRomEntry, OrthoJoint } from "./types";

function safeDate(iso: string) {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

const JOINT_LABEL: Record<OrthoJoint, string> = {
  neck: "Neck",
  shoulder_left: "Left shoulder",
  shoulder_right: "Right shoulder",
  elbow_left: "Left elbow",
  elbow_right: "Right elbow",
  wrist_left: "Left wrist",
  wrist_right: "Right wrist",
  hip_left: "Left hip",
  hip_right: "Right hip",
  knee_left: "Left knee",
  knee_right: "Right knee",
  ankle_left: "Left ankle",
  ankle_right: "Right ankle",
};

export function RomHistoryCards({
  theme,
  entries,
}: {
  theme: any;
  entries: OrthoRomEntry[];
}) {
  const [from, setFrom] = React.useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [to, setTo] = React.useState<Date>(() => new Date());
  const [joint, setJoint] = React.useState<string>("All");

  const filtered = React.useMemo(() => {
    const fromYmd = toYmd(from);
    const toYmd_ = toYmd(to);
    return (entries || [])
      .filter((e) => {
        const d = safeDate(e.atIso);
        if (!d) return false;
        const ymd = toYmd(d);
        if (ymd < fromYmd || ymd > toYmd_) return false;
        if (joint !== "All" && e.joint !== (joint as OrthoJoint)) return false;
        return true;
      })
      .sort((a, b) => (a.atIso < b.atIso ? 1 : -1));
  }, [entries, from, to, joint]);

  const clear = () => {
    const d = new Date();
    const f = new Date(d);
    f.setDate(f.getDate() - 30);
    setFrom(f);
    setTo(d);
    setJoint("All");
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border }}>
              <MaterialCommunityIcons name="history" size={16} color={theme.colors.primary} />
            </View>
            <Text style={{ fontWeight: "700", color: theme.colors.text }}>ROM history</Text>
          </View>
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
          <View style={{ minWidth: 240, flexGrow: 1, flexBasis: 240 }}>
            <Dropdown label="Joint" value={joint} options={["All", ...Object.keys(JOINT_LABEL)]} onChange={setJoint} prefixIcon="funnel-outline" />
          </View>
          <Pressable
            onPress={clear}
            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: theme.colors.surface, flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <MaterialCommunityIcons name="broom" size={16} color={theme.colors.textSecondary} />
            <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface }}>
          <Text style={{ fontWeight: "700", color: theme.colors.text }}>No ROM entries in range</Text>
          <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>Change ROM values to create entries.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((e) => {
            const at = safeDate(e.atIso);
            const dateLabel = at ? at.toLocaleString("fr-FR") : e.atIso;
            const v = e.value || ({} as any);
            const summary = [
              v.flexionDeg != null ? `Flex ${v.flexionDeg}` : null,
              v.extensionDeg != null ? `Ext ${v.extensionDeg}` : null,
              v.abductionDeg != null ? `Abd ${v.abductionDeg}` : null,
              v.adductionDeg != null ? `Add ${v.adductionDeg}` : null,
            ]
              .filter(Boolean)
              .join(" • ");
            return (
              <View key={e.id} style={{ padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <Text style={{ fontWeight: "700", color: theme.colors.text }}>{JOINT_LABEL[e.joint] ?? e.joint}</Text>
                  <Text style={{ fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 }}>{dateLabel}</Text>
                </View>
                <Text style={{ fontWeight: "600", color: theme.colors.textSecondary }}>{summary || "No values"}</Text>
                {v.note ? <Text style={{ fontWeight: "700", color: theme.colors.textSecondary }}>{v.note}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

