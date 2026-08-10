import { db } from "@/database/database_conn";
import { callRpc } from "@/services/backend";

export type PatientListRow = {
  id: string;
  code?: string | null;
  first_name: string;
  last_name: string;
  age: number;
  sex?: "male" | "female";
  phone?: string | null;
  address_city?: string | null;
  created_at?: string | null;
};

export type PatientListResponse = {
  patients: PatientListRow[];
  total: number;
};

type PatientListParams = {
  requesterId: string;
  clinicId: string;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  itemsPerPage?: number;
};

function isMissingPatientRpc(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes('RPC "rpc_get_patients" was not found') || message.includes("rpc_get_patients");
}

function calculateAge(dateOfBirth: unknown) {
  const birthDate = new Date(String(dateOfBirth ?? ""));
  if (Number.isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}

export async function getPatients(params: PatientListParams): Promise<PatientListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const itemsPerPage = Math.max(1, params.itemsPerPage ?? 50);

  try {
    return await callRpc<PatientListResponse, Record<string, unknown>>("rpc_get_patients", {
      p_requester_id: params.requesterId,
      p_search: params.search?.trim() || null,
      p_start_date: params.startDate ?? null,
      p_end_date: params.endDate ?? null,
      p_page: page,
      p_items_per_page: itemsPerPage,
    });
  } catch (error) {
    if (!isMissingPatientRpc(error)) throw error;
  }

  let query = db
    .from("patients")
    .select(
      "id, code, first_name, last_name, date_of_birth, sex, phone, address_city, created_at",
      { count: "exact" },
    )
    .eq("clinic_id", params.clinicId)
    .order("created_at", { ascending: false });

  if (params.search?.trim()) {
    const escapedSearch = params.search.trim().replace(/[,%()]/g, " ");
    query = query.or(
      `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,code.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%`,
    );
  }
  if (params.startDate) query = query.gte("created_at", params.startDate);
  if (params.endDate) query = query.lte("created_at", params.endDate);

  const from = (page - 1) * itemsPerPage;
  const { data, count, error } = await query.range(from, from + itemsPerPage - 1);
  if (error) throw new Error(error.message || "Unable to load patients.");

  return {
    patients: (data ?? []).map((row: any) => ({
      id: String(row.id),
      code: row.code ?? null,
      first_name: String(row.first_name ?? ""),
      last_name: String(row.last_name ?? ""),
      age: calculateAge(row.date_of_birth),
      sex: row.sex,
      phone: row.phone ?? null,
      address_city: row.address_city ?? null,
      created_at: row.created_at ?? null,
    })),
    total: count ?? 0,
  };
}
