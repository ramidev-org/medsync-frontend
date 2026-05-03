import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type TimelinePhoto = { id: string; uri: string; createdAtIso: string; note?: string };

function makeId() {
  return `photo_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function PhotoTimeline({
  theme,
  photos,
  onChange,
}: {
  theme: any;
  photos: TimelinePhoto[];
  onChange: (next: TimelinePhoto[]) => void;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [draftUrl, setDraftUrl] = React.useState("");
  const [draftNote, setDraftNote] = React.useState("");

  const add = () => {
    const uri = draftUrl.trim();
    if (!uri) return;
    onChange([
      ...(photos || []),
      {
        id: makeId(),
        uri,
        note: draftNote.trim() ? draftNote.trim() : undefined,
        createdAtIso: new Date().toISOString(),
      },
    ]);
    setDraftUrl("");
    setDraftNote("");
  };

  const remove = (id: string) => onChange((photos || []).filter((photo) => photo.id !== id));
  const sorted = (photos || []).slice().sort((a, b) => String(b.createdAtIso).localeCompare(String(a.createdAtIso)));

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.titleRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="timeline-text-outline" size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Photo timeline</Text>
      </View>

      <View style={styles.row}>
        <TextInput
          value={draftUrl}
          onChangeText={setDraftUrl}
          placeholder="Image URL..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { flex: 1, minWidth: 280 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          value={draftNote}
          onChangeText={setDraftNote}
          placeholder="Note (optional)..."
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { flex: 1, minWidth: 220 }]}
        />
        <TouchableOpacity onPress={add} style={styles.btn}>
          <Text style={styles.btnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timelineWrap}>
        {sorted.map((photo, idx) => (
          <View key={photo.id} style={styles.itemRow}>
            <View style={styles.railCol}>
              <View style={styles.dot} />
              {idx < sorted.length - 1 && <View style={styles.rail} />}
            </View>

            <View style={styles.card}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{new Date(photo.createdAtIso).toLocaleString()}</Text>
                {!!photo.note && <Text style={styles.cardNote}>{photo.note}</Text>}
                <TouchableOpacity onPress={() => remove(photo.id)} style={styles.removeBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {sorted.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="camera-plus-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No photos yet.</Text>
          </View>
        )}
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
    title: { fontWeight: "900", color: theme.colors.text },
    row: { flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontWeight: "800",
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
    btnText: { fontWeight: "900", color: theme.colors.primary },

    timelineWrap: { gap: 10, marginTop: 2 },
    itemRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
    railCol: { width: 18, alignItems: "center" },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary, marginTop: 16 },
    rail: { width: 2, flex: 1, marginTop: 4, backgroundColor: `${theme.colors.primary}33` },

    card: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      padding: 12,
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    thumb: { width: 108, height: 76, borderRadius: 10, backgroundColor: theme.colors.background },
    cardTitle: { fontWeight: "900", color: theme.colors.text, fontSize: 13 },
    cardNote: { marginTop: 4, fontWeight: "700", color: theme.colors.textSecondary, fontSize: 12 },
    removeBtn: {
      marginTop: 10,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    removeText: { fontWeight: "900", color: theme.colors.textSecondary },
    empty: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    emptyText: { fontWeight: "800", color: theme.colors.textSecondary },
  });

