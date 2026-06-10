import { PageShell } from "@/components/page_shell";
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
  const [migrationMissing, setMigrationMissing] = React.useState(false);
  const [items, setItems] = React.useState<InventoryItemRow[]>([]);
  const [search, setSearch] = React.useState("");

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
        Alert.alert("Error", msg || "Failed to load inventory");
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
    <PageShell
      title="Clinic Inventory"
      subtitle="Stock control, reorder safety, and item-level adjustments."
      actions={headerActions}
    >
      {migrationMissing && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Database migration missing. Apply `database/sql/2026_05_09_inventory_and_chats.sql` in Supabase to enable inventory.
          </Text>
        </View>
      )}

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIntro}>
            <Text style={styles.heroEyebrow}>Inventory desk</Text>
            <Text style={styles.heroTitle}>Search, stock review, and item actions in one place.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Items" value={String(stats.totalItems)} tone={theme.colors.primary} theme={theme} />
          <StatCard label="Low Stock" value={String(stats.lowStock)} tone={theme.colors.error} theme={theme} />
          <StatCard label="Healthy" value={String(stats.healthy)} tone={theme.colors.success} theme={theme} />
        </View>
      </View>

      <View style={styles.listWrap}>
        <View style={styles.headerRow}>
          <Text style={styles.hCell}>Item</Text>
          <Text style={styles.hCell}>Stock</Text>
          <Text style={styles.hCell}>Threshold</Text>
          <Text style={styles.hCell}>State</Text>
          <Text style={styles.hCell}>Actions</Text>
        </View>

        <ScrollView>
          {items.length === 0 && !loading && (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No inventory items found.</Text>
            </View>
          )}
          {items.map((item) => {
            const low = Number(item.qty_on_hand ?? 0) < Number(item.reorder_threshold ?? 0);
            return (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemSub}>
                    {(item.sku && `SKU: ${item.sku}`) || "No SKU"}{item.unit ? ` • Unit: ${item.unit}` : ""}
                  </Text>
                </View>
                <Text style={styles.cell}>{String(item.qty_on_hand ?? 0)}</Text>
                <Text style={styles.cell}>{String(item.reorder_threshold ?? 0)}</Text>
                <Text style={[styles.cell, { color: low ? theme.colors.error : theme.colors.success, fontWeight: "900" }]}>
                  {low ? "Low" : "Healthy"}
                </Text>
                <TouchableOpacity style={styles.rowActionBtn} onPress={() => onOpenAdjust(item)}>
                  <Ionicons name="swap-horizontal-outline" size={16} color={theme.colors.text} />
                  <Text style={styles.rowActionText}>Adjust</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
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

function StatCard({ label, value, tone, theme }: { label: string; value: string; tone: string; theme: any }) {
  return (
    <View style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface, padding: 10 }}>
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", fontSize: 11 }}>{label}</Text>
      <Text style={{ color: tone, fontWeight: "900", fontSize: 20, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

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
      <Text style={{ color: theme.colors.textSecondary, fontWeight: "800", marginBottom: 6 }}>{label}</Text>
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
    heroCard: {
      marginBottom: 12,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: 12,
    },
    heroHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    heroIntro: {
      flex: 1,
    },
    heroEyebrow: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    heroTitle: {
      marginTop: 4,
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "900",
    },
    banner: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    bannerText: { fontWeight: "800", color: theme.colors.text },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
    },
    primaryBtnText: { color: "#fff", fontWeight: "900" },
    statsRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
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
    secondaryBtnText: { color: theme.colors.text, fontWeight: "800" },
    listWrap: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
      maxHeight: 520,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    hCell: { flex: 1, color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 8,
    },
    itemTitle: { color: theme.colors.text, fontWeight: "900" },
    itemSub: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 },
    cell: { flex: 1, color: theme.colors.text, fontWeight: "700" },
    rowActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: theme.colors.background,
    },
    rowActionText: { color: theme.colors.text, fontWeight: "800", fontSize: 12 },
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
    modalTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 17 },
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
    modalCancelText: { color: theme.colors.text, fontWeight: "800" },
    modalSaveBtn: {
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    modalSaveText: { color: "#fff", fontWeight: "900" },
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
    adjustBtnText: { color: "#fff", fontWeight: "900" },
  });

