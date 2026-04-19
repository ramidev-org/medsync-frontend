import { IS_DEMO } from "@/config/runtime";
import { db } from "@/database/database_conn";

export type DrugSuggestion = {
  id: string;
  code: string;
  brandName: string;
  form?: string | null;
  dosage?: string | null;
  label: string;
};

const buildDrugLabel = (d: { brandName: string; dosage?: any; form?: any; code?: any }) =>
  [d.brandName, d.dosage, d.form].map((x) => String(x ?? "").trim()).filter(Boolean).join(" ");

const DEMO_DRUGS: DrugSuggestion[] = [
  { id: "demo_d0001", code: "D0001", brandName: "GRIPEX ALLERGIE", form: "Comprimé", dosage: "10MG" },
  { id: "demo_d0002", code: "D0002", brandName: "GRIPEX GLES", form: "Microgranules", dosage: "50MG/4MG" },
  { id: "demo_d0003", code: "D0003", brandName: "GRIPEX PLUS", form: "Comprimé", dosage: "200MG/30MG" },
  { id: "demo_d0004", code: "D0004", brandName: "GRIPEX TOUX GRASSE", form: "Solution buvable", dosage: "5%" },
  { id: "demo_d0005", code: "D0005", brandName: "AUGMENTIN", form: "Comprimé", dosage: "500MG/125MG" },
  { id: "demo_d0006", code: "D0006", brandName: "DOLIPRANE", form: "Comprimé", dosage: "1000MG" },
  { id: "demo_d0007", code: "D0007", brandName: "SPASFON", form: "Comprimé", dosage: "80MG" },
].map((d) => ({ ...d, label: buildDrugLabel(d) }));

export async function searchDrugsByName(
  query: string,
  limit = 7,
): Promise<DrugSuggestion[]> {
  const q = (query ?? "").trim();
  if (!q) return [];

  if (IS_DEMO) {
    const lower = q.toLowerCase();
    return DEMO_DRUGS.filter(
      (d) =>
        d.label.toLowerCase().includes(lower) ||
        d.code.toLowerCase().includes(lower) ||
        d.brandName.toLowerCase().includes(lower),
    ).slice(0, limit);
  }

  const { data, error } = await db
    .from("drugs")
    .select("id, code, brand_name, form, dosage")
    .or(`brand_name.ilike.%${q}%,code.ilike.%${q}%`)
    .eq("active", true)
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((r: any) => {
    const d = {
      id: String(r.id),
      code: String(r.code ?? ""),
      brandName: String(r.brand_name ?? ""),
      form: r.form ?? null,
      dosage: r.dosage ?? null,
    };
    return { ...d, label: buildDrugLabel(d) };
  });
}
