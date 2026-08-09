import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type LetterContext = { patient: any; doctor: any; summary: { observations: string; conclusion: string } };
type LetterTemplate = { id: string; name: string; subject: string; build: (context: LetterContext) => string; custom?: boolean };
type SavedLetter = { subject: string; text: string; version: number; savedAt: string };

export type LettresTabHandle = {
  print: () => void;
  save: () => void;
};

const FIELD_OPTIONS = [
  { label: "Nom du patient", key: "patient" },
  { label: "Âge du patient", key: "age" },
  { label: "Nom du médecin", key: "doctor" },
  { label: "Spécialité", key: "specialty" },
  { label: "Observations", key: "observations" },
  { label: "Conclusion", key: "conclusion" },
  { label: "Date du document", key: "date" },
  { label: "Signature", key: "signature" },
] as const;

const LettresTab = forwardRef<LettresTabHandle, {
  theme: any;
  patient: any;
  doctor: any;
  consultationId?: string;
  consultationSummary: { observations: string; conclusion: string };
}>(function LettresTab({ theme, patient, doctor, consultationId, consultationSummary }, ref) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const context = useMemo<LetterContext>(() => ({ patient, doctor, summary: consultationSummary }), [consultationSummary, doctor, patient]);
  const [customTemplates, setCustomTemplates] = useState<LetterTemplate[]>([]);
  const templates = useMemo<LetterTemplate[]>(() => [...createDefaultTemplates(), ...customTemplates], [customTemplates]);
  const [selectedId, setSelectedId] = useState("orientation");
  const selectedTemplate = templates.find((item) => item.id === selectedId) || templates[0];
  const [subject, setSubject] = useState(() => selectedTemplate.subject);
  const [text, setText] = useState(() => selectedTemplate.build(context));
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [fieldMenuOpen, setFieldMenuOpen] = useState(false);
  const [templateMenuId, setTemplateMenuId] = useState<string | null>(null);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [version, setVersion] = useState(1);
  const [savedAt, setSavedAt] = useState(new Date());
  const [savedState, setSavedState] = useState<"idle" | "saved">("idle");

  const patientName = `${patient?.first_name || ""} ${patient?.last_name || ""}`.trim() || "Patient";
  const doctorName = doctor?.nom_complet || doctor?.full_name || doctor?.name || "Médecin";
  const specialty = doctor?.specialite || doctor?.speciality || "Médecine générale";
  const patientId = patient?.id ? String(patient.id) : "patient";
  const documentKey = useCallback((templateId: string) => `mydoctor:letter:${consultationId || patientId}:${templateId}`, [consultationId, patientId]);

  const readSavedLetter = useCallback((templateId: string): SavedLetter | null => {
    if (Platform.OS !== "web" || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(documentKey(templateId));
      return raw ? JSON.parse(raw) as SavedLetter : null;
    } catch {
      return null;
    }
  }, [documentKey]);

  const switchTemplate = useCallback((template: LetterTemplate) => {
    const saved = readSavedLetter(template.id);
    setSelectedId(template.id);
    setSubject(saved?.subject || template.subject);
    setText(saved?.text || template.build(context));
    setVersion(saved?.version || 1);
    setSavedAt(saved?.savedAt ? new Date(saved.savedAt) : new Date());
    setSavedState(saved ? "saved" : "idle");
    setUndoStack([]);
    setPreview(false);
    setTemplateMenuId(null);
  }, [context, readSavedLetter]);

  const updateText = (next: string) => {
    setUndoStack((previous) => [...previous.slice(-29), text]);
    setText(next);
    setSavedState("idle");
  };

  const fieldValue = (key: typeof FIELD_OPTIONS[number]["key"]) => ({
    patient: patientName,
    age: patient?.age ? `${patient.age} ans` : "Âge non renseigné",
    doctor: doctorName,
    specialty,
    observations: consultationSummary.observations || "—",
    conclusion: consultationSummary.conclusion || "—",
    date: new Date().toLocaleDateString("fr-FR"),
    signature: doctor?.signature_numerique || doctorName,
  })[key];

  const insertText = (value: string) => {
    const start = Math.min(selection.start, text.length);
    const end = Math.min(selection.end, text.length);
    updateText(`${text.slice(0, start)}${value}${text.slice(end)}`);
    const cursor = start + value.length;
    setSelection({ start: cursor, end: cursor });
    setFieldMenuOpen(false);
  };

  const wrapSelection = (before: string, after = before) => {
    const start = Math.min(selection.start, text.length);
    const end = Math.min(selection.end, text.length);
    const selected = text.slice(start, end) || "texte";
    updateText(`${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`);
  };

  const saveLetter = useCallback(() => {
    const nextVersion = savedState === "saved" ? version : version + (version > 1 || readSavedLetter(selectedId) ? 1 : 0);
    const now = new Date();
    const payload: SavedLetter = { subject, text, version: nextVersion, savedAt: now.toISOString() };
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(documentKey(selectedId), JSON.stringify(payload));
      } catch {
        return;
      }
    }
    setVersion(nextVersion);
    setSavedAt(now);
    setSavedState("saved");
  }, [documentKey, readSavedLetter, savedState, selectedId, subject, text, version]);

  const printLetter = useCallback(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=760");
    if (!popup) return;
    popup.document.write(`<html><head><title>${escapeHtml(subject)}</title><style>body{font-family:Inter,Arial,sans-serif;padding:54px;color:#10172b}h1{font-size:18px;margin-bottom:28px}.meta{font-size:12px;color:#52617a;margin-bottom:28px}pre{font:14px/1.75 Inter,Arial,sans-serif;white-space:pre-wrap}</style></head><body><h1>${escapeHtml(subject || "Lettre médicale")}</h1><div class="meta">${escapeHtml(doctorName)} · ${escapeHtml(patientName)} · ${new Date().toLocaleDateString("fr-FR")}</div><pre>${escapeHtml(text)}</pre></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }, [doctorName, patientName, subject, text]);

  useImperativeHandle(ref, () => ({ print: printLetter, save: saveLetter }), [printLetter, saveLetter]);

  useEffect(() => {
    const current = templates.find((item) => item.id === selectedId);
    if (!current) switchTemplate(templates[0]);
  }, [selectedId, switchTemplate, templates]);

  const createTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    const template: LetterTemplate = { id: `custom-${Date.now()}`, name, subject: name, custom: true, build: () => `Objet : ${name}\n\n${doctorName},\n\n${patientName}\n\n` };
    setCustomTemplates((previous) => [...previous, template]);
    setNewTemplateName("");
    setNewTemplateOpen(false);
    switchTemplate(template);
  };

  const duplicateTemplate = (template: LetterTemplate) => {
    const copy: LetterTemplate = { id: `custom-${Date.now()}`, name: `${template.name} — copie`, subject, custom: true, build: () => text };
    setCustomTemplates((previous) => [...previous, copy]);
    switchTemplate(copy);
  };

  const deleteTemplate = (template: LetterTemplate) => {
    if (!template.custom) return;
    setCustomTemplates((previous) => previous.filter((item) => item.id !== template.id));
    switchTemplate(templates[0]);
  };

  const undo = () => {
    const previous = undoStack.at(-1);
    if (previous === undefined) return;
    setText(previous);
    setUndoStack((items) => items.slice(0, -1));
    setSavedState("idle");
  };

  return (
    <View style={styles.root}>
      <View style={styles.templatesPanel}>
        <Text style={styles.panelTitle}>Modèles</Text>
        <TouchableOpacity style={styles.newTemplateButton} onPress={() => setNewTemplateOpen(true)}><MaterialCommunityIcons name="plus" size={20} color="#fff" /><Text style={styles.newTemplateText}>NOUVEAU MODÈLE</Text></TouchableOpacity>
        <ScrollView style={styles.templateScroll} contentContainerStyle={styles.templateList} showsVerticalScrollIndicator={false}>
          {templates.map((template, index) => {
            const active = template.id === selectedId;
            return <View key={template.id} style={{ position: "relative", zIndex: templateMenuId === template.id ? 20 : 1 }}><TouchableOpacity onPress={() => switchTemplate(template)} style={[styles.templateItem, active && styles.templateItemActive]}><MaterialCommunityIcons name="file-document-outline" size={22} color={theme.colors.primary} /><Text style={[styles.templateName, active && styles.templateNameActive]} numberOfLines={1}>{template.name}</Text>{index === 0 ? <View style={styles.defaultBadge}><Text style={styles.defaultText}>Par défaut</Text></View> : <TouchableOpacity onPress={() => setTemplateMenuId((current) => current === template.id ? null : template.id)} style={styles.moreButton}><MaterialCommunityIcons name="dots-vertical" size={20} color={theme.colors.textSecondary} /></TouchableOpacity>}</TouchableOpacity>{templateMenuId === template.id ? <View style={styles.templateMenu}><TouchableOpacity style={styles.menuItem} onPress={() => duplicateTemplate(template)}><MaterialCommunityIcons name="content-copy" size={17} color={theme.colors.text} /><Text style={styles.menuText}>Dupliquer</Text></TouchableOpacity>{template.custom ? <TouchableOpacity style={styles.menuItem} onPress={() => deleteTemplate(template)}><MaterialCommunityIcons name="trash-can-outline" size={17} color={theme.colors.error} /><Text style={[styles.menuText, { color: theme.colors.error }]}>Supprimer</Text></TouchableOpacity> : null}</View> : null}</View>;
          })}
        </ScrollView>
      </View>

      <View style={styles.editorPanel}>
        <View style={styles.editorHeadingRow}><View><Text style={styles.panelTitle}>Éditeur</Text><Text style={styles.saveStatus}>{savedState === "saved" ? "Document enregistré" : "Modifications non enregistrées"}</Text></View><View style={{ position: "relative", zIndex: 30 }}><TouchableOpacity style={styles.insertButton} onPress={() => setFieldMenuOpen((value) => !value)}><Text style={styles.insertButtonText}>Insérer un champ</Text><MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.primary} /></TouchableOpacity>{fieldMenuOpen ? <View style={styles.fieldMenu}>{FIELD_OPTIONS.map((field) => <TouchableOpacity key={field.key} style={styles.fieldMenuItem} onPress={() => insertText(fieldValue(field.key))}><Text style={styles.fieldMenuText}>{field.label}</Text><MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} /></TouchableOpacity>)}</View> : null}</View></View>

        <View style={styles.peopleRow}>
          <View style={styles.personBlock}><View style={styles.personIcon}><MaterialCommunityIcons name="account-outline" size={22} color={theme.colors.text} /></View><View><Text style={styles.metaLabel}>Éditeur</Text><Text style={styles.metaValue}>{doctorName} ({specialty})</Text></View></View>
          <View style={styles.peopleDivider} />
          <View style={styles.personBlock}><View style={styles.personIcon}><MaterialCommunityIcons name="account-outline" size={22} color={theme.colors.text} /></View><View><Text style={styles.metaLabel}>Destinataire</Text><Text style={styles.metaValue}>{patientName} (ID: {patientId}, {patient?.age || 0} ans)</Text></View></View>
        </View>

        <View style={styles.subjectRow}><View style={styles.subjectIcon}><MaterialCommunityIcons name="tag-outline" size={20} color={theme.colors.text} /></View><View style={{ flex: 1 }}><Text style={styles.metaLabel}>Objet (optionnel)</Text><TextInput value={subject} onChangeText={(value) => { setSubject(value); setSavedState("idle"); }} placeholder="Objet de la lettre" placeholderTextColor={theme.colors.textSecondary} style={styles.subjectInput} /></View></View>

        <View style={styles.documentCard}>
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.paragraphButton}><Text style={styles.paragraphText}>Paragraphe</Text><MaterialCommunityIcons name="chevron-down" size={17} color={theme.colors.textSecondary} /></TouchableOpacity>
            <ToolbarButton styles={styles} icon="format-bold" onPress={() => wrapSelection("**")} />
            <ToolbarButton styles={styles} icon="format-italic" onPress={() => wrapSelection("_")} />
            <ToolbarButton styles={styles} icon="format-underline" onPress={() => wrapSelection("__")} />
            <ToolbarButton styles={styles} icon="format-list-bulleted" onPress={() => insertText("\n• ")} />
            <ToolbarButton styles={styles} icon="format-list-numbered" onPress={() => insertText("\n1. ")} />
            <ToolbarButton styles={styles} icon="format-align-left" onPress={() => insertText("\n")} />
            <ToolbarButton styles={styles} icon="image-outline" onPress={() => insertText("[Image]")} />
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.previewButton} onPress={() => setPreview((value) => !value)}><MaterialCommunityIcons name={preview ? "pencil-outline" : "eye-outline"} size={20} color={theme.colors.primary} /><Text style={styles.previewText}>{preview ? "Modifier" : "Aperçu"}</Text></TouchableOpacity>
          </View>
          {preview ? <ScrollView style={styles.previewArea} contentContainerStyle={styles.previewContent}><Text style={styles.previewBody}>{text}</Text></ScrollView> : <TextInput value={text} onChangeText={updateText} onSelectionChange={(event) => setSelection(event.nativeEvent.selection)} selection={selection} multiline textAlignVertical="top" style={styles.editorInput} />}
          <View style={styles.documentFooter}><View style={styles.footerMeta}><View style={styles.footerIcon}><MaterialCommunityIcons name="calendar-blank-outline" size={20} color={theme.colors.text} /></View><View><Text style={styles.footerLabel}>Date du document</Text><Text style={styles.footerValue}>{savedAt.toLocaleDateString("fr-FR")}</Text></View></View><View style={styles.footerVersion}><Text style={styles.footerLabel}>Version</Text><Text style={styles.footerValue}>{version.toFixed(1)}</Text></View><TouchableOpacity style={styles.undoButton} onPress={undo} disabled={!undoStack.length}><MaterialCommunityIcons name="history" size={21} color={undoStack.length ? theme.colors.text : theme.colors.border} /></TouchableOpacity></View>
        </View>
      </View>

      <Modal transparent visible={newTemplateOpen} animationType="fade" onRequestClose={() => setNewTemplateOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Nouveau modèle</Text><TouchableOpacity onPress={() => setNewTemplateOpen(false)}><MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} /></TouchableOpacity></View><Text style={styles.metaLabel}>Nom du modèle</Text><TextInput value={newTemplateName} onChangeText={setNewTemplateName} autoFocus placeholder="Ex. Certificat médical" placeholderTextColor={theme.colors.textSecondary} style={styles.modalInput} /><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setNewTemplateOpen(false)}><Text style={styles.cancelText}>ANNULER</Text></TouchableOpacity><TouchableOpacity style={styles.createButton} onPress={createTemplate}><Text style={styles.createText}>CRÉER</Text></TouchableOpacity></View></View></View>
      </Modal>
    </View>
  );
});

function createDefaultTemplates(): LetterTemplate[] {
  return [
    { id: "orientation", name: "Lettre d’orientation", subject: "Orientation et prise en charge spécialisée", build: ({ patient, doctor, summary }) => `Je soussigné(e) ${doctor?.nom_complet || "Dr"} (${doctor?.specialite || ""}),\n\noriente le patient ${patient?.first_name || ""} ${patient?.last_name || ""} (ID: ${patient?.id || "—"}, ${patient?.age || 0} ans),\n\npour avis spécialisé.\n\n\nMotif / observations : ${summary.observations || "—"}\n\nConclusion : ${summary.conclusion || "—"}\n\n\nSignature : ${doctor?.signature_numerique || doctor?.nom_complet || "Dr"}` },
    { id: "report", name: "Compte rendu", subject: "Compte rendu de consultation", build: ({ patient, doctor, summary }) => `Patient : ${patient?.first_name || ""} ${patient?.last_name || ""}\nMédecin : ${doctor?.nom_complet || "Dr"}\n\nObservations : ${summary.observations || "—"}\n\nConclusion : ${summary.conclusion || "—"}\n\nSignature : ${doctor?.signature_numerique || doctor?.nom_complet || "Dr"}` },
    { id: "follow-up", name: "Lettre de suivi", subject: "Suivi médical", build: ({ patient, doctor, summary }) => `Patient : ${patient?.first_name || ""} ${patient?.last_name || ""}\n\nÉvolution / observations : ${summary.observations || "—"}\n\nRecommandations :\n• Suivi clinique\n• Contrôle si nécessaire\n\nConclusion : ${summary.conclusion || "—"}\n\nSignature : ${doctor?.signature_numerique || doctor?.nom_complet || "Dr"}` },
  ];
}

function ToolbarButton({ styles, icon, onPress }: { styles: any; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; onPress: () => void }) {
  return <TouchableOpacity style={styles.toolbarButton} onPress={onPress}><MaterialCommunityIcons name={icon} size={20} color="#29436D" /></TouchableOpacity>;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const createStyles = (theme: any) => StyleSheet.create({
  root: { width: "100%", minHeight: 790, flexDirection: "row", overflow: "visible", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, ...(Platform.OS === "web" ? ({ boxShadow: "0 8px 22px rgba(15,23,42,0.04)" } as any) : null) },
  templatesPanel: { width: 278, padding: 20, borderRightWidth: 1, borderRightColor: theme.colors.border, overflow: "visible" },
  panelTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  newTemplateButton: { minHeight: 44, marginTop: 22, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 8, backgroundColor: theme.colors.primary },
  newTemplateText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  templateScroll: { marginTop: 18, overflow: "visible" },
  templateList: { gap: 10, overflow: "visible" },
  templateItem: { minHeight: 60, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9, backgroundColor: "#FCFDFF" },
  templateItemActive: { borderColor: theme.colors.primary, backgroundColor: "#F7FAFF" },
  templateName: { flex: 1, minWidth: 0, fontSize: 11, fontWeight: "600", color: theme.colors.text },
  templateNameActive: { color: theme.colors.primary },
  defaultBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.colors.primarySoft },
  defaultText: { fontSize: 8, fontWeight: "600", color: theme.colors.primary },
  moreButton: { width: 28, height: 32, alignItems: "center", justifyContent: "center" },
  templateMenu: { position: "absolute", top: 54, right: 8, width: 138, zIndex: 40, padding: 6, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9, backgroundColor: theme.colors.surface, ...(Platform.OS === "web" ? ({ boxShadow: "0 8px 22px rgba(15,23,42,0.14)" } as any) : null) },
  menuItem: { minHeight: 36, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 7 },
  menuText: { fontSize: 11, color: theme.colors.text },
  editorPanel: { flex: 1, minWidth: 0, padding: 22, overflow: "visible" },
  editorHeadingRow: { minHeight: 42, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14, zIndex: 30 },
  saveStatus: { marginTop: 4, fontSize: 10, color: theme.colors.textSecondary },
  insertButton: { minWidth: 170, minHeight: 40, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  insertButtonText: { fontSize: 11, fontWeight: "600", color: theme.colors.primary },
  fieldMenu: { position: "absolute", top: 44, right: 0, width: 220, zIndex: 50, padding: 6, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9, backgroundColor: theme.colors.surface, ...(Platform.OS === "web" ? ({ boxShadow: "0 10px 26px rgba(15,23,42,0.16)" } as any) : null) },
  fieldMenuItem: { minHeight: 36, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 7 },
  fieldMenuText: { fontSize: 11, color: theme.colors.text },
  peopleRow: { minHeight: 78, marginTop: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10 },
  personBlock: { flex: 1, minWidth: 0, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 11 },
  personIcon: { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F8FC" },
  peopleDivider: { width: 1, height: "100%", backgroundColor: theme.colors.border },
  metaLabel: { fontSize: 10, fontWeight: "500", color: theme.colors.textSecondary },
  metaValue: { marginTop: 5, fontSize: 11, fontWeight: "600", color: theme.colors.text },
  subjectRow: { minHeight: 70, marginTop: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10 },
  subjectIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F8FC" },
  subjectInput: { minHeight: 30, padding: 0, fontSize: 12, fontWeight: "500", color: theme.colors.text, outlineStyle: "none" } as any,
  documentCard: { flex: 1, minHeight: 570, marginTop: 16, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10 },
  toolbar: { minHeight: 48, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 3, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: "#FCFDFF" },
  paragraphButton: { minWidth: 116, height: 36, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 8 },
  paragraphText: { fontSize: 11, fontWeight: "500", color: theme.colors.text },
  toolbarButton: { width: 38, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 7 },
  previewButton: { minWidth: 86, height: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  previewText: { fontSize: 11, fontWeight: "600", color: theme.colors.primary },
  editorInput: { flex: 1, minHeight: 450, padding: 20, fontSize: 14, lineHeight: 28, color: theme.colors.text, backgroundColor: theme.colors.surface, outlineStyle: "none" } as any,
  previewArea: { flex: 1, minHeight: 450, backgroundColor: theme.colors.surface },
  previewContent: { padding: 20 },
  previewBody: { fontSize: 14, lineHeight: 28, color: theme.colors.text },
  documentFooter: { minHeight: 70, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: "#FCFDFF" },
  footerMeta: { flex: 1, flexDirection: "row", alignItems: "center", gap: 11 },
  footerIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F8FC" },
  footerLabel: { fontSize: 9, fontWeight: "500", color: theme.colors.textSecondary },
  footerValue: { marginTop: 5, fontSize: 10, fontWeight: "600", color: theme.colors.text },
  footerVersion: { width: 150 },
  undoButton: { width: 42, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "rgba(15,23,42,0.35)" },
  modalCard: { width: "100%", maxWidth: 430, padding: 20, borderRadius: 14, backgroundColor: theme.colors.surface },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.text },
  modalInput: { minHeight: 44, marginTop: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9, color: theme.colors.text, outlineStyle: "none" } as any,
  modalActions: { marginTop: 20, flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelButton: { minHeight: 40, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8 },
  cancelText: { fontSize: 10, fontWeight: "600", color: theme.colors.textSecondary },
  createButton: { minHeight: 40, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: theme.colors.primary },
  createText: { fontSize: 10, fontWeight: "600", color: "#fff" },
});

export default LettresTab;
