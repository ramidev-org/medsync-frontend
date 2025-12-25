import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DashboardPage() {
  const { theme } = useTheme();

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          {/* ================= LEFT COLUMN ================= */}
          <View style={styles.leftColumn}>
            {/* Welcome */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>
                Bonjour : Dr Docteur DOCTEUR 👋
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Bienvenue sur votre tableau de bord
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard title="Patients" value="877" color="#8b5cf6" />
              <StatCard title="Consultations" value="1437" color="#f59e0b" />
              <StatCard title="RDVs" value="1719" color="#3b82f6" />
              <StatCard title="Urgents" value="2" color="#ef4444" />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {[
                "RDV - CONS",
                "EFFICACITÉ RDV",
                "REVENU",
                "MALADIES",
                "SYMPTÔMES",
                "MÉDICAMENTS",
                "BILANS",
              ].map((tab) => (
                <View key={tab} style={styles.tab}>
                  <Text style={styles.tabText}>{tab}</Text>
                </View>
              ))}
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>
                RDV / Consultation Statistiques
              </Text>

              <View style={styles.chartPlaceholder}>
                <Text style={{ color: "#94a3b8" }}>
                  📊 Line Chart (mock data)
                </Text>
              </View>
            </View>
          </View>

          {/* ================= RIGHT COLUMN ================= */}
          <View style={styles.rightColumn}>
            <View style={styles.doctorCard}>
              <Image
                source={{ uri: "https://i.imgur.com/6VBx3io.png" }}
                style={styles.avatar}
              />

              <Text style={styles.doctorName}>
                Dr Docteur DOCTEUR
              </Text>
              <Text style={styles.doctorRole}>Médecin</Text>

              <View style={styles.divider} />

              <DoctorStat label="N° Ordonnances" value="24" />
              <DoctorStat label="N° Lettres" value="9" />
              <DoctorStat label="Objectif Mensuel" value="1 / 150" />

              <View style={styles.divider} />

              <Text style={styles.cardTitle}>Activité / Type</Text>

              <View style={styles.donutPlaceholder}>
                <Text style={{ color: "#94a3b8" }}>
                  🍩 Donut Chart (mock)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= COMPONENTS ================= */

const StatCard = ({ title, value, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const DoctorStat = ({ label, value }: any) => (
  <View style={styles.doctorStat}>
    <Text style={styles.doctorStatValue}>{value}</Text>
    <Text style={styles.doctorStatLabel}>{label}</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  row: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },

  leftColumn: {
    flex: 2,
    gap: 20,
  },

  rightColumn: {
    flex: 1,
  },

  /* Welcome */
  welcomeCard: {
    backgroundColor: "#0ea5e9",
    padding: 24,
    borderRadius: 14,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  welcomeSubtitle: {
    color: "#e0f2fe",
    marginTop: 6,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    width: "23%",
    borderLeftWidth: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statTitle: {
    color: "#64748b",
    marginTop: 4,
  },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tab: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    color: "#0369a1",
    fontSize: 14,
    fontWeight: "600",
  },

  /* Chart */
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 350,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Doctor Card */
  doctorCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    position: "sticky", // web-only
    top: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  doctorName: {
    fontWeight: "700",
    fontSize: 16,
  },
  doctorRole: {
    color: "#64748b",
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    width: "100%",
    marginVertical: 14,
  },

  doctorStat: {
    alignItems: "center",
    marginBottom: 10,
  },
  doctorStatValue: {
    fontWeight: "700",
    fontSize: 16,
  },
  doctorStatLabel: {
    fontSize: 12,
    color: "#64748b",
  },

  donutPlaceholder: {
    height: 260,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});
