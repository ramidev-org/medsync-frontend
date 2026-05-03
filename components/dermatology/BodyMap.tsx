import React from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle, Line, Path } from "react-native-svg";
import type { BodySide, LesionMarker } from "./types";

const VIEWBOX_W = 100;
const VIEWBOX_H = 200;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeId() {
  return `lesion_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function BodyMap({
  theme,
  side,
  markers,
  onChangeSide,
  onChangeMarkers,
}: {
  theme: any;
  side: BodySide;
  markers: LesionMarker[];
  onChangeSide: (next: BodySide) => void;
  onChangeMarkers: (next: LesionMarker[]) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const visibleMarkers = (markers || []).filter((m) => m.side === side);

  const addMarker = (x: number, y: number) => {
    const next: LesionMarker = {
      id: makeId(),
      side,
      x: clamp(x, 0, VIEWBOX_W),
      y: clamp(y, 0, VIEWBOX_H),
      color: theme.colors.primary,
      createdAtIso: new Date().toISOString(),
    };
    onChangeMarkers([...(markers || []), next]);
  };

  const removeMarker = (id: string) => onChangeMarkers((markers || []).filter((m) => m.id !== id));
  const clearSide = () => onChangeMarkers((markers || []).filter((m) => m.side !== side));

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="human-male" size={16} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Body map</Text>
        </View>
        <View style={styles.sideRow}>
          <Pressable
            onPress={() => onChangeSide("front")}
            style={[styles.chip, side === "front" && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft }]}
          >
            <Text style={[styles.chipText, { color: side === "front" ? theme.colors.primary : theme.colors.textSecondary }]}>Front</Text>
          </Pressable>
          <Pressable
            onPress={() => onChangeSide("back")}
            style={[styles.chip, side === "back" && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft }]}
          >
            <Text style={[styles.chipText, { color: side === "back" ? theme.colors.primary : theme.colors.textSecondary }]}>Back</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <MaterialCommunityIcons name="map-marker-radius" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.metaText}>{visibleMarkers.length} markers</Text>
        </View>
        <TouchableOpacity onPress={clearSide} style={styles.clearBtn}>
          <MaterialCommunityIcons name="delete-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.clearText}>Clear side</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.canvasWrap}>
        <Svg width="100%" height={520} viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
          <Line x1="50" y1="0" x2="50" y2="200" stroke={theme.colors.border} strokeWidth={0.6} strokeDasharray="2 2" />
          <Path
            d={
              side === "front"
                ? "M50 7 C42 7 36.5 13 36.5 21 C36.5 30 42 36.5 50 36.5 C58 36.5 63.5 30 63.5 21 C63.5 13 58 7 50 7 Z M30 54 C33 47 40 43 50 43 C60 43 67 47 70 54 C72.5 60 73.5 67 73 76 C72 94 66 111 64 125 C63.2 130 63.5 136 64.5 143 L67 162 C67.7 167 65.1 172 60.4 174.5 C57.2 176.3 54.2 178.1 52 182 L52 196 L48 196 L48 182 C45.8 178.1 42.8 176.3 39.6 174.5 C34.9 172 32.3 167 33 162 L35.5 143 C36.5 136 36.8 130 36 125 C34 111 28 94 27 76 C26.5 67 27.5 60 30 54 Z M30 61 L23 95 M70 61 L77 95"
                : "M50 7 C42 7 36.5 13 36.5 21 C36.5 30 42 36.5 50 36.5 C58 36.5 63.5 30 63.5 21 C63.5 13 58 7 50 7 Z M30 54 C33 47 40 43 50 43 C60 43 67 47 70 54 C72.5 60 73.5 67 73 76 C72 94 66 111 64 125 C63.2 130 63.5 136 64.5 143 L67 162 C67.7 167 65.1 172 60.4 174.5 C57.2 176.3 54.2 178.1 52 182 L52 196 L48 196 L48 182 C45.8 178.1 42.8 176.3 39.6 174.5 C34.9 172 32.3 167 33 162 L35.5 143 C36.5 136 36.8 130 36 125 C34 111 28 94 27 76 C26.5 67 27.5 60 30 54 Z M34 52 C38 58 43 61 50 61 C57 61 62 58 66 52"
            }
            fill={theme.colors.background}
            stroke={theme.colors.border}
            strokeWidth={1.5}
          />

          {visibleMarkers.map((m) => (
            <Circle key={m.id} cx={m.x} cy={m.y} r={4} fill={m.color || theme.colors.primary} stroke={theme.colors.surface} strokeWidth={1.8} />
          ))}
        </Svg>

        <BodyMapPressLayer
          markers={visibleMarkers}
          onAdd={addMarker}
          onRemove={removeMarker}
        />
      </View>

      <Text style={styles.hint}>
        Tap to add a marker. Tap an existing marker to remove it.
      </Text>
    </View>
  );
}

function BodyMapPressLayer({
  markers,
  onAdd,
  onRemove,
}: {
  markers: LesionMarker[];
  onAdd: (x: number, y: number) => void;
  onRemove: (id: string) => void;
}) {
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 1, h: 1 });
  return (
    <Pressable
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width || 1, h: e.nativeEvent.layout.height || 1 })}
      onPress={(e) => {
        const x = (e.nativeEvent.locationX / size.w) * VIEWBOX_W;
        const y = (e.nativeEvent.locationY / size.h) * VIEWBOX_H;
        const picked = markers
          .slice()
          .reverse()
          .find((m) => {
            const dx = m.x - x;
            const dy = m.y - y;
            return dx * dx + dy * dy <= 7 * 7;
          });

        if (picked) onRemove(picked.id);
        else onAdd(x, y);
      }}
      style={StyleSheet.absoluteFill}
    />
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    titleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border },
    title: { fontWeight: "900", color: theme.colors.text },
    sideRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
    chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surface },
    chipText: { fontWeight: "900", fontSize: 12 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
    metaChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, backgroundColor: theme.colors.background },
    metaText: { fontWeight: "800", color: theme.colors.textSecondary, fontSize: 12 },
    clearBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: `${theme.colors.primary}55`, borderRadius: 999, backgroundColor: `${theme.colors.primary}12` },
    clearText: { fontWeight: "900", color: theme.colors.primary, fontSize: 12 },
    canvasWrap: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, overflow: "hidden", backgroundColor: theme.colors.surface, position: "relative" },
    hint: { fontWeight: "700", color: theme.colors.textSecondary },
  });
