import { TopBar } from "@/components/top_bar";
import { normalizeSpeciality, SpecialityKey } from "@/config/speciality";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
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

const DEFAULT_OHIF_URL = process.env.EXPO_PUBLIC_OHIF_VIEWER_URL || "https://viewer.ohif.org/";

const DENTISTRY_URL =
  process.env.EXPO_PUBLIC_TOOL_DENTISTRY_URL ||
  "https://sketchfab.com/models/768c0ac4f5864e0a9d9fea3296f468fe/embed";

const CARDIOLOGY_URL =
  process.env.EXPO_PUBLIC_TOOL_CARDIOLOGY_URL ||
  "https://sketchfab.com/models/26b5044d922340988cd3d13ca0f0d176/embed";

const DEFAULT_BY_SPECIALITY: Record<SpecialityKey, string> = {
  general: "ohif",
  cardiology: "heart_3d",
  dermatology: "ohif",
  gynecology: "ohif",
  pediatrics: "ohif",
  dentistry: "teeth_3d",
};

const TOOL_REGISTRY: Record<string, ToolDef> = {
  ohif: {
    id: "ohif",
    label: "OHIF Viewer",
    url: DEFAULT_OHIF_URL,
    embed: false,
    notes: "Official demo blocks iframe/webview embedding. Use external launch or self-host OHIF.",
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

const SPECIALTY_LABELS: Record<SpecialityKey, string> = {
  general: "General",
  cardiology: "Cardiology",
  dermatology: "Dermatology",
  gynecology: "Gynecology",
  pediatrics: "Pediatrics",
  dentistry: "Dentistry",
};

export default function ImagingViewerPage() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();

  const doctorSpeciality = normalizeSpeciality((user as any)?.doctorProfile?.speciality ?? null);

  const [activeSpeciality, setActiveSpeciality] = React.useState<SpecialityKey>(doctorSpeciality);
  const [activeToolId, setActiveToolId] = React.useState<string>(DEFAULT_BY_SPECIALITY[doctorSpeciality]);

  React.useEffect(() => {
    setActiveSpeciality(doctorSpeciality);
    setActiveToolId(DEFAULT_BY_SPECIALITY[doctorSpeciality]);
  }, [doctorSpeciality]);

  const activeTool = TOOL_REGISTRY[activeToolId] || TOOL_REGISTRY.ohif;

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
    return [TOOL_REGISTRY.ohif, TOOL_REGISTRY.teeth_3d, TOOL_REGISTRY.heart_3d];
  }, [activeSpeciality]);

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}> 
      <TopBar theme={theme} />

      <View style={styles.header}>
        <Text style={styles.title}>Imagerie & 3D Tools</Text>
        <Text style={styles.subtitle}>
          Specialty mode: {SPECIALTY_LABELS[activeSpeciality]} ({(user?.user_type || "doctor")})
        </Text>
      </View>

      <View style={styles.filtersWrap}>
        {(Object.keys(SPECIALTY_LABELS) as SpecialityKey[]).map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => {
              setActiveSpeciality(k);
              setActiveToolId(DEFAULT_BY_SPECIALITY[k]);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: activeSpeciality === k ? theme.colors.primary : theme.colors.surface,
                borderColor: activeSpeciality === k ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: activeSpeciality === k ? "#fff" : theme.colors.text,
                fontWeight: "800",
              }}
            >
              {SPECIALTY_LABELS[k]}
            </Text>
          </TouchableOpacity>
        ))}
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
                fontWeight: "800",
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

          <TouchableOpacity style={styles.openBtn} onPress={() => openExternal(activeTool.url)}>
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={styles.openBtnText}>Open externally</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === "web" && activeTool.embed ? (
          <div style={{ width: "100%", height: "100%", minHeight: "72vh" }}>
            <iframe
              src={activeTool.url}
              title={activeTool.label}
              style={{ width: "100%", height: "100%", border: "none", borderRadius: "10px" }}
              allow="fullscreen; xr-spatial-tracking"
            />
          </div>
        ) : (
          <View style={styles.nativeFallback}>
            <Text style={styles.nativeFallbackText}>
              {activeTool.id === "ohif"
                ? "OHIF demo blocks iframe/webview embedding. Click below to open it in a new tab/browser."
                : "This tool is opened externally on native devices in this Expo setup."}
            </Text>
            <TouchableOpacity style={styles.launchBtn} onPress={() => openExternal(activeTool.url)}>
              <Ionicons name="globe-outline" size={18} color="#fff" />
              <Text style={styles.launchBtnText}>Launch tool</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: { flex: 1 },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    title: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.colors.text,
    },
    subtitle: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontWeight: "700",
    },
    filtersWrap: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    card: {
      flex: 1,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    cardHeader: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    cardTitle: {
      fontWeight: "900",
      color: theme.colors.text,
    },
    cardNote: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontWeight: "700",
      fontSize: 12,
    },
    openBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    openBtnText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 12,
    },
    nativeFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 16,
      backgroundColor: theme.colors.background,
    },
    nativeFallbackText: {
      color: theme.colors.textSecondary,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 22,
    },
    launchBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    launchBtnText: {
      color: "#fff",
      fontWeight: "900",
    },
  });
