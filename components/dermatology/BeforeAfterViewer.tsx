import React from "react";
import { PanResponder, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function BeforeAfterViewer({ theme }: { theme: any }) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [beforeUrl, setBeforeUrl] = React.useState("");
  const [afterUrl, setAfterUrl] = React.useState("");
  const [wrapW, setWrapW] = React.useState(1);
  const [percent, setPercent] = React.useState(0.5);

  const handleX = percent * wrapW;
  const percentLabel = `${Math.round(percent * 100)}%`;

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          const p = Math.max(0, Math.min(1, x / Math.max(1, wrapW)));
          setPercent(p);
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          const p = Math.max(0, Math.min(1, x / Math.max(1, wrapW)));
          setPercent(p);
        },
      }),
    [wrapW],
  );

  const beforeSrc = beforeUrl.trim()
    ? { uri: beforeUrl.trim() }
    : { uri: "https://placehold.co/900x520/eef2ff/24324a?text=Before" };
  const afterSrc = afterUrl.trim()
    ? { uri: afterUrl.trim() }
    : { uri: "https://placehold.co/900x520/f8f9ff/24324a?text=After" };

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.titleRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="compare-horizontal" size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Before / after</Text>
      </View>

      <View style={styles.row}>
        <TextInput
          value={beforeUrl}
          onChangeText={setBeforeUrl}
          placeholder="Before image URL..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { flex: 1, minWidth: 260 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          value={afterUrl}
          onChangeText={setAfterUrl}
          placeholder="After image URL..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { flex: 1, minWidth: 260 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View
        style={styles.viewerWrap}
        onLayout={(e) => setWrapW(Math.max(1, e.nativeEvent.layout.width))}
        {...panResponder.panHandlers}
      >
        <Image source={afterSrc} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={{ width: `${Math.round(percent * 100)}%`, height: "100%", overflow: "hidden" }}>
          <Image source={beforeSrc} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Before</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>After</Text>
          </View>
        </View>

        <View style={[styles.percentBubble, { left: Math.max(6, Math.min(wrapW - 64, handleX - 28)) }]}>
          <Text style={styles.percentText}>{percentLabel}</Text>
        </View>
        <View style={[styles.handleLine, { left: handleX - 1 }]} />
        <View style={[styles.handleDot, { left: handleX - 14 }]}>
          <MaterialCommunityIcons name="drag-horizontal-variant" size={16} color={theme.colors.primary} />
        </View>
      </View>
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
    viewerWrap: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
      height: 520,
      position: "relative",
    },
    badgeRow: { position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between" },
    badge: { borderWidth: 1, borderColor: `${theme.colors.border}`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: `${theme.colors.surface}dd` as any },
    badgeText: { fontWeight: "700", color: theme.colors.text, fontSize: 11 },
    percentBubble: { position: "absolute", top: 42, width: 56, height: 24, borderRadius: 12, backgroundColor: `${theme.colors.surface}f0` as any, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
    percentText: { fontWeight: "700", color: theme.colors.text, fontSize: 11 },
    handleLine: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: theme.colors.primary },
    handleDot: {
      position: "absolute",
      top: 18,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });

