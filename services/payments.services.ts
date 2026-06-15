import { db } from "@/database/database_conn";

export interface Payment {
  id: string;
  amount: number;
  createdAt: string;
  visitId: string;
  patientId: string;
  reference: string | null;
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
      reference,
      method,
      status
    `);

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  const patientIds = Array.from(
    new Set((data ?? []).map((payment: any) => payment.patient_id).filter(Boolean)),
  );

  const patientMap = new Map<string, { first_name: string; last_name: string; code: string }>();

  if (patientIds.length > 0) {
    const { data: patients, error: patientsError } = await db
      .from("patients")
      .select("id, first_name, last_name, code")
      .in("id", patientIds);

    if (patientsError) {
      console.error("Error fetching payment patients:", patientsError);
    } else {
      for (const patient of patients ?? []) {
        patientMap.set(String((patient as any).id), {
          first_name: String((patient as any).first_name ?? ""),
          last_name: String((patient as any).last_name ?? ""),
          code: String((patient as any).code ?? ""),
        });
      }
    }
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

  return (data || []).map((payment: any) => {
    const patient = patientMap.get(String(payment.patient_id));
    return {
      id: payment.id,
      amount: payment.amount,
      createdAt: payment.created_at,
      visitId: payment.visit_id,
      patientId: payment.patient_id,
      reference: payment.reference ?? null,
      method: payment.method,
      status: statusLabel(payment.status),
      nom: patient?.last_name ?? "",
      prenom: patient?.first_name ?? "",
      code: patient?.code ?? "",
    };
  });
};

