import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type LetterTemplate = {
  id: string;
  name: string;
  content: (ctx: any) => string;
};

export default function LettresTab({
  theme,
  patient,
  doctor,
  consultationSummary,
}: {
  theme: any;
  patient: any;
  doctor: any;
  consultationSummary: { observations: string; conclusion: string };
}) {
  const styles = createStyles(theme);

  const templates: LetterTemplate[] = useMemo(
    () => [
      {
        id: "lt1",
        name: "Lettre d’orientation",
        content: ({ patient, doctor, summary }: any) =>
          `Je soussigné(e) ${doctor?.nom_complet || "Dr"} (${doctor?.specialite || ""}),\n` +
          `oriente le patient ${patient?.first_name} ${patient?.last_name}, ${patient?.age} ans,\n` +
          `pour avis spécialisé.\n\n` +
          `Motif / observations : ${summary.observations || "—"}\n` +
          `Conclusion : ${summary.conclusion || "—"}\n\n` +
          `Signature : ${doctor?.signature_numerique || "Dr"}`,
      },
      {
        id: "lt2",
        name: "Compte rendu",
        content: ({ patient, doctor, summary }: any) =>
          `COMPTE RENDU DE CONSULTATION\n\n` +
          `Patient : ${patient?.first_name} ${patient?.last_name}\n` +
          `Médecin : ${doctor?.nom_complet || "Dr"}\n\n` +
          `Observations : ${summary.observations || "—"}\n` +
          `Conclusion : ${summary.conclusion || "—"}\n\n` +
          `Signature : ${doctor?.signature_numerique || "Dr"}`,
      },
      {
        id: "lt3",
        name: "Lettre de suivi",
        content: ({ patient, doctor }: any) =>
          `Lettre de suivi\n\n` +
          `Patient : ${patient?.first_name} ${patient?.last_name}\n` +
          `Recommandations :\n- Suivi clinique\n- Contrôle biologique si nécessaire\n\n` +
          `Signature : ${doctor?.signature_numerique || "Dr"}`,
      },
    ],
    [doctor, patient, consultationSummary]
  );

  const [selectedId, setSelectedId] = useState<string>(templates[0].id);

  const initialText = useMemo(() => {
    const t = templates.find((x) => x.id === selectedId)!;
    return t.content({ patient, doctor, summary: consultationSummary });
  }, [selectedId, templates, patient, doctor, consultationSummary]);

  const [text, setText] = useState(initialText);

  const printLetter = () => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!popup) return;
    popup.document.write(`<pre style="font-family: ui-monospace, monospace; white-space: pre-wrap; padding: 24px;">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const saveLetter = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${templates.find((item) => item.id === selectedId)?.name || "letter"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // keep editor in sync when switching template
  const switchTemplate = (id: string) => {
    setSelectedId(id);
    const t = templates.find((x) => x.id === id)!;
    setText(t.content({ patient, doctor, summary: consultationSummary }));
  };

  return (
    <View style={styles.flatRoot}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Lettres</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={printLetter}
          >
            <Ionicons name="print-outline" size={16} color={theme.colors.info} />
            <Text style={[styles.outlineText, { color: theme.colors.info }]}>IMPRIMER</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={saveLetter}
          >
            <Ionicons name="save-outline" size={16} color={theme.colors.textOnPrimary} />
            <Text style={styles.primaryText}>SAUVEGARDER</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {/* left template list */}
        <View style={styles.left}>
          <Text style={styles.sideTitle}>Modèles</Text>
          {templates.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => switchTemplate(t.id)}
              style={[
                styles.templateItem,
                { borderColor: selectedId === t.id ? theme.colors.info : theme.colors.border },
                selectedId === t.id && styles.templateActive,
              ]}
            >
              <Text style={[styles.templateText, selectedId === t.id && { color: theme.colors.textOnPrimary }]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* right editor */}
        <View style={styles.right}>
          <Text style={styles.sideTitle}>Éditeur</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            style={[
              styles.editor,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    flatRoot: { backgroundColor: "transparent" },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    title: { fontSize: 16, fontWeight: "900" },

    primaryBtn: {
      backgroundColor: theme.colors.info,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    primaryText: { color: theme.colors.textOnPrimary, fontWeight: "900" },

    outlineBtn: {
      borderWidth: 2,
      borderColor: theme.colors.info,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    outlineText: { fontWeight: "900" },

    body: { marginTop: 14, flexDirection: "row", gap: 12, flexWrap: "wrap" },

    left: { width: 260, minWidth: 220, gap: 10 },
    right: { flex: 1, minWidth: 320 },

    sideTitle: { fontWeight: "900", marginBottom: 8, opacity: 0.8 },

    templateItem: {
      borderWidth: 2,
      borderRadius: 10,
      padding: 12,
      backgroundColor: theme.colors.surface,
    },
    templateActive: { backgroundColor: theme.colors.info },
    templateText: { fontWeight: "900" },

    editor: {
      borderWidth: 2,
      borderRadius: 10,
      padding: 12,
      minHeight: 320,
      textAlignVertical: "top",
    },
  });
