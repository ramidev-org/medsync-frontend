import { DataState } from "@/components/common/data_state";
import { PageShell } from "@/components/layout/page_shell";
import { useAuth } from "@/contexts/auth_context";
import type { InventoryItemRow } from "@/services/backend.types";
import { adjustInventory, getInventory, upsertInventoryItem } from "@/services/inventory.services";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AddItemForm = {
  name: string;
  sku: string;
  unit: string;
  threshold: string;
  notes: string;
};

const emptyAddItemForm = (): AddItemForm => ({
  name: "",
  sku: "",
  unit: "",
  threshold: "0",
  notes: "",
});

export default function InventoryPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [migrationMissing, setMigrationMissing] = React.useState(false);
  const [items, setItems] = React.useState<InventoryItemRow[]>([]);
  const [search, setSearch] = React.useState("");
  const [stockFilter, setStockFilter] = React.useState<"all" | "low">("all");
  const [sortBy, setSortBy] = React.useState<"name" | "stock">("name");

  const [addOpen, setAddOpen] = React.useState(false);
  const [addSaving, setAddSaving] = React.useState(false);
  const [addForm, setAddForm] = React.useState<AddItemForm>(emptyAddItemForm());

  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustSaving, setAdjustSaving] = React.useState(false);
  const [selected, setSelected] = React.useState<InventoryItemRow | null>(null);
  const [adjustDelta, setAdjustDelta] = React.useState("1");
  const [adjustReason, setAdjustReason] = React.useState("");

  const refresh = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      setMigrationMissing(false);
      const res = await getInventory({
        requesterId: user.id,
        search: search.trim() || undefined,
        page: 1,
        itemsPerPage: 120,
      });
      setItems(res?.items ?? []);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      const notFound = msg.toLowerCase().includes("was not found") || msg.includes("404");
      if (notFound) {
        setMigrationMissing(true);
        setItems([]);
      } else {
        setItems([]);
        setError(msg || "Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  }, [search, user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = React.useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter(
      (item) => Number(item.qty_on_hand ?? 0) < Number(item.reorder_threshold ?? 0),
    ).length;
    const healthy = totalItems - lowStock;
    return { totalItems, lowStock, healthy };
  }, [items]);

  const visibleItems = React.useMemo(() => {
    const filtered = stockFilter === "low"
      ? items.filter((item) => Number(item.qty_on_hand ?? 0) < Number(item.reorder_threshold ?? 0))
      : items;
    return [...filtered].sort((a, b) => {
      if (sortBy === "stock") return Number(b.qty_on_hand ?? 0) - Number(a.qty_on_hand ?? 0);
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
  }, [items, sortBy, stockFilter]);

  const onOpenAdjust = (item: InventoryItemRow) => {
    setSelected(item);
    setAdjustDelta("1");
    setAdjustReason("");
    setAdjustOpen(true);
  };

  const onSaveAdd = async () => {
    if (!user?.id) return;
    if (!addForm.name.trim()) {
      Alert.alert("Validation", "Item name is required.");
      return;
    }
    setAddSaving(true);
    try {
      await upsertInventoryItem({
        requesterId: user.id,
        name: addForm.name.trim(),
        sku: addForm.sku.trim() || null,
        unit: addForm.unit.trim() || null,
        reorderThreshold: toNumOrNull(addForm.threshold) ?? 0,
        notes: addForm.notes.trim() || null,
      });
      setAddOpen(false);
      setAddForm(emptyAddItemForm());
      await refresh();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save item");
    } finally {
      setAddSaving(false);
    }
  };

  const onApplyAdjust = async (sign: 1 | -1) => {
    if (!user?.id || !selected?.id) return;
    const value = Math.abs(toNumOrNull(adjustDelta) ?? 0);
    if (value <= 0) {
      Alert.alert("Validation", "Enter a quantity greater than 0.");
      return;
    }
    setAdjustSaving(true);
    try {
      await adjustInventory({
        requesterId: user.id,
        itemId: selected.id,
        delta: sign * value,
        reason: adjustReason.trim() || null,
      });
      setAdjustOpen(false);
      await refresh();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to adjust stock");
    } finally {
      setAdjustSaving(false);
    }
  };

  const headerActions = (
    <>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
        <TextInput
          placeholder="Search by name or SKU"
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>
      <TouchableOpacity style={styles.secondaryBtn} onPress={refresh}>
        <Ionicons name="refresh" size={16} color={theme.colors.text} />
        <Text style={styles.secondaryBtnText}>{loading ? "Loading..." : "Refresh"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setAddOpen(true)}>
        <Ionicons name="add-outline" size={16} color="#fff" />
        <Text style={styles.primaryBtnText}>Add Item</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <PageShell scrollable={false}>
      <View style={styles.pageContent}>
        <View style={styles.headerArea}>
          <View style={styles.headerCopy}>
            <Text style={styles.pageTitle}>Clinic Inventory</Text>
            <Text style={styles.pageSubtitle}>Track, monitor, and manage clinic stock and supplies.</Text>
          </View>
          <View style={styles.headerActions}>{headerActions}</View>
        </View>
        {migrationMissing && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Database migration missing. Apply `database/sql/2026_05_09_inventory_and_chats.sql` in Supabase to enable inventory.
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <StatCard icon="cube-outline" label="Items" value={String(stats.totalItems)} tone={theme.colors.primary} theme={theme} />
          <StatCard icon="alert-circle-outline" label="Low stock" value={String(stats.lowStock)} tone={theme.colors.error} theme={theme} />
          <StatCard icon="shield-checkmark-outline" label="Healthy" value={String(stats.healthy)} tone={theme.colors.success} theme={theme} />
        </View>

        <View style={styles.tableToolbar}>
          <Text style={styles.resultsText}>{visibleItems.length} items</Text>
          <View style={styles.toolbarActions}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => setStockFilter((value) => value === "all" ? "low" : "all")}>
              <Ionicons name="options-outline" size={16} color={theme.colors.text} />
              <Text style={styles.toolbarBtnText}>{stockFilter === "low" ? "Low stock" : "Filter"}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => setSortBy((value) => value === "name" ? "stock" : "name")}>
              <Ionicons name="swap-vertical-outline" size={16} color={theme.colors.text} />
              <Text style={styles.toolbarBtnText}>Sort: {sortBy === "name" ? "Name (A-Z)" : "Stock"}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listWrap}>
          <View style={styles.headerRow}>
            <Text style={[styles.hCell, styles.itemColumn]}>Item</Text>
            <Text style={[styles.hCell, styles.skuColumn]}>SKU</Text>
            <Text style={styles.hCell}>In Stock</Text>
            <Text style={styles.hCell}>Threshold</Text>
            <Text style={styles.hCell}>Status</Text>
            <Text style={styles.hCell}>Actions</Text>
          </View>

          <ScrollView style={styles.listScroller} contentContainerStyle={styles.listScrollerContent}>
            <DataState
              loading={loading}
              error={error}
              onRetry={refresh}
              isEmpty={items.length === 0 && !migrationMissing}
              emptyIcon="cube-outline"
              emptyTitle="No inventory items found"
              emptyBody="Add your first item to start tracking clinic stock."
              loadingLabel="Loading inventory…"
            >
            {visibleItems.map((item) => {
              const low = Number(item.qty_on_hand ?? 0) < Number(item.reorder_threshold ?? 0);
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemCell}>
                    <View style={styles.itemIcon}>
                      <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemSub}>{item.unit ? `Unit: ${item.unit}` : "No unit"}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cell, styles.skuColumn]}>{item.sku || "-"}</Text>
                  <Text style={styles.cell}>{String(item.qty_on_hand ?? 0)}</Text>
                  <Text style={styles.cell}>{String(item.reorder_threshold ?? 0)}</Text>
                  <View style={styles.cell}><View style={[styles.statusBadge, { backgroundColor: low ? "#fff1f2" : "#effaf4", borderColor: low ? "#fecdd3" : "#cceedd" }]}><Text style={{ color: low ? theme.colors.error : theme.colors.success, fontWeight: "700", fontSize: 12 }}>{low ? "Low stock" : "Healthy"}</Text></View></View>
                  <TouchableOpacity style={styles.rowActionBtn} onPress={() => onOpenAdjust(item)}>
                    <Ionicons name="swap-horizontal-outline" size={16} color={theme.colors.text} />
                    <Text style={styles.rowActionText}>Adjust</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            </DataState>
          </ScrollView>
        </View>
      </View>

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Inventory Item</Text>
            <Input label="Item Name *" value={addForm.name} onChangeText={(v) => setAddForm((p) => ({ ...p, name: v }))} theme={theme} />
            <Input label="SKU" value={addForm.sku} onChangeText={(v) => setAddForm((p) => ({ ...p, sku: v }))} theme={theme} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label="Unit" value={addForm.unit} onChangeText={(v) => setAddForm((p) => ({ ...p, unit: v }))} theme={theme} />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Reorder Threshold"
                  value={addForm.threshold}
                  onChangeText={(v) => setAddForm((p) => ({ ...p, threshold: v }))}
                  theme={theme}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Input label="Notes" value={addForm.notes} onChangeText={(v) => setAddForm((p) => ({ ...p, notes: v }))} theme={theme} multiline />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={onSaveAdd} disabled={addSaving}>
                <Text style={styles.modalSaveText}>{addSaving ? "Saving..." : "Save Item"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={adjustOpen} transparent animationType="fade" onRequestClose={() => setAdjustOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust Stock</Text>
            <Text style={styles.adjustItemName}>{selected?.name || ""}</Text>
            <Input label="Quantity" value={adjustDelta} onChangeText={setAdjustDelta} theme={theme} keyboardType="numeric" />
            <Input label="Reason" value={adjustReason} onChangeText={setAdjustReason} theme={theme} />

            <View style={styles.adjustActions}>
              <TouchableOpacity
                style={[styles.adjustBtn, { backgroundColor: theme.colors.error }]}
                onPress={() => onApplyAdjust(-1)}
                disabled={adjustSaving}
              >
                <Ionicons name="remove-outline" size={16} color="#fff" />
                <Text style={styles.adjustBtnText}>{adjustSaving ? "Applying..." : "Subtract"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adjustBtn, { backgroundColor: theme.colors.success }]}
                onPress={() => onApplyAdjust(1)}
                disabled={adjustSaving}
              >
                <Ionicons name="add-outline" size={16} color="#fff" />
                <Text style={styles.adjustBtnText}>{adjustSaving ? "Applying..." : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

function toNumOrNull(value: string) {
  const clean = String(value ?? "").trim();
  if (!clean) return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function StatCard({ icon, label, value, tone, theme }: { icon: any; label: string; value: string; tone: string; theme: any }) {
  return (
    <View style={statStyles.stat}>
      <View style={[statStyles.icon, { backgroundColor: `${tone}12` }]}>
        <Ionicons name={icon} size={32} color={tone} />
      </View>
      <View>
        <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 }}>{label}</Text>
        <Text style={{ color: tone, fontWeight: "800", fontSize: 28, marginTop: 2 }}>{value}</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>{label === "Items" ? "All inventory items" : label === "Low stock" ? "Reorder soon" : "Well stocked"}</Text>
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  stat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 0 },
  icon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
});

