import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
  const { theme } = useTheme();

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <TopBar theme={theme} />

      <ScrollView contentContainerStyle={styles.container}>
        {/* ===== HERO ===== */}
        <LinearGradient
          colors={["#0ea5e9", "#38bdf8"]}
          style={styles.hero}
        >
          <Text style={styles.welcome}>BIENVENUE SUR VOTRE</Text>
          <Text style={styles.brand}>MEDSIGN CARE</Text>

          <Text style={styles.subtitle}>
            Choisissez votre cabinet parmi les cabinets ci-dessous ou ajoutez
            autre.
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Tableau de Bord</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>
                Ajouter un Cabinet
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ===== CABINETS ===== */}
        <View style={styles.cardsRow}>
          <CabinetCard title="Médecine Générale" icon="medkit" active />
          <CabinetCard title="Gynécologie" icon="female" active />
          <CabinetCard title="Orthopédie" icon="fitness" />
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= CARD ================= */

function CabinetCard({
  title,
  icon,
  active,
}: {
  title: string;
  icon: any;
  active?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={28} color="#0ea5e9" />
      </View>

      <Text style={styles.cardTitle}>{title}</Text>

      <View
        style={[
          styles.status,
          { backgroundColor: active ? "#22c55e" : "#f59e0b" },
        ]}
      >
        <Text style={styles.statusText}>
          {active ? "ACTIF" : "INACTIF"}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardBtn}>
          <Text style={styles.cardBtnText}>Tableau de Bord</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons
            name="settings-outline"
            size={18}
            color="#6366f1"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 24,
  },

  /* HERO */
  hero: {
    borderRadius: 16,
    padding: 24,
    overflow: "hidden",
  },
  welcome: {
    color: "#e0f2fe",
    fontSize: 12,
    letterSpacing: 1,
  },
  brand: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#e0f2fe",
    fontSize: 14,
    lineHeight: 20,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  primaryBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  secondaryBtnText: {
    color: "#2563eb",
    fontWeight: "600",
  },

  plusTop: {
    position: "absolute",
    top: -10,
    right: 20,
  },
  plusBottom: {
    position: "absolute",
    bottom: 10,
    right: 80,
  },

  /* CARDS */
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "32%",
  },

  cardIcon: {
    backgroundColor: "#e0f2fe",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  status: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardBtn: {
    borderWidth: 1,
    borderColor: "#6366f1",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  cardBtnText: {
    color: "#6366f1",
    fontWeight: "600",
  },

  iconBtn: {
    padding: 6,
  },
});
