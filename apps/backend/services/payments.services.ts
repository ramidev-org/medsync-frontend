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

function isMissingPaymentsRpc(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes('RPC "rpc_get_payments" was not found') || message.includes("rpc_get_payments");
}

async function resolveIdentity(params: PaymentParams) {
  let requesterId = params.requesterId;
  let clinicId = params.clinicId;

  if (!requesterId) {
    const { data } = await db.auth.getUser();
    requesterId = data.user?.id;
  }
  if (!requesterId) throw new Error("Sign in to load payments.");

  if (!clinicId) {
    const { data, error } = await db
      .from("users_metadata")
      .select("clinic_id")
      .eq("id", requesterId)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    clinicId = data?.clinic_id ? String(data.clinic_id) : undefined;
  }
  if (!clinicId) throw new Error("Your account is not connected to a clinic.");

  return { requesterId, clinicId };
}

export const getPayments = async (params: PaymentParams = {}): Promise<Payment[]> => {
  const identity = await resolveIdentity(params);

  try {
    const response = await callRpc<PaymentRpcResponse, Record<string, unknown>>("rpc_get_payments", {
      p_requester_id: identity.requesterId,
    });
    return (response?.payments ?? []).map(mapPayment);
  } catch (error) {
    if (!isMissingPaymentsRpc(error)) throw error;
  }

  const { data: patients, error: patientsError } = await db
    .from("patients")
    .select("id, first_name, last_name, code")
    .eq("clinic_id", identity.clinicId);
  if (patientsError) throw new Error(patientsError.message || "Unable to load payment patients.");

  const patientMap = new Map<string, { first_name: string; last_name: string; code: string }>();
  for (const patient of patients ?? []) {
    patientMap.set(String((patient as any).id), {
      first_name: String((patient as any).first_name ?? ""),
      last_name: String((patient as any).last_name ?? ""),
      code: String((patient as any).code ?? ""),
    });
  }
  if (patientMap.size === 0) return [];

  const { data: payments, error: paymentsError } = await db
    .from("payments")
    .select("id, amount, created_at, visit_id, patient_id, reference, method, status")
    .in("patient_id", [...patientMap.keys()])
    .order("created_at", { ascending: false });
  if (paymentsError) throw new Error(paymentsError.message || "Unable to load payments.");

  return (payments ?? []).map((payment: any) => {
    const patient = patientMap.get(String(payment.patient_id));
    return mapPayment({
      ...payment,
      patient_first_name: patient?.first_name,
      patient_last_name: patient?.last_name,
      patient_code: patient?.code,
    });
  });
};