function Input({
  label,
  value,
  onChangeText,
  theme,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: any;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "600", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          minHeight: multiline ? 84 : 42,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
          color: theme.colors.text,
          backgroundColor: theme.colors.background,
          textAlignVertical: multiline ? "top" : "center",
          fontWeight: "700",
        }}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    pageContent: { flex: 1, minHeight: 0 },
    headerArea: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 28 },
    headerCopy: { flex: 1, minWidth: 260 },
    pageTitle: { color: theme.colors.text, fontSize: 27, fontWeight: "800" },
    pageSubtitle: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: "600", marginTop: 6 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
    statsRow: { flexDirection: "row", gap: 16, marginBottom: 30, flexWrap: "wrap" },
    banner: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    bannerText: { fontWeight: "600", color: theme.colors.text },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
    },
    primaryBtnText: { color: "#fff", fontWeight: "700" },
    tableToolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 10, flexWrap: "wrap" },
    resultsText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 },
    toolbarActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    toolbarBtn: { height: 38, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 9, backgroundColor: theme.colors.surface },
    toolbarBtnText: { color: theme.colors.text, fontWeight: "700", fontSize: 12 },
    searchWrap: {
      flex: 1,
      minWidth: 220,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      minHeight: 42,
      backgroundColor: theme.colors.surface,
    },
    searchInput: { flex: 1, color: theme.colors.text, fontWeight: "700" },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 42,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    secondaryBtnText: { color: theme.colors.text, fontWeight: "600" },
    listWrap: {
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
    },
    listScroller: { flex: 1 },
    listScrollerContent: { flexGrow: 1 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 8,
    },
    hCell: { flex: 1, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    itemColumn: { flex: 2 },
    skuColumn: { flex: 1.15 },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 14,
      gap: 8,
    },
    itemCell: { flex: 2, minWidth: 220, flexDirection: "row", alignItems: "center", gap: 10 },
    itemIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: `${theme.colors.primary}0d`, alignItems: "center", justifyContent: "center" },
    itemTitle: { color: theme.colors.text, fontWeight: "700" },
    itemSub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    cell: { flex: 1, color: theme.colors.text, fontWeight: "700", minWidth: 90 },
    statusBadge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6 },
    rowActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    rowActionText: { color: theme.colors.text, fontWeight: "600", fontSize: 12 },
    emptyRow: { padding: 16 },
    emptyText: { color: theme.colors.textSecondary, fontWeight: "700" },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    modalCard: {
      width: "100%",
      maxWidth: 560,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 14,
    },
    modalTitle: { color: theme.colors.text, fontWeight: "700", fontSize: 17 },
    modalActions: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
    modalCancelBtn: {
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background,
    },
    modalCancelText: { color: theme.colors.text, fontWeight: "600" },
    modalSaveBtn: {
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    modalSaveText: { color: "#fff", fontWeight: "700" },
    adjustItemName: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700" },
    adjustActions: { marginTop: 14, flexDirection: "row", gap: 8 },
    adjustBtn: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    adjustBtnText: { color: "#fff", fontWeight: "700" },
  });
