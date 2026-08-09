import { PageShell } from "@/components/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import type { ClinicServiceRow } from "@/services/backend.types";
import { createTableStyles } from "@/theme/table_styles";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RpcGetServicesResponse = {
  services: ClinicServiceRow[];
  total: number;
  page: number;
  itemsPerPage: number;
};

type ServiceForm = {
  id?: string | null;
  code: string;
  name: string;
  category: string;
  color: string;
  duration_minutes: string; // keep as text in form
  price: string;
  cost: string;
  active: boolean;
};

const emptyForm = (): ServiceForm => ({
  id: null,
  code: "",
  name: "",
  category: "",
  color: "#3B82F6",
  duration_minutes: "30",
  price: "",
  cost: "",
  active: true,
});

const toNumOrNull = (v: string) => {
  const t = String(v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export default function ServicesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const tableStyles = createTableStyles(theme);

  const [loading, setLoading] = React.useState(true);
  const [migrationMissing, setMigrationMissing] = React.useState(false);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  const [rows, setRows] = React.useState<ClinicServiceRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 50;

  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<ServiceForm>(emptyForm());

  const refresh = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setMigrationMissing(false);
      const res = await callRpc<RpcGetServicesResponse, Record<string, unknown>>("rpc_get_services", {
        p_requester_id: user.id,
        p_search: search || null,
        p_page: page,
        p_items_per_page: itemsPerPage,
      });

      setRows(res?.services ?? []);
      setTotal(Number(res?.total ?? 0) || 0);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      const notFound = msg.toLowerCase().includes("was not found") || msg.includes("404");
      if (notFound) {
        setMigrationMissing(true);
        setRows([]);
        setTotal(0);
      } else {
        Alert.alert("Erreur", msg || "Impossible de charger les services");
      }
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, page, search, user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (s: ClinicServiceRow) => {
    setForm({
      id: s.id,
      code: s.code ?? "",
      name: s.name ?? "",
      category: s.category ?? "",
      color: s.color ?? "#3B82F6",
      duration_minutes: s.duration_minutes == null ? "" : String(s.duration_minutes),
      price: s.price == null ? "" : String(s.price),
      cost: s.cost == null ? "" : String(s.cost),
      active: !!s.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user?.id) return;
    if (!form.name.trim()) {
      Alert.alert("Validation", "Le nom du service est requis.");
      return;
    }

    setSaving(true);
    try {
      await callRpc<string, Record<string, unknown>>("rpc_upsert_service", {
        p_requester_id: user.id,
        p_service_id: form.id || null,
        p_code: form.code.trim() ? form.code.trim() : null,
        p_name: form.name.trim(),
        p_category: form.category.trim() ? form.category.trim() : null,
        p_color: form.color.trim() ? form.color.trim() : null,
        p_duration_minutes: toNumOrNull(form.duration_minutes),
        p_price: toNumOrNull(form.price),
        p_cost: toNumOrNull(form.cost),
        p_active: !!form.active,
      });
      setOpen(false);
      await refresh();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: ClinicServiceRow) => {
    if (!user?.id) return;
    try {
      await callRpc<boolean, Record<string, unknown>>("rpc_set_service_active", {
        p_requester_id: user.id,
        p_service_id: s.id,
        p_active: !s.active,
      });
      await refresh();
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Impossible de modifier");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <PageShell
      title="Services"
      subtitle="Catalogue, tarifs, durées et catégories (inspiré Yolo)"
      actions={
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Rechercher un service..."
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.searchInput}
              onSubmitEditing={() => {
                setPage(1);
                setSearch(searchInput);
              }}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => {
              setPage(1);
              setSearch(searchInput);
            }}
          >
            <Text style={styles.searchBtnText}>Rechercher</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Nouveau service</Text>
          </TouchableOpacity>
        </View>
      }
    >
      {migrationMissing && (
        <View style={styles.banner}>
          <Ionicons name="warning-outline" size={18} color={theme.colors.text} />
          <Text style={styles.bannerText}>
            Migration DB manquante. Applique `database/sql/2026_04_30_yolo_web_phase1.sql` dans Supabase pour activer
            les services.
          </Text>
        </View>
      )}

      <View style={[tableStyles.tableHeader, { marginTop: 12 }]}>
        <Text style={[tableStyles.headerCell, { flex: 2.2 }]}>Service</Text>
        <Text style={[tableStyles.headerCell, { flex: 1 }]}>Catégorie</Text>
        <Text style={[tableStyles.headerCell, { width: 110, textAlign: "right" }]}>Durée</Text>
        <Text style={[tableStyles.headerCell, { width: 120, textAlign: "right" }]}>Prix</Text>
        <Text style={[tableStyles.headerCell, { width: 160, textAlign: "right" }]}>Actions</Text>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 30 }}>
          <Text style={{ color: theme.colors.textSecondary, fontWeight: "600" }}>
            Chargement…
          </Text>
        </View>
      ) : (
        rows.map((s, idx) => (
          <View
            key={s.id}
            style={[
              tableStyles.tableRow,
              { backgroundColor: idx % 2 === 0 ? theme.colors.surface : theme.colors.backgroundAlt },
            ]}
          >
            <View style={{ flex: 2.2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: s.color || theme.colors.primary,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[tableStyles.cell, { fontWeight: "700" }]}>{s.name}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12 }}>
                    {s.code ? `Code: ${s.code}` : "—"}
                    {s.active ? "" : " • Inactif"}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[tableStyles.cell, { flex: 1 }]}>{s.category || "—"}</Text>
            <Text style={[tableStyles.cell, { width: 110, textAlign: "right" }]}>
              {s.duration_minutes == null ? "—" : `${s.duration_minutes} min`}
            </Text>
            <Text style={[tableStyles.cell, { width: 120, textAlign: "right" }]}>
              {s.price == null ? "—" : String(s.price)}
            </Text>

            <View style={{ width: 160, flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity style={styles.rowBtn} onPress={() => openEdit(s)}>
                <Ionicons name="create-outline" size={16} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.rowBtn} onPress={() => toggleActive(s)}>
                <Ionicons name={s.active ? "pause-outline" : "play-outline"} size={16} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {!loading && !rows.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucun service</Text>
          <Text style={styles.emptyText}>
            Ajoutez vos soins (consultation, radio, détartrage, etc.) pour facturation, statistiques et planning.
          </Text>
        </View>
      )}

      {!loading && totalPages > 1 && (
        <View style={styles.paginationRow}>
          <Text style={styles.paginationText}>
            Page {page}/{totalPages} • {total} total
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[styles.pageBtn, page <= 1 && { opacity: 0.5 }]}
              disabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
              <Text style={styles.pageBtnText}>Préc.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageBtn, page >= totalPages && { opacity: 0.5 }]}
              disabled={page >= totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <Text style={styles.pageBtnText}>Suiv.</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <Text style={styles.modalTitle}>{form.id ? "Modifier service" : "Nouveau service"}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.rowBtn}>
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
              <Field theme={theme} label="Nom" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
              <Field theme={theme} label="Code (optionnel)" value={form.code} onChange={(v) => setForm((p) => ({ ...p, code: v }))} />
              <Field theme={theme} label="Catégorie" value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} />
              <Field theme={theme} label="Couleur (hex)" value={form.color} onChange={(v) => setForm((p) => ({ ...p, color: v }))} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    theme={theme}
                    label="Durée (min)"
                    value={form.duration_minutes}
                    onChange={(v) => setForm((p) => ({ ...p, duration_minutes: v }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    theme={theme}
                    label="Prix"
                    value={form.price}
                    onChange={(v) => setForm((p) => ({ ...p, price: v }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Field
                theme={theme}
                label="Coût (optionnel)"
                value={form.cost}
                onChange={(v) => setForm((p) => ({ ...p, cost: v }))}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{saving ? "Sauvegarde…" : "Enregistrer"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

function Field({
  theme,
  label,
  value,
  onChange,
  keyboardType,
}: {
  theme: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: "600", color: theme.colors.textSecondary }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder=""
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          marginTop: 6,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === "web" ? 10 : 10,
          color: theme.colors.text,
          fontWeight: "600",
        }}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      minWidth: 260,
    },
    searchInput: { flex: 1, fontWeight: "600", color: theme.colors.text },
    searchBtn: {
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    searchBtnText: { color: theme.colors.text, fontWeight: "700" },
    primaryBtn: {
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    primaryBtnText: { color: "#fff", fontWeight: "700" },

    banner: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    bannerText: { flex: 1, fontWeight: "600", color: theme.colors.text },

    rowBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },

    empty: {
      marginTop: 14,
      padding: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      gap: 6,
    },
    emptyTitle: { fontWeight: "700", color: theme.colors.text },
    emptyText: { textAlign: "center", color: theme.colors.textSecondary, fontWeight: "700" },

    paginationRow: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
    },
    paginationText: { color: theme.colors.textSecondary, fontWeight: "600" },
    pageBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 10,
      height: 40,
    },
    pageBtnText: { fontWeight: "700", color: theme.colors.text },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    modalCard: {
      width: "100%",
      maxWidth: 680,
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      maxHeight: "86%",
    },
    modalTitle: { fontWeight: "700", fontSize: 16, color: theme.colors.text },
    saveBtn: {
      marginTop: 14,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    saveBtnText: { color: "#fff", fontWeight: "700" },
  });
