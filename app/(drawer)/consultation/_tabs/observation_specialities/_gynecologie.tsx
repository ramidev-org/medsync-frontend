import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * This file contains ONLY gynecology UI.
 * Observation page passes theme + handler(s) as props.
 */

export type GynecologyState = {
  // if later you want to store these values dynamically
  bebeJour?: string;
  bebeMois?: string;
  bebeAnnee?: string;
  ddr?: string;
  cycle?: string;
  ageGrossesse?: string;
};

function InfoPair({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 180 }}>
      <Text style={{ fontWeight: "900", opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontWeight: "900", color: theme.colors.primary, marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

function TimelinePoint({
  theme,
  label,
  date,
  active,
}: {
  theme: any;
  label: string;
  date: string;
  active?: boolean;
}) {
  return (
    <View style={{ alignItems: "center", width: 160 }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          borderWidth: 3,
          borderColor: active ? theme.colors.primary : "rgba(0,0,0,0.2)",
          backgroundColor: "#fff",
          marginBottom: 6,
        }}
      />
      <Text style={{ fontWeight: "900", textAlign: "center", color: theme.colors.primary }}>
        {label}
      </Text>
      <Text style={{ fontWeight: "800", opacity: 0.7, marginTop: 4 }}>{date}</Text>
    </View>
  );
}

export function GynecologyTab({
  theme,
  onModifyLabel,
  value,
  onChange,
}: {
  theme: any;
  onModifyLabel: () => void;
  value: GynecologyState;
  onChange: (next: GynecologyState) => void;
}) {
  const styles = createStyles(theme);

  // fallback prototype values = what you currently hardcoded
  const bebeJour = value.bebeJour ?? "19";
  const bebeMois = value.bebeMois ?? "11";
  const bebeAnnee = value.bebeAnnee ?? "22";

  const ddr = value.ddr ?? "12.02.2022";
  const cycle = value.cycle ?? "28 Jours";
  const ageGrossesse = value.ageGrossesse ?? "15 Semaines Et 3 Jours";

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.metaRow}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.yellowBtn} onPress={onModifyLabel}>
          <Text style={styles.yellowBtnText}>MODIFIER ÉTIQUETTE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.labelBanner}>
        <Text style={styles.labelBannerTitle}>Bébé arrive le</Text>
        <View style={styles.labelBannerDateRow}>
          <View style={styles.labelBannerDateBox}>
            <Text style={styles.labelBannerDateText}>{bebeJour}</Text>
          </View>
          <View style={styles.labelBannerDateBox}>
            <Text style={styles.labelBannerDateText}>{bebeMois}</Text>
          </View>
          <View style={styles.labelBannerDateBox}>
            <Text style={styles.labelBannerDateText}>{bebeAnnee}</Text>
          </View>
        </View>
      </View>

      <View style={styles.labelInfoRow}>
        <InfoPair theme={theme} label="Date des dernières règles:" value={ddr} />
        <InfoPair theme={theme} label="Cycle Menstruel:" value={cycle} />
        <InfoPair theme={theme} label="Age de grossesse:" value={ageGrossesse} />
      </View>

      <View style={styles.timelineWrap}>
        <Text style={styles.sectionTitle}>Mes échographies</Text>
        <View style={styles.timelineLine} />
        <View style={styles.timelinePoints}>
          <TimelinePoint theme={theme} label="Début de la grossesse" date="26-Feb-2022" active />
          <TimelinePoint theme={theme} label="2ème échographie" date="16-Jul → 30-Jul.2022" />
          <TimelinePoint theme={theme} label="Naissance" date="19.Nov.2022" />
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    metaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 10,
      flexWrap: "wrap",
    },
    yellowBtn: {
      backgroundColor: "#F5B301",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignSelf: "flex-start",
    },
    yellowBtnText: { fontWeight: "900", color: "#fff", fontSize: 12 },

    labelBanner: {
      alignItems: "center",
      paddingVertical: 18,
      borderRadius: 10,
      backgroundColor: "rgba(0, 140, 255, 0.06)",
    },
    labelBannerTitle: { fontWeight: "900", opacity: 0.8, marginBottom: 8 },
    labelBannerDateRow: { flexDirection: "row", gap: 10 },
    labelBannerDateBox: {
      width: 54,
      height: 54,
      borderRadius: 10,
      backgroundColor: "#5B4CE6",
      alignItems: "center",
      justifyContent: "center",
    },
    labelBannerDateText: { color: "#fff", fontWeight: "900", fontSize: 18 },

    labelInfoRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },

    timelineWrap: {
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.02)",
    },
    sectionTitle: { fontWeight: "900", textAlign: "center", marginBottom: 10, opacity: 0.75 },
    timelineLine: {
      height: 2,
      backgroundColor: "rgba(0,0,0,0.10)",
      marginHorizontal: 10,
      marginBottom: 12,
    },
    timelinePoints: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  });

// Not a route screen; keep router scanning happy.
export default function GynecologyRoute() {
  return null;
}
