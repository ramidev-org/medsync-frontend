import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";

export function XrayViewer({
  theme,
  xrays,
  onChange,
}: {
  theme: any;
  xrays: string[];
  onChange: (next: string[]) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [active, setActive] = React.useState<string | null>(xrays[0] ?? null);

  React.useEffect(() => {
    if (active && xrays.includes(active)) return;
    setActive(xrays[0] ?? null);
  }, [active, xrays]);

  const remove = (uri: string) => onChange(xrays.filter((x) => x !== uri));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Dental X‑ray viewer</Text>
      <Text style={styles.subtitle}>Paste X‑ray image URIs below (one per line). Tap a thumbnail to preview.</Text>

      {active ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: active }} style={styles.preview} contentFit="contain" />
        </View>
      ) : (
        <View style={styles.previewWrap}>
          <Text style={styles.empty}>No X‑ray selected.</Text>
        </View>
      )}

      {xrays.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {xrays.map((uri) => {
            const isActive = uri === active;
            return (
              <View key={uri} style={styles.thumbItem}>
                <TouchableOpacity onPress={() => setActive(uri)} style={[styles.thumbBtn, isActive && styles.thumbBtnActive]}>
                  <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(uri)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 12,
      gap: 10,
      backgroundColor: theme.colors.surface,
    },
    title: { fontWeight: "900", color: theme.colors.primary },
    subtitle: { fontWeight: "800", opacity: 0.7 },
    previewWrap: {
      height: 220,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: "center",
      justifyContent: "center",
    },
    preview: { width: "100%", height: "100%" },
    empty: { fontWeight: "800", opacity: 0.6 },
    thumbRow: { gap: 10, paddingTop: 2, paddingBottom: 2 },
    thumbItem: { width: 110, gap: 6 },
    thumbBtn: {
      width: 110,
      height: 80,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceVariant,
    },
    thumbBtnActive: { borderColor: theme.colors.primary },
    thumbImg: { width: "100%", height: "100%" },
    removeBtn: {
      alignSelf: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceVariant,
    },
    removeText: { fontWeight: "900", fontSize: 12, opacity: 0.85 },
  });

