import { callRpc } from "@/services/backend";
import type {
  LabOrderRow,
  LabPriority,
  LabResultItemRow,
  LabSourceType,
} from "@/services/backend.types";

const LAB_RPC_SETUP_HINT =
  "Lab workflow RPCs are missing. Apply database/2026_06_16_add_lab_workflow.sql in Supabase, then refresh the app.";

function withLabRpcHint(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err ?? "Unknown error");
  if (
    message.includes('RPC "rpc_get_lab_orders" was not found') ||
    message.includes('RPC "rpc_get_lab_order" was not found') ||
    message.includes('RPC "rpc_create_lab_order" was not found') ||
    message.includes('RPC "rpc_save_lab_results" was not found') ||
    message.includes("schema cache")
  ) {
    throw new Error(LAB_RPC_SETUP_HINT);
  }
  throw err instanceof Error ? err : new Error(message);
}

export async function getLabOrders(params: {
  requesterId: string;
  search?: string;
  status?: string | null;
  sourceType?: LabSourceType | null;
  limit?: number;
}): Promise<LabOrderRow[]> {
  try {
    return await callRpc<LabOrderRow[], Record<string, unknown>>("rpc_get_lab_orders", {
      p_requester_id: params.requesterId,
      p_search: params.search ?? null,
      p_status: params.status ?? null,
      p_source_type: params.sourceType ?? null,
      p_limit: params.limit ?? 100,
    });
  } catch (err) {
    withLabRpcHint(err);
  }
}

export async function getLabOrder(params: {
  requesterId: string;
  labOrderId: string;
}): Promise<LabOrderRow> {
  try {
    return await callRpc<LabOrderRow, Record<string, unknown>>("rpc_get_lab_order", {
      p_requester_id: params.requesterId,
      p_lab_order_id: params.labOrderId,
    });
  } catch (err) {
    withLabRpcHint(err);
  }
}

export async function createLabOrder(params: {
  requesterId: string;
  patientId: string;
  consultationId?: string | null;
  sourceType?: LabSourceType;
  priority?: LabPriority;
  requestedTests: string[];
  clinicalContext?: string | null;
  labComments?: string | null;
  paymentStatus?: string | null;
  paymentNote?: string | null;
  externalLabName?: string | null;
  estimatedTotal?: number | null;
}): Promise<string> {
  try {
    return await callRpc<string, Record<string, unknown>>("rpc_create_lab_order", {
      p_requester_id: params.requesterId,
      p_patient_id: params.patientId,
      p_consultation_id: params.consultationId ?? null,
      p_source_type: params.sourceType ?? "internal",
      p_priority: params.priority ?? "routine",
      p_requested_tests: params.requestedTests,
      p_clinical_context: params.clinicalContext ?? null,
      p_lab_comments: params.labComments ?? null,
      p_payment_status: params.paymentStatus ?? "pending",
      p_payment_note: params.paymentNote ?? null,
      p_external_lab_name: params.externalLabName ?? null,
      p_estimated_total: params.estimatedTotal ?? null,
    });
  } catch (err) {
    withLabRpcHint(err);
  }
}

export async function saveLabResults(params: {
  requesterId: string;
  labOrderId: string;
  status: string;
  resultItems: LabResultItemRow[];
  resultSummary?: string | null;
  doctorNote?: string | null;
}): Promise<boolean> {
  try {
    return await callRpc<boolean, Record<string, unknown>>("rpc_save_lab_results", {
      p_requester_id: params.requesterId,
      p_lab_order_id: params.labOrderId,
      p_status: params.status,
      p_result_items: params.resultItems,
      p_result_summary: params.resultSummary ?? null,
      p_doctor_note: params.doctorNote ?? null,
    });
  } catch (err) {
    withLabRpcHint(err);
  }
}
