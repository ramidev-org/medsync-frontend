import { PageShell } from "@/components/page_shell";
import { useTheme } from "@/theme/theme_provider";
import { StyleSheet, Text, View } from "react-native";

const STOCK = [
  { item: "Anesthetic Carpules", qty: 124, threshold: 80 },
  { item: "Composite Resin Kits", qty: 14, threshold: 20 },
  { item: "Sterile Gloves Boxes", qty: 42, threshold: 30 },
  { item: "Sutures", qty: 11, threshold: 15 },
];

export default function InventoryPage() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <PageShell title="Clinic Inventory" subtitle="Keep stock healthy and avoid interruptions in treatment flow.">
      <View style={styles.table}>
        <View style={[styles.row, styles.header]}>
          <Text style={styles.h}>Item</Text>
          <Text style={styles.h}>Available</Text>
          <Text style={styles.h}>Threshold</Text>
          <Text style={styles.h}>Status</Text>
        </View>
        {STOCK.map((row) => {
          const low = row.qty < row.threshold;
          return (
            <View key={row.item} style={styles.row}>
              <Text style={styles.cell}>{row.item}</Text>
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
