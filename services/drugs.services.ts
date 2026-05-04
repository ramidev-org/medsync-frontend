import { db } from "@/database/database_conn";

export type DrugSuggestion = {
  id: string;
  drugName: string;
  brand?: string | null;
  form?: string | null;
  dose?: string | null;
  laboratory?: string | null;
  country?: string | null;
  label: string;
};

const buildDrugLabel = (d: { drugName: string; dose?: any; form?: any; brand?: any }) =>
  [d.drugName, d.dose, d.form, d.brand]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(" ");

export async function searchDrugsByName(
  requesterId: string,
  query: string,
  limit = 7,
): Promise<DrugSuggestion[]> {
  const q = (query ?? "").trim();
  if (!q || !requesterId) return [];

  const { data, error } = await db.rpc("rpc_get_prescription_items", {
    p_requester_id: requesterId,
    p_limit: limit,
    p_query: q,
  });

  if (error) throw error;
  return (data ?? []).map((r: any) => {
    const d = {
      id: String(r.id),
      drugName: String(r.drug_name ?? ""),
      brand: r.brand ?? null,
      form: r.form ?? null,
      dose: r.dose ?? null,
      laboratory: r.laboratory ?? null,
      country: r.country ?? null,
    };
    return { ...d, label: buildDrugLabel(d) };
  });
}

export async function getPrescriptionItems(
  requesterId: string,
  limit = 20,
): Promise<DrugSuggestion[]> {
  if (!requesterId) return [];
  const { data, error } = await db.rpc("rpc_get_prescription_items", {
    p_requester_id: requesterId,
    p_limit: limit,
    p_query: null,
  });

  if (error) throw error;
  return (data ?? []).map((r: any) => {
    const d = {
      id: String(r.id),
      drugName: String(r.drug_name ?? ""),
      brand: r.brand ?? null,
      form: r.form ?? null,
      dose: r.dose ?? null,
      laboratory: r.laboratory ?? null,
      country: r.country ?? null,
    };
    return { ...d, label: buildDrugLabel(d) };
  });
}
