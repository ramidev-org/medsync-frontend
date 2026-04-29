import { BlueField } from "../_ui";
import React from "react";
import { PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ToothStatus = "healthy" | "cavity" | "missing" | "treated";

type ToothMap = Partial<Record<string, ToothStatus>>;

export type DentistryState = {
  chiefComplaint?: string;
  gumStatus?: string;
  plaqueIndex?: string;
  occlusionNotes?: string;
  treatmentPlan?: string;
  viewRotation?: number;
  viewZoom?: number;
  viewDepth?: number;
  activeTool?: ToothStatus;
  teeth?: ToothMap;
};

const UPPER_TEETH = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER_TEETH = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];

const TOOL_OPTIONS: { key: ToothStatus; label: string }[] = [
  { key: "healthy", label: "Healthy" },
  { key: "cavity", label: "Cavity" },
  { key: "treated", label: "Treated" },
  { key: "missing", label: "Missing" },
];

const STATUS_COLOR: Record<ToothStatus, string> = {
  healthy: "#16A34A",
  cavity: "#DC2626",
  missing: "#6B7280",
  treated: "#2563EB",
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function Mouth3DPreview({
  theme,
  rotation,
  zoom,
  depth,
  teeth,
  panHandlers,
  onReset,
}: {
  theme: any;
  rotation: number;
  zoom: number;
  depth: number;
  teeth: ToothMap;
  panHandlers?: any;
  onReset?: () => void;
}) {
  const upperPoints = UPPER_TEETH.slice(0, 8);
  const lowerPoints = LOWER_TEETH.slice(0, 8);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceVariant,
        padding: 12,
      }}
    >
      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginBottom: 8 }}>
        3D Preview
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", marginBottom: 8 }}>
        Drag to rotate and tilt
      </Text>

      <View
        {...panHandlers}
        style={{
          minHeight: 170,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            transform: [
              { perspective: 900 },
              { rotateX: `${-20 + depth * 25}deg` },
              { rotateY: `${rotation}deg` },
              { scale: zoom },
            ],
          }}
        >
          <View
            style={{
              width: 250,
              height: 64,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {upperPoints.map((t) => (
                <View
                  key={`u-${t}`}
                  style={{
                    width: 14,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: STATUS_COLOR[teeth[t] ?? "healthy"],
                    opacity: 0.9,
                  }}
                />
              ))}
            </View>
          </View>

          <View
            style={{
              width: 250,
              height: 64,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {lowerPoints.map((t) => (
                <View
                  key={`l-${t}`}
                  style={{
                    width: 14,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: STATUS_COLOR[teeth[t] ?? "healthy"],
                    opacity: 0.9,
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
        <TouchableOpacity
          onPress={onReset}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text style={{ fontWeight: "800", color: theme.colors.text }}>Reset view</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NumberAdjuster({
  theme,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  theme: any;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const dec = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <View style={styles.adjustWrap}>
      <Text style={[styles.adjustLabel, { color: theme.colors.primary }]}>{label}</Text>
      <View style={styles.adjustRow}>
        <TouchableOpacity style={styles.adjustBtn} onPress={dec}>
          <Text style={styles.adjustBtnText}>-</Text>
        </TouchableOpacity>

        <View style={[styles.adjustValueBox, { borderColor: theme.colors.primary }]}>
          <Text style={styles.adjustValueText}>{value.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.adjustBtn} onPress={inc}>
          <Text style={styles.adjustBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ToothCell({
  theme,
  tooth,
  status,
  active,
  onPress,
}: {
  theme: any;
  tooth: string;
  status: ToothStatus;
  active: boolean;
  onPress: () => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tooth,
        {
          borderColor: STATUS_COLOR[status],
          backgroundColor: active ? theme.colors.accent : theme.colors.surface,
        },
      ]}
    >
      <Text style={[styles.toothId, { color: STATUS_COLOR[status] }]}>{tooth}</Text>
      <View style={[styles.toothDot, { backgroundColor: STATUS_COLOR[status] }]} />
    </TouchableOpacity>
  );
}

export function DentistryTab({
  theme,
  value,
  onChange,
}: {
  theme: any;
  value: DentistryState;
  onChange: (next: DentistryState) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const set = (p: Partial<DentistryState>) => onChange({ ...value, ...p });

  const activeTool = value.activeTool ?? "healthy";
  const teeth = value.teeth ?? {};
  const dragStart = React.useRef({
    rotation: value.viewRotation ?? 0,
    depth: value.viewDepth ?? 0,
  });

  const paintTooth = (tooth: string) => {
    set({
      teeth: {
        ...teeth,
        [tooth]: activeTool,
      },
    });
  };

  const getStatus = (tooth: string): ToothStatus => teeth[tooth] ?? "healthy";
  const reset3D = () => set({ viewRotation: 0, viewZoom: 1, viewDepth: 0 });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
    onPanResponderGrant: () => {
      dragStart.current = {
        rotation: value.viewRotation ?? 0,
        depth: value.viewDepth ?? 0,
      };
    },
    onPanResponderMove: (_, g) => {
      const nextRotation = clamp(dragStart.current.rotation + g.dx * 0.35, -90, 90);
      const nextDepth = clamp(dragStart.current.depth - g.dy * 0.01, -1, 1);
      set({
        viewRotation: Number(nextRotation.toFixed(2)),
        viewDepth: Number(nextDepth.toFixed(2)),
      });
    },
  });

  return (
    <ScrollView contentContainerStyle={{ gap: 12 }}>
      <Text style={[styles.title, { color: theme.colors.primary }]}>DENTISTRY 3D WORKSPACE</Text>

      <View style={styles.toolsWrap}>
        {TOOL_OPTIONS.map((tool) => {
          const active = tool.key === activeTool;
          return (
            <TouchableOpacity
              key={tool.key}
              onPress={() => set({ activeTool: tool.key })}
              style={[
                styles.toolBtn,
                {
                  borderColor: STATUS_COLOR[tool.key],
                  backgroundColor: active ? STATUS_COLOR[tool.key] : theme.colors.surface,
                },
              ]}
            >
              <Text style={[styles.toolText, { color: active ? "#fff" : STATUS_COLOR[tool.key] }]}>{tool.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Mouth3DPreview
        theme={theme}
        rotation={value.viewRotation ?? 0}
        zoom={value.viewZoom ?? 1}
        depth={value.viewDepth ?? 0}
        teeth={teeth}
        panHandlers={panResponder.panHandlers}
        onReset={reset3D}
      />

      <View style={[styles.renderCard, { borderColor: theme.colors.primary }]}> 
        <Text style={styles.renderTitle}>Oral View (interactive dental map)</Text>

        <View style={styles.archWrap}>
          {UPPER_TEETH.map((tooth) => (
            <ToothCell
              key={tooth}
              theme={theme}
              tooth={tooth}
              status={getStatus(tooth)}
              active={activeTool === getStatus(tooth)}
              onPress={() => paintTooth(tooth)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.archWrap}>
          {LOWER_TEETH.map((tooth) => (
            <ToothCell
              key={tooth}
              theme={theme}
              tooth={tooth}
              status={getStatus(tooth)}
              active={activeTool === getStatus(tooth)}
              onPress={() => paintTooth(tooth)}
            />
          ))}
        </View>

        <View style={styles.controlsRow}>
          <NumberAdjuster
            theme={theme}
            label="Rotate"
            value={value.viewRotation ?? 0}
            min={-90}
            max={90}
            step={5}
            onChange={(next) => set({ viewRotation: next })}
          />
          <NumberAdjuster
            theme={theme}
            label="Zoom"
            value={value.viewZoom ?? 1}
            min={0.5}
            max={2.5}
            step={0.1}
            onChange={(next) => set({ viewZoom: next })}
          />
          <NumberAdjuster
            theme={theme}
            label="Depth"
            value={value.viewDepth ?? 0}
            min={-1}
            max={1}
            step={0.1}
            onChange={(next) => set({ viewDepth: next })}
          />
        </View>
      </View>

      <View style={styles.row}>
        <BlueField
          theme={theme}
          label="Chief complaint"
          value={value.chiefComplaint ?? ""}
          onChange={(v: string) => set({ chiefComplaint: v })}
          multiline
          minHeight={70}
        />
        <BlueField
          theme={theme}
          label="Gingiva status"
          value={value.gumStatus ?? ""}
          onChange={(v: string) => set({ gumStatus: v })}
          minHeight={70}
        />
      </View>

      <View style={styles.row}>
        <BlueField
          theme={theme}
          label="Plaque index"
          value={value.plaqueIndex ?? ""}
          onChange={(v: string) => set({ plaqueIndex: v })}
          minHeight={60}
        />
        <BlueField
          theme={theme}
          label="Occlusion notes"
          value={value.occlusionNotes ?? ""}
          onChange={(v: string) => set({ occlusionNotes: v })}
          multiline
          minHeight={70}
        />
      </View>

      <BlueField
        theme={theme}
        label="Treatment plan"
        value={value.treatmentPlan ?? ""}
        onChange={(v: string) => set({ treatmentPlan: v })}
        multiline
        minHeight={90}
      />
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
  title: { fontWeight: "900" },
  toolsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toolBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolText: {
    fontWeight: "900",
    fontSize: 12,
  },
  renderCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: theme.colors.surface,
  },
  renderTitle: {
    fontWeight: "900",
    opacity: 0.78,
  },
  archWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  tooth: {
    width: 44,
    minHeight: 42,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 4,
  },
  toothId: {
    fontWeight: "900",
    fontSize: 11,
  },
  toothDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  controlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  adjustWrap: {
    flex: 1,
    minWidth: 160,
    gap: 6,
  },
  adjustLabel: {
    fontWeight: "900",
    fontSize: 12,
  },
  adjustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adjustBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceVariant,
  },
  adjustBtnText: {
    fontWeight: "900",
    fontSize: 16,
  },
  adjustValueBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceVariant,
  },
  adjustValueText: {
    fontWeight: "900",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
});

// Not a route screen; keep router scanning happy.
export default function DentistryRoute() {
  return null;
}
