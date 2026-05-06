import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { useTheme } from "@/theme/theme_provider";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type InventoryItemRow = {
  id: string;
  name: string;
  unit?: string | null;
  qty: number;
  threshold: number;
  updated_at?: string | null;
};

type RpcGetInventoryResponse = {
  items: InventoryItemRow[];
  total: number;
  page: number;
  itemsPerPage: number;
};

export default function InventoryPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();

  const [rows, setRows] = React.useState<InventoryItemRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!user?.id) return;
        setLoading(true);
        setError(null);

        const data = await callRpc<RpcGetInventoryResponse, Record<string, unknown>>(
          "rpc_get_inventory_items",
          { p_requester_id: user.id, p_page: 1, p_items_per_page: 200 },
        );
        if (cancelled) return;
        setRows((data?.items ?? []).map((x) => ({ ...x, qty: Number(x.qty ?? 0), threshold: Number(x.threshold ?? 0) })));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <PageShell title="Clinic Inventory" subtitle="Keep stock healthy and avoid interruptions in treatment flow.">
      <View style={styles.table}>
        <View style={[styles.row, styles.header]}>
          <Text style={styles.h}>Item</Text>
          <Text style={styles.h}>Available</Text>
          <Text style={styles.h}>Threshold</Text>
          <Text style={styles.h}>Status</Text>
        </View>

        {loading && (
          <View style={{ padding: 16, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        )}

        {!loading && !!error && (
          <View style={{ padding: 16 }}>
            <Text style={{ color: theme.colors.error, fontWeight: "800" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && rows.length === 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ color: theme.colors.textSecondary, fontWeight: "700" }}>
              No inventory items yet.
            </Text>
          </View>
        )}

        {!loading &&
          !error &&
          rows.map((row) => {
          const low = row.qty < row.threshold;
          return (
            <View key={row.id} style={styles.row}>
              <Text style={styles.cell}>{row.name}</Text>
              <Text style={styles.cell}>{row.qty}</Text>
              <Text style={styles.cell}>{row.threshold}</Text>
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
    table: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface, overflow: "hidden" },
    row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    header: { backgroundColor: theme.colors.surfaceVariant },
    h: { flex: 1, color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
    cell: { flex: 1, color: theme.colors.text, fontWeight: "700" },
  });
