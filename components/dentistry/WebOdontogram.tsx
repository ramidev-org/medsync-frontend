import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Odontogram, type ToothDetail } from "react-odontogram";

import { OdontogramState, PROCEDURES, ProcedureKey } from "./odontogram";
import { reactOdontogramCss } from "./reactOdontogramCss";

type ToothConditionGroup = {
  label: string;
  teeth: string[];
  outlineColor: string;
  fillColor: string;
};

function toothProcedureFromState(state: OdontogramState, tooth: string): ProcedureKey | undefined {
  const surfaces = Object.values(state[tooth] ?? {});
  const procs = surfaces.map((s) => s?.procedure).filter(Boolean) as ProcedureKey[];
  if (procs.includes("extraction")) return "extraction";
  if (procs.includes("caries")) return "caries";
  if (procs.includes("root_canal")) return "root_canal";
  if (procs.includes("crown")) return "crown";
  if (procs.includes("implant")) return "implant";
  if (procs.includes("filling")) return "filling";
  if (procs.includes("sealant")) return "sealant";
  if (procs.includes("watch")) return "watch";
  if (procs.includes("other")) return "other";
  if (procs.includes("healthy")) return "healthy";
  return undefined;
}

function buildConditions(state: OdontogramState): ToothConditionGroup[] {
  const byProc = new Map<ProcedureKey, string[]>();
  for (const tooth of Object.keys(state)) {
    const p = toothProcedureFromState(state, tooth);
    if (!p) continue;
    const id = `teeth-${tooth}`;
    byProc.set(p, [...(byProc.get(p) ?? []), id]);
  }

  const asGroup = (p: ProcedureKey): ToothConditionGroup | null => {
    const teeth = byProc.get(p);
    if (!teeth || teeth.length === 0) return null;
    const meta = PROCEDURES.find((x) => x.key === p);
    const fillColor = meta?.color ?? "#111827";
    return { label: meta?.label ?? p, teeth, fillColor, outlineColor: fillColor };
  };

  const order: ProcedureKey[] = ["caries", "filling", "crown", "root_canal", "extraction", "implant", "sealant", "watch", "other", "healthy"];
  return order.map(asGroup).filter(Boolean) as ToothConditionGroup[];
}

export function WebOdontogram({
  themeMode,
  odontogram,
  defaultSelected,
  onSelectionChange,
  readOnly,
  maxWidth,
  splitUpperLower,
}: {
  themeMode: "light" | "dark";
  odontogram: OdontogramState;
  defaultSelected?: string[];
  onSelectionChange: (selectedFdi: string[]) => void;
  readOnly?: boolean;
  maxWidth?: number;
  splitUpperLower?: boolean;
}) {
  const styles = React.useMemo(() => createStyles(), []);

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const styleId = "react-odontogram-css";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = reactOdontogramCss;
    document.head.appendChild(style);
  }, []);

  const conditions = React.useMemo(() => buildConditions(odontogram), [odontogram]);

  const toFdi = (t: ToothDetail) => (t.id || "").replace(/^teeth-/, "");

  const handleChange = (selected: ToothDetail[]) => {
    onSelectionChange((selected ?? []).map(toFdi).filter(Boolean));
  };

  const isUpper = (toothId: string) => {
    const fdi = toothId.replace(/^teeth-/, "");
    const q = fdi[0];
    return q === "1" || q === "2";
  };

  const upperDefault = React.useMemo(
    () => (defaultSelected ?? []).filter(isUpper),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultSelected?.join("|")],
  );
  const lowerDefault = React.useMemo(
    () =>
      (defaultSelected ?? [])
        .filter((t) => !isUpper(t))
        // showHalf="lower" expects quadrant 1/2 ids, so map 3/4 -> 2/1
        .map((t) => {
          const fdi = t.replace(/^teeth-/, "");
          if (fdi.length !== 2) return t;
          const q = fdi[0];
          const n = fdi[1];
          if (q === "3") return `teeth-2${n}`;
          if (q === "4") return `teeth-1${n}`;
          return t;
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultSelected?.join("|")],
  );

  const upperRef = React.useRef<string[]>(upperDefault.map((t) => t.replace(/^teeth-/, "")));
  const lowerRef = React.useRef<string[]>(lowerDefault.map((t) => t.replace(/^teeth-/, "")));

  React.useEffect(() => {
    upperRef.current = upperDefault.map((t) => t.replace(/^teeth-/, ""));
    lowerRef.current = lowerDefault.map((t) => t.replace(/^teeth-/, ""));
  }, [upperDefault, lowerDefault]);

  const handleUpperChange = (selected: ToothDetail[]) => {
    const upper = (selected ?? []).map(toFdi).filter(Boolean);
    upperRef.current = upper;
    onSelectionChange([...upper, ...lowerRef.current]);
  };

  const handleLowerChange = (selected: ToothDetail[]) => {
    // react-odontogram reuses quadrant indices for showHalf="lower" (1/2 instead of 3/4).
    // Remap 1x->4x and 2x->3x to match real FDI.
    const raw = (selected ?? []).map(toFdi).filter(Boolean);
    const remapped = raw.map((fdi) => {
      if (fdi.length !== 2) return fdi;
      const q = fdi[0];
      const n = fdi[1];
      if (q === "1") return `4${n}`;
      if (q === "2") return `3${n}`;
      return fdi;
    });
    lowerRef.current = remapped;
    onSelectionChange([...upperRef.current, ...remapped]);
  };

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      {splitUpperLower ? (
        <View
          style={{
            width: "100%",
            maxWidth: maxWidth ?? 760,
            flexDirection: "row",
            gap: 16,
            flexWrap: "nowrap",
            justifyContent: "space-between",
            ...(Platform.OS === "web" ? ({ overflowX: "auto" } as any) : null),
          }}
        >
          <View style={{ flex: 1, minWidth: 420 }}>
            <Text style={styles.archLabel}>Upper (Maxillary)</Text>
            <Odontogram
              key={`upper:${upperDefault.slice().sort().join("|")}`}
              theme={themeMode}
              showHalf="upper"
              name="teeth-upper"
              defaultSelected={upperDefault}
              onChange={handleUpperChange}
              teethConditions={conditions}
              showLabels={false}
              readOnly={!!readOnly}
              styles={{ width: "100%", maxWidth: 520, margin: 0 }}
            />
          </View>
          <View style={{ flex: 1, minWidth: 420 }}>
            <Text style={styles.archLabel}>Lower (Mandibular)</Text>
            <Odontogram
              key={`lower:${lowerDefault.slice().sort().join("|")}`}
              theme={themeMode}
              showHalf="lower"
              name="teeth-lower"
              defaultSelected={lowerDefault}
              onChange={handleLowerChange}
              teethConditions={conditions}
              showLabels={false}
              readOnly={!!readOnly}
              styles={{ width: "100%", maxWidth: 520, margin: 0 }}
            />
          </View>
        </View>
      ) : (
        <Odontogram
          key={(defaultSelected ?? []).slice().sort().join("|")}
          theme={themeMode}
          defaultSelected={defaultSelected ?? []}
          onChange={handleChange}
          teethConditions={conditions}
          showLabels
          readOnly={!!readOnly}
          styles={{ maxWidth: maxWidth ?? 760, width: "100%" }}
        />
      )}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    archLabel: { fontWeight: "900", opacity: 0.8, marginBottom: 8 },
  });
