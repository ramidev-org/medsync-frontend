import { db } from "@/database/database_conn";

export type EdgeFunctionName =
  | "activate-clinic"
  | "create-staff-invite"
  | "accept-staff-invite";

export type RpcName =
  | "rpc_create_patient"
  | "rpc_get_patients"
  | "rpc_get_patient_medical"
  | "rpc_update_patient_medical"
  | "rpc_add_patient_measurement"
  | "rpc_get_clinic_staff"
  | "rpc_get_virtual_clinics"
  | "rpc_create_virtual_clinic"
  | "rpc_get_clinic_dashboard_counts"
  | "rpc_get_appointments"
  | "rpc_create_appointment"
  | "rpc_get_appointment_details"
  | "rpc_update_appointment"
  | "rpc_cancel_appointment"
  | "rpc_get_doctor_schedule"
  | "rpc_get_activation_link_status"
  | "rpc_get_staff_invite_status"
  | "rpc_open_consultation"
  | "rpc_save_consultation"
  | "rpc_close_consultation"
  | "rpc_get_consultation"
  | "rpc_get_consultations"
  | "rpc_get_clinic_speciality_tools"
  | "rpc_upsert_clinic_speciality_tool"
  | "rpc_get_services"
  | "rpc_upsert_service"
  | "rpc_set_service_active"
  | "rpc_get_invoices"
  | "rpc_get_expenses"
  | "rpc_create_expense";

const asErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return typeof err === "string" ? err : "Unknown error";
};

export async function invokeEdgeFunction<TResponse, TBody>(
  name: EdgeFunctionName,
  body: TBody,
  accessToken?: string,
): Promise<TResponse> {
  const { data, error } = await db.functions.invoke(name, {
    body: body as any,
    ...(accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {}),
  });

  if (error) {
    throw new Error(error.message);
  }

  // Edge functions may return JSON { error: string } even with 200s.
  if (data && typeof data === "object" && "error" in (data as any)) {
    const msg = (data as any).error;
    if (typeof msg === "string" && msg.trim()) throw new Error(msg);
  }

  return data as TResponse;
}

export async function callRpc<TResponse, TParams extends Record<string, unknown>>(
  name: RpcName,
  params?: TParams,
): Promise<TResponse> {
  const { data, error } = await db.rpc(name, (params ?? {}) as any);
  if (error) {
    const msg = error.message || "RPC failed";
    const notFound =
      msg.toLowerCase().includes("not found") ||
      msg.includes("404") ||
      (error as any)?.status === 404;
    if (notFound) {
      throw new Error(
        `RPC "${name}" was not found (404). Make sure the function exists in the exposed schema (usually "public"), and that you've deployed the SQL that creates it.`,
      );
    }
    throw new Error(msg);
  }
  return data as TResponse;
}

/**
 * Some RPCs are defined with either `token` or `p_token` as argument name.
 * This helper tries both so the frontend doesn't break on minor naming changes.
 */
export async function callRpcTokenStatus<TResponse>(
  name: "rpc_get_activation_link_status" | "rpc_get_staff_invite_status",
  token: string,
): Promise<TResponse> {
  const attempts: Array<Record<string, unknown>> = [
    { p_token_hash: token },
    { token_hash: token },
    { token },
    { p_token: token },
  ];
  let lastErr: unknown = null;

  for (const params of attempts) {
    try {
      return await callRpc<TResponse, Record<string, unknown>>(name, params);
    } catch (err) {
      lastErr = err;
    }
  }

  throw new Error(asErrorMessage(lastErr));
}
