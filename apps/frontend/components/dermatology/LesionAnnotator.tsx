import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

type Point = { id: string; x: number; y: number; createdAtIso: string };

function makeId() {
  return `lesionpt_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function LesionAnnotator({ theme }: { theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [imageUrl, setImageUrl] = React.useState("");
  const [points, setPoints] = React.useState<Point[]>([]);
  const [box, setBox] = React.useState<{ w: number; h: number }>({ w: 1, h: 1 });
  const hasImage = !!imageUrl.trim();

  const addPoint = (x: number, y: number) => {
    setPoints((list) => [...list, { id: makeId(), x, y, createdAtIso: new Date().toISOString() }]);
  };

  const removePoint = (id: string) => setPoints((list) => list.filter((x) => x.id !== id));

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.titleRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="image-marker-outline" size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Lesion marker</Text>
      </View>

      <View style={styles.row}>
        <TextInput
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="Paste image URL..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { flex: 1, minWidth: 320 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setPoints([])} style={styles.btn}>
          <Text style={styles.btnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <MaterialCommunityIcons name="crosshairs-gps" size={13} color={theme.colors.textSecondary} />
          <Text style={styles.metaText}>{points.length} markers</Text>
        </View>
        <View style={styles.metaChip}>
          <MaterialCommunityIcons
            name={hasImage ? "check-decagram-outline" : "alert-circle-outline"}
            size={13}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.metaText}>{hasImage ? "Image loaded" : "Using placeholder"}</Text>
        </View>
      </View>

      <View
        style={styles.canvasWrap}
        onLayout={(e) => {
          setBox({
            w: Math.max(1, e.nativeEvent.layout.width),
            h: Math.max(1, e.nativeEvent.layout.height),
          });
        }}
      >
        <Image
          source={
            hasImage
              ? { uri: imageUrl.trim() }
              : { uri: "https://placehold.co/900x520/eef2ff/24324a?text=Clinical+Photo" }
          }
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
        <Svg width="100%" height="100%" viewBox={`0 0 ${box.w} ${box.h}`} style={StyleSheet.absoluteFill}>
          {points.map((point) => (
            <Circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={7}
              fill={theme.colors.primary}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Svg>

        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            const y = e.nativeEvent.locationY;
            const picked =
              points
                .slice()
                .reverse()
                .find((point) => {
                  const dx = point.x - x;
                  const dy = point.y - y;
                  return dx * dx + dy * dy <= 12 * 12;
                }) ?? null;

            if (picked) removePoint(picked.id);
            else addPoint(x, y);
          }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Text style={styles.hint}>Tap to add a point. Tap a point to remove it.</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    title: { fontWeight: "700", color: theme.colors.text },
    row: { flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" },
    metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      backgroundColor: theme.colors.background,
    },
    metaText: { fontWeight: "600", color: theme.colors.textSecondary, fontSize: 12 },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontWeight: "600",
      color: theme.colors.text,
    },
    btn: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.colors.surface,
    },
    btnText: { fontWeight: "700", color: theme.colors.primary },
    canvasWrap: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      height: 520,
      position: "relative",
    },
    hint: { fontWeight: "700", color: theme.colors.textSecondary },
  });

