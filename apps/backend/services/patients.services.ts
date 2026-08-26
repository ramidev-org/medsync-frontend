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

export async function getPatients(params: PatientListParams): Promise<PatientListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const itemsPerPage = Math.max(1, params.itemsPerPage ?? 50);

  return await callRpc<PatientListResponse, Record<string, unknown>>("rpc_get_patients", {
    p_requester_id: params.requesterId,
    p_search: params.search?.trim() || null,
    p_start_date: params.startDate ?? null,
    p_end_date: params.endDate ?? null,
    p_page: page,
    p_items_per_page: itemsPerPage,
  });
}
