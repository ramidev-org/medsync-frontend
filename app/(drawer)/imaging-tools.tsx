import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { useAppData } from "@/contexts/appData_context";
import { callRpc } from "@/services/backend";
import type { ClinicSpecialityToolRow } from "@/services/backend.types";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type SpecialityKey = "general" | "cardiology" | "dermatology" | "gynecology" | "pediatrics" | "dentistry";

const SPECIALITIES: { key: SpecialityKey; label: string }[] = [
  { key: "general", label: "Médecine générale" },
  { key: "cardiology", label: "Cardiologie" },
  { key: "dermatology", label: "Dermatologie" },
  { key: "gynecology", label: "Gynécologie" },
  { key: "pediatrics", label: "Pédiatrie" },
  { key: "dentistry", label: "Dentisterie" },
];

export default function ImagingToolsPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const { isClinicAdmin } = useAppData();

  const [loading, setLoading] = React.useState(true);
  const [values, setValues] = React.useState<Record<SpecialityKey, string>>({
    general: "",
    cardiology: "",
    dermatology: "",
    gynecology: "",
    pediatrics: "",
    dentistry: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const rows = await callRpc<ClinicSpecialityToolRow[], Record<string, unknown>>("rpc_get_clinic_speciality_tools", {
          p_requester_id: user.id,
        });
        if (cancelled) return;

        const next = { ...values };
        for (const s of SPECIALITIES) {
          const ohif = (rows || []).find(
            (r) => String(r.speciality_key).toLowerCase() === s.key && String(r.tool_type).toLowerCase() === "ohif",
          );
          next[s.key] = String(ohif?.base_url || "");
        }
        setValues(next);
      } catch (e: any) {
        // Migration not applied => page can still be used as guidance
        console.warn("Load imaging tools error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = async (key: SpecialityKey) => {
    if (!user?.id) return;
    if (!isClinicAdmin) {
      Alert.alert("Accès refusé", "Seul l'admin de la clinique peut modifier ces paramètres.");
      return;
    }

    try {
      await callRpc<string, Record<string, unknown>>("rpc_upsert_clinic_speciality_tool", {
        p_requester_id: user.id,
        p_speciality_key: key,
        p_tool_type: "ohif",
        p_label: "OHIF Viewer",
        p_base_url: values[key].trim() ? values[key].trim() : null,
        p_active: true,
      });
      Alert.alert("Succès", "OHIF mis à jour.");
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("was not found") || msg.includes("404")) {
        Alert.alert(
          "DB migration manquante",
          "Applique database/sql/2026_04_29_full_upgrade.sql dans Supabase (RPCs + tables).",
        );
        return;
      }
      Alert.alert("Erreur", e?.message || "Impossible de sauvegarder");
    }
  };

  return (
    <PageShell
      title="Imagerie – OHIF par spécialité"
      subtitle="Configure l’URL de base OHIF (recommandé : ton OHIF auto-hébergé avec DICOMweb)."
    >
      {!isClinicAdmin && (
        <View style={styles.warn}>
          <Ionicons name="alert-circle-outline" size={18} color={theme.colors.text} />
          <Text style={styles.warnText}>Lecture seule (non admin).</Text>
        </View>
      )}

      {SPECIALITIES.map((s) => (
        <View key={s.key} style={styles.card}>
          <Text style={styles.cardTitle}>{s.label}</Text>

          <Text style={styles.label}>OHIF base URL</Text>
          <TextInput
            value={values[s.key]}
            onChangeText={(v) => setValues((p) => ({ ...p, [s.key]: v }))}
            placeholder="https://ohif.myclinic.com/"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.saveBtn, !isClinicAdmin && { opacity: 0.6 }]}
            onPress={() => save(s.key)}
            disabled={!isClinicAdmin || loading}
          >
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      ))}
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    warn: {
      marginTop: 2,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    warnText: { fontWeight: "800", color: theme.colors.text },

    card: {
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    cardTitle: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
    label: { marginTop: 10, fontWeight: "800", color: theme.colors.textSecondary },
    input: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontWeight: "800",
      color: theme.colors.text,
    },
    saveBtn: {
      marginTop: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    saveBtnText: { color: "#fff", fontWeight: "900" },
  });
