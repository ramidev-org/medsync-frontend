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

export type PrescriptionItemsPage = {
  items: DrugSuggestion[];
  page: number;
  pageSize: number;
  totalCount: number | null;
  hasNextPage: boolean;
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

export async function getPrescriptionItemsPage(
  requesterId: string,
  page = 1,
  pageSize = 6,
): Promise<PrescriptionItemsPage> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(50, Math.floor(pageSize)));
  if (!requesterId) {
    return { items: [], page: safePage, pageSize: safePageSize, totalCount: 0, hasNextPage: false };
  }

  // The deployed RPC currently exposes p_limit but no offset. Request one row
  // beyond the requested page, then slice locally so every page is still backed
  // by database data. If the RPC later returns total_count, use it automatically.
  const requestedLimit = safePage * safePageSize + 1;
  const { data, error } = await db.rpc("rpc_get_prescription_items", {
    p_requester_id: requesterId,
    p_limit: requestedLimit,
    p_query: null,
  });

  if (error) throw error;
  const rows = data ?? [];
  const offset = (safePage - 1) * safePageSize;
  const pageRows = rows.slice(offset, offset + safePageSize);
  const rawTotal = rows[0]?.total_count;
  const totalCount = Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : null;

  return {
    items: pageRows.map((r: any) => {
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
    }),
    page: safePage,
    pageSize: safePageSize,
    totalCount,
    hasNextPage: totalCount != null
      ? offset + pageRows.length < totalCount
      : rows.length > offset + safePageSize,
  };
}
