import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import type { InventoryItemRow } from "@/services/backend.types";
import { getInventory } from "@/services/inventory.services";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function InventoryPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = React.useState(true);
  const [migrationMissing, setMigrationMissing] = React.useState(false);
  const [items, setItems] = React.useState<InventoryItemRow[]>([]);

  const refresh = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setMigrationMissing(false);
      const res = await getInventory({ requesterId: user.id, page: 1, itemsPerPage: 100 });
      setItems(res?.items ?? []);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      const notFound = msg.toLowerCase().includes("was not found") || msg.includes("404");
      if (notFound) {
        setMigrationMissing(true);
        setItems([]);
      } else {
        Alert.alert("Error", msg || "Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PageShell title="Clinic Inventory" subtitle="Keep stock healthy and avoid interruptions in treatment flow.">
      {migrationMissing && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Database migration missing. Apply `database/sql/2026_05_09_inventory_and_chats.sql` in Supabase to enable inventory.
          </Text>
        </View>
      )}
      <View style={styles.table}>
        <View style={[styles.row, styles.header]}>
          <Text style={styles.h}>Item</Text>
          <Text style={styles.h}>Available</Text>
          <Text style={styles.h}>Threshold</Text>
          <Text style={styles.h}>Status</Text>
        </View>
        {!loading && items.length === 0 && (
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: 4, color: theme.colors.textSecondary }]}>No inventory items yet.</Text>
          </View>
        )}
        {items.map((row) => {
          const low = Number(row.qty_on_hand ?? 0) < Number(row.reorder_threshold ?? 0);
          return (
            <View key={row.id} style={styles.row}>
              <Text style={styles.cell}>{row.name}</Text>
              <Text style={styles.cell}>{row.qty_on_hand}</Text>
              <Text style={styles.cell}>{row.reorder_threshold}</Text>
              <Text style={[styles.cell, { color: low ? theme.colors.error : theme.colors.success, fontWeight: "900" }]}>
                {low ? "Low Stock" : "Healthy"}
              </Text>
            </View>
          );
        })}
      </View>
    </PageShell>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    banner: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    bannerText: { fontWeight: "800", color: theme.colors.text },
    table: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    header: { backgroundColor: theme.colors.surfaceVariant },
    h: { flex: 1, color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
    cell: { flex: 1, color: theme.colors.text, fontWeight: "700" },
  });

