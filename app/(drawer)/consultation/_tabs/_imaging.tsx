import { ThemedCard } from "@/components/default_card";
import { buildOhifStudyUrl } from "@/config/ohif";
import { normalizeSpeciality, SpecialityKey } from "@/config/speciality";
import { useAppData } from "@/contexts/appData_context";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import type { ConsultationSession } from "@/services/backend.types";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ToolDef = {
  id: string;
  label: string;
  url: string;
  embed: boolean;
  notes?: string;
};

const DENTISTRY_URL =
  process.env.EXPO_PUBLIC_TOOL_DENTISTRY_URL ||
  "https://sketchfab.com/models/768c0ac4f5864e0a9d9fea3296f468fe/embed";

const CARDIOLOGY_URL =
  process.env.EXPO_PUBLIC_TOOL_CARDIOLOGY_URL ||
  "https://sketchfab.com/models/26b5044d922340988cd3d13ca0f0d176/embed";

const TOOL_REGISTRY: Record<string, ToolDef> = {
  ohif: {
    id: "ohif",
    label: "OHIF Viewer",
    url: "https://viewer.ohif.org/",
    embed: false,
    notes: "Open externally (demo blocks embedding). For full integration, self-host OHIF.",
  },
  teeth_3d: {
    id: "teeth_3d",
    label: "Teeth 3D Viewer",
    url: DENTISTRY_URL,
    embed: true,
    notes: "Interactive 3D mouth/teeth demo.",
  },
  heart_3d: {
    id: "heart_3d",
    label: "Heart 3D Viewer",
    url: CARDIOLOGY_URL,
    embed: true,
    notes: "Interactive 3D heart/ribcage demo.",
  },
};

const DEFAULT_BY_SPECIALITY: Record<SpecialityKey, string> = {
  general: "ohif",
  cardiology: "heart_3d",
  dermatology: "ohif",
  gynecology: "ohif",
  pediatrics: "ohif",
  dentistry: "teeth_3d",
};

const SPECIALTY_LABELS: Record<SpecialityKey, string> = {
  general: "General",
  cardiology: "Cardiology",
  dermatology: "Dermatology",
  gynecology: "Gynecology",
  pediatrics: "Pediatrics",
  dentistry: "Dentistry",
};

