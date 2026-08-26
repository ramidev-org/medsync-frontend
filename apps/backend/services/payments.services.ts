import { db } from "@/database/database_conn";
import { callRpc } from "@/services/backend";

export interface Payment {
  id: string;
  amount: number;
  createdAt: string;
  visitId: string | null;
  patientId: string;
  reference: string | null;
  method: string;
  status: string;
  nom: string;
  prenom: string;
  code: string;
}

type PaymentRpcRow = {
  id: string;
  amount: number;
  created_at: string;
  visit_id?: string | null;
  patient_id: string;
  reference?: string | null;
  method?: string | null;
  status?: string | null;
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  patient_code?: string | null;
};

type PaymentRpcResponse = { payments: PaymentRpcRow[] };

type PaymentParams = {
  requesterId?: string;
  clinicId?: string;
};

function statusLabel(raw: unknown) {
  const value = String(raw ?? "").toLowerCase();
  if (value === "paid") return "Paye";
  if (value === "pending") return "En attente";
  if (value === "partial") return "Partiel";
  if (value === "cancelled") return "Annule";
  if (value === "failed") return "Echoue";
  if (value === "refunded") return "Rembourse";
  return String(raw ?? "");
}

function mapPayment(row: PaymentRpcRow): Payment {
  return {
    id: String(row.id),
    amount: Number(row.amount ?? 0),
    createdAt: String(row.created_at),
    visitId: row.visit_id ?? null,
    patientId: String(row.patient_id ?? ""),
    reference: row.reference ?? null,
    method: String(row.method ?? ""),
    status: statusLabel(row.status),
    nom: String(row.patient_last_name ?? ""),
    prenom: String(row.patient_first_name ?? ""),
    code: String(row.patient_code ?? ""),
  };
}

async function resolveIdentity(params: PaymentParams) {
  let requesterId = params.requesterId;

  if (!requesterId) {
    const { data } = await db.auth.getUser();
    requesterId = data.user?.id;
  }
  if (!requesterId) throw new Error("Sign in to load payments.");

  return { requesterId };
}

export const getPayments = async (params: PaymentParams = {}): Promise<Payment[]> => {
  const identity = await resolveIdentity(params);

  const response = await callRpc<PaymentRpcResponse, Record<string, unknown>>("rpc_get_payments", {
    p_requester_id: identity.requesterId,
  });
  return (response?.payments ?? []).map(mapPayment);
};
