import {
  createConsultationDocument,
  deleteConsultationDocument,
  getConsultationDocuments,
} from "@/services/consultation-documents.services";
import type { ConsultationDocumentRow } from "@/services/backend.types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DocDraft = {
  name: string;
  kind: string;
  url: string;
  notes: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DocumentsTab({
  theme,
  consultationId,
  patientId,
  requesterId,
}: {
  theme: any;
  consultationId: string;
  patientId: string;
  requesterId?: string;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [docs, setDocs] = React.useState<ConsultationDocumentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DocDraft>({
    name: "",
    kind: "PDF",
    url: "",
    notes: "",
  });

  const load = React.useCallback(async () => {
    if (!requesterId || !consultationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await getConsultationDocuments({
        requesterId,
        consultationId,
      });
      setDocs(rows);
    } catch (err) {
      console.error("Failed to load consultation documents:", err);
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [consultationId, requesterId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const addDoc = async () => {
    if (!requesterId || !draft.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const row = await createConsultationDocument({
        requesterId,
        consultationId,
        patientId,
        name: draft.name.trim(),
        kind: draft.kind.trim() || "PDF",
        notes: draft.notes.trim() || null,
        url: draft.url.trim() || null,
        title: draft.name.trim(),
      });
      setDocs((prev) => [row, ...prev]);
      setDraft({ name: "", kind: "PDF", url: "", notes: "" });
    } catch (err) {
      console.error("Failed to create consultation document:", err);
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!requesterId) return;
    const previous = docs;
    setDocs((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteConsultationDocument({ requesterId, documentId: id });
    } catch (err) {
      console.error("Failed to delete consultation document:", err);
      setDocs(previous);
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  return (
    <View style={styles.flatRoot}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Documents</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={load}>
          <Ionicons name="refresh-outline" size={18} color={theme.colors.textOnPrimary} />
          <Text style={styles.primaryText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Add a document record</Text>
        <View style={styles.formGrid}>
          <Field
            theme={theme}
            label="Name"
            value={draft.name}
            onChangeText={(value) => setDraft((prev) => ({ ...prev, name: value }))}
          />
          <Field
            theme={theme}
            label="Type"
            value={draft.kind}
            onChangeText={(value) => setDraft((prev) => ({ ...prev, kind: value }))}
          />
          <Field
            theme={theme}
            label="Link / URL"
            value={draft.url}
            onChangeText={(value) => setDraft((prev) => ({ ...prev, url: value }))}
          />
        </View>
        <Field
          theme={theme}
          label="Notes"
          value={draft.notes}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, notes: value }))}
          multiline
        />
        <TouchableOpacity
          style={[styles.createBtn, saving && { opacity: 0.7 }]}
          onPress={addDoc}
          disabled={saving}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.textOnPrimary} />
          <Text style={styles.createBtnText}>{saving ? "Saving..." : "Save Document"}</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Name</Text>
        <Text style={[styles.th, { flex: 1 }]}>Type</Text>
        <Text style={[styles.th, { flex: 1.3 }]}>Date</Text>
        <Text style={[styles.th, { width: 110, textAlign: "right" }]}>Actions</Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading consultation documents…</Text>
        </View>
      ) : null}

      {!loading && !docs.length ? (
        <Text style={styles.emptyText}>
          No documents saved for this consultation yet.
        </Text>
      ) : null}

      {docs.map((d) => (
        <View key={d.id} style={styles.row}>
          <View style={{ flex: 2 }}>
            <Text style={[styles.td, { fontWeight: "900" }]}>{d.title || d.name}</Text>
            {d.notes ? <Text style={styles.subText}>{d.notes}</Text> : null}
          </View>
          <Text style={[styles.td, { flex: 1 }]}>{d.kind}</Text>
          <Text style={[styles.td, { flex: 1.3 }]}>{formatDate(d.created_at)}</Text>

          <View style={{ width: 110, flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                if (d.url) Linking.openURL(d.url);
              }}
              disabled={!d.url}
              style={{ opacity: d.url ? 1 : 0.35 }}
            >
              <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => remove(d.id)}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

function Field({
  theme,
  label,
  value,
  onChangeText,
  multiline,
}: {
  theme: any;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={{ flex: 1, minWidth: 180 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800", marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={{
          minHeight: multiline ? 84 : 42,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: theme.colors.text,
          backgroundColor: theme.colors.background,
          fontWeight: "700",
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    flatRoot: { backgroundColor: "transparent", gap: 12 },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    title: { fontSize: 16, fontWeight: "900" },
    primaryBtn: {
      backgroundColor: theme.colors.info,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    primaryText: { color: theme.colors.textOnPrimary, fontWeight: "900" },
    formCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      padding: 14,
      gap: 12,
    },
    formTitle: { fontWeight: "900", color: theme.colors.text },
    formGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    createBtn: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    createBtnText: { color: theme.colors.textOnPrimary, fontWeight: "900" },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: `${theme.colors.error}33`,
      borderRadius: 10,
      backgroundColor: `${theme.colors.error}10`,
      padding: 10,
    },
    errorText: { color: theme.colors.error, fontWeight: "800" },
    tableHeader: {
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    th: { fontWeight: "900", opacity: 0.7 },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    loadingText: { color: theme.colors.textSecondary, fontWeight: "800" },
    emptyText: { color: theme.colors.textSecondary, fontWeight: "700" },
    row: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    td: { fontWeight: "800", opacity: 0.85, color: theme.colors.text },
    subText: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: "700",
    },
  });