export default function ImagingTab({
  theme,
  doctorSpeciality,
  consultationId,
}: {
  theme: any;
  doctorSpeciality?: string | null;
  consultationId?: string | null;
}) {
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const { getOhifBaseUrlFor } = useAppData();

  const activeSpeciality = React.useMemo(
    () => normalizeSpeciality(doctorSpeciality ?? null),
    [doctorSpeciality],
  );
  const [activeToolId, setActiveToolId] = React.useState<string>(DEFAULT_BY_SPECIALITY[activeSpeciality]);

  React.useEffect(() => {
    setActiveToolId(DEFAULT_BY_SPECIALITY[activeSpeciality]);
  }, [activeSpeciality]);

  const activeTool = TOOL_REGISTRY[activeToolId] || TOOL_REGISTRY.ohif;

  const ohifUrl = React.useMemo(() => {
    const base = getOhifBaseUrlFor(activeSpeciality);
    return buildOhifStudyUrl({ baseUrl: base, modePath: "viewer" });
  }, [activeSpeciality, getOhifBaseUrlFor]);

  const activeToolUrl = activeTool.id === "ohif" ? ohifUrl : activeTool.url;

  const openExternal = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Erreur", "Impossible d'ouvrir le viewer");
    }
  };

  const toolsForSpeciality = React.useMemo(() => {
    if (activeSpeciality === "dentistry") return [TOOL_REGISTRY.teeth_3d, TOOL_REGISTRY.ohif];
    if (activeSpeciality === "cardiology") return [TOOL_REGISTRY.heart_3d, TOOL_REGISTRY.ohif];
    return [TOOL_REGISTRY.ohif];
  }, [activeSpeciality]);

  const [dicomDocs, setDicomDocs] = React.useState<
    { id: string; name: string; study_instance_uid: string | null; series_instance_uid: string | null }[]
  >([]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id || !consultationId) return;
      // Skip local-only ids like "consult_xxx"
      if (!/^[0-9a-f]{8}-/i.test(String(consultationId))) return;

      try {
        const session = await callRpc<ConsultationSession, Record<string, unknown>>("rpc_get_consultation", {
          p_requester_id: user.id,
          p_consultation_id: consultationId,
        });
        if (cancelled) return;

        const docs = (session?.documents || [])
          .filter((d: any) => String(d.kind || "").toLowerCase() === "dicom" || !!d.study_instance_uid)
          .map((d: any) => ({
            id: String(d.id),
            name: String(d.name || "DICOM Study"),
            study_instance_uid: d.study_instance_uid ? String(d.study_instance_uid) : null,
            series_instance_uid: d.series_instance_uid ? String(d.series_instance_uid) : null,
          }))
          .filter((d) => !!d.study_instance_uid);

        setDicomDocs(docs);
      } catch {
        // ignore if RPC not deployed yet
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, consultationId]);

  return (
    <ThemedCard>
      <View style={styles.header}>
        <Text style={styles.title}>Imagerie</Text>
        <Text style={styles.subtitle}>Specialty: {SPECIALTY_LABELS[activeSpeciality]}</Text>
      </View>

      <View style={styles.filtersWrap}>
        {toolsForSpeciality.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            onPress={() => setActiveToolId(tool.id)}
            style={[
              styles.chip,
              {
                backgroundColor: activeToolId === tool.id ? theme.colors.primary : theme.colors.surface,
                borderColor: activeToolId === tool.id ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: activeToolId === tool.id ? "#fff" : theme.colors.text,
                fontWeight: "900",
              }}
            >
              {tool.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{activeTool.label}</Text>
            {!!activeTool.notes && <Text style={styles.cardNote}>{activeTool.notes}</Text>}
          </View>

          <TouchableOpacity style={styles.openBtn} onPress={() => openExternal(activeToolUrl)}>
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={styles.openBtnText}>Open</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === "web" && activeTool.embed ? (
          <div style={{ width: "100%", height: "100%", minHeight: "52vh" }}>
            <iframe
              src={activeToolUrl}
              title={activeTool.label}
              style={{ width: "100%", height: "100%", border: "none", borderRadius: "10px" }}
              allow="fullscreen; xr-spatial-tracking"
            />
          </div>
        ) : (
          <View style={styles.nativeFallback}>
            <Text style={styles.nativeFallbackText}>
              This tool is opened externally in this Expo setup.
            </Text>
            <TouchableOpacity style={styles.launchBtn} onPress={() => openExternal(activeToolUrl)}>
              <Ionicons name="globe-outline" size={18} color="#fff" />
              <Text style={styles.launchBtnText}>Launch tool</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {dicomDocs.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: "900", color: theme.colors.text, marginBottom: 8 }}>
            DICOM Studies
          </Text>

          {dicomDocs.map((d) => {
            const url = buildOhifStudyUrl({
              baseUrl: getOhifBaseUrlFor(activeSpeciality),
              modePath: "viewer",
              studyInstanceUIDs: d.study_instance_uid,
              seriesInstanceUID: d.series_instance_uid,
            });
            return (
              <View
                key={d.id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "900", color: theme.colors.text }}>{d.name}</Text>
                  <Text style={{ marginTop: 3, fontWeight: "700", color: theme.colors.textSecondary }}>
                    StudyInstanceUID: {d.study_instance_uid}
                  </Text>
                </View>
                <TouchableOpacity style={styles.openBtn} onPress={() => openExternal(url)}>
                  <Ionicons name="open-outline" size={16} color="#fff" />
                  <Text style={styles.openBtnText}>Open OHIF</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </ThemedCard>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    header: { paddingBottom: 12 },
    title: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
    subtitle: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800" },

    filtersWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
    },

    card: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
    },
    cardHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    cardTitle: { fontSize: 14, fontWeight: "900", color: theme.colors.text },
    cardNote: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700" },

    openBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    openBtnText: { color: "#fff", fontWeight: "900" },

    nativeFallback: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    nativeFallbackText: { color: theme.colors.textSecondary, fontWeight: "700" },
    launchBtn: {
      marginTop: 10,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    launchBtnText: { color: "#fff", fontWeight: "900" },
  });
