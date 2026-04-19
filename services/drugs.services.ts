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

export async function searchDrugsByName(
  query: string,
  limit = 7,
): Promise<DrugSuggestion[]> {
  const q = (query ?? "").trim();
  if (!q) return [];

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
