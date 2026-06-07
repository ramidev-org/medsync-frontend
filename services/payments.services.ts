import { db } from "@/database/database_conn";

export interface Payment {
  id: string;
  amount: number;
  createdAt: string;
  visitId: string;
  patientId: string;
  method: string;
  status: string;
  nom: string;
  prenom: string;
  code: string;
}

export const getPayments = async (): Promise<Payment[]> => {
  const { data, error } = await db
    .from('payments')
    .select(`
      id,
      amount,
      created_at,
      visit_id,
      patient_id,
      method,
      status,
      patients!inner(first_name, last_name, code)
    `);

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  const statusLabel = (raw: unknown) => {
    const v = String(raw ?? "").toLowerCase();
    if (v === "paid") return "Payé";
    if (v === "pending") return "En attente";
    if (v === "partial") return "Partiel";
    if (v === "cancelled") return "Annulé";
    if (v === "failed") return "Échoué";
    if (v === "refunded") return "Remboursé";
    return String(raw ?? "");
  };

  return (data || []).map((payment: any) => ({
    id: payment.id,
    amount: payment.amount,
    createdAt: payment.created_at,
    visitId: payment.visit_id,
    patientId: payment.patient_id,
    method: payment.method,
    status: statusLabel(payment.status),
    nom: payment.patients.last_name,
    prenom: payment.patients.first_name,
    code: payment.patients.code,
  }));
};

