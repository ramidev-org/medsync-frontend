import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Visit } from "@/models"; // ✅ make sure this path matches your src folder
import { useTheme } from "@/theme/theme_provider";

export default function VisitsPage() {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  useEffect(() => {
    loadVisits();
  }, []);

  async function loadVisits() {
    setLoading(true);

    // 🔁 Replace this with your API call
    setTimeout(() => {
      const dummyVisits: Visit[] = [
        {
          id: "1",
          completed: false,
          amount: 2000,
          notes: "Routine checkup",
          createdAt: new Date().toISOString(), // or any valid string
          createdBy: "admin", // string or user ID
          patient: {
            id: "p1",
            firstName: "Rami",
            lastName: "Ahmed",
            age: 25,
            sex: "male",
          },
        },
        {
          id: "2",
          completed: false,
          amount: 4000,
          notes: "Follow-up",
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          patient: {
            id: "p2",
            firstName: "Test",
            lastName: "User",
            age: 22,
            sex: "male",
          },
        },
      ];
      setVisits(dummyVisits);
      setLoading(false);
    }, 800);
  }

  function renderItem({ item, index }: { item: Visit; index: number }) {
    const completed = item.completed;

    return (
      <Animated.View entering={FadeInDown.delay(index * 60)}>
        <Pressable onPress={() => setSelectedVisit(item)}>
          <View style={[styles.card, completed && { opacity: 0.5 }]}>
            <View style={styles.avatar}>
              {completed ? (
                <Ionicons
                  name="checkmark-circle"
                  size={28}
                  color={theme.colors.border}
                />
              ) : (
                <Text style={styles.avatarText}>{index + 1}</Text>
              )}
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.title}>
                {item.patient.firstName} {item.patient.lastName}
              </Text>

              {!!item.notes && (
                <Text style={styles.notes} numberOfLines={2}>
                  {item.notes}
                </Text>
              )}

              {!!item.amount && (
                <Text style={styles.amount}>Amount: {item.amount} DA</Text>
              )}

              <Text
                style={[
                  styles.status,
                  {
                    color: completed
                      ? theme.colors.border
                      : theme.colors.primary,
                  },
                ]}
              >
                {completed ? "Completed" : "Pending"}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadVisits}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No visits</Text> : null
        }
        renderItem={renderItem}
      />

      <View style={styles.fabContainer}>
        <Pressable style={styles.fab}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>

        <Pressable style={styles.fabSecondary}>
          <Ionicons name="calendar" size={22} color="#fff" />
        </Pressable>
      </View>

      <Modal
        visible={!!selectedVisit}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVisit(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Visit Details</Text>

            <Text>
              Patient: {selectedVisit?.patient.firstName}{" "}
              {selectedVisit?.patient.lastName}
            </Text>

            <Pressable
              style={styles.modalClose}
              onPress={() => setSelectedVisit(null)}
            >
              <Text style={{ color: theme.colors.primary }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// -------------------- Styles --------------------
type Theme = {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    list: { padding: 16, paddingBottom: 120 },
    card: {
      flexDirection: "row",
      padding: 16,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    avatarText: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.primary,
    },
    cardContent: { flex: 1 },
    title: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
    notes: { marginTop: 4, color: theme.colors.text, opacity: 0.7 },
    amount: { marginTop: 6, fontWeight: "500" },
    status: { marginTop: 6, fontWeight: "700" },
    empty: { textAlign: "center", marginTop: 80, color: theme.colors.text },
    fabContainer: { position: "absolute", right: 16, bottom: 24, gap: 12 },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
    },
    fabSecondary: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.9,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modal: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
    modalClose: { marginTop: 20, alignSelf: "flex-end" },
  });
