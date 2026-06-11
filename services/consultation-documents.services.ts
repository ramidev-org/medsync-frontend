import { callRpc } from "@/services/backend";
import type { ConsultationDocumentRow } from "@/services/backend.types";

export async function getConsultationDocuments(params: {
  requesterId: string;
  consultationId: string;
}): Promise<ConsultationDocumentRow[]> {
  return callRpc<ConsultationDocumentRow[], Record<string, unknown>>(
    "rpc_get_consultation_documents",
    {
      p_requester_id: params.requesterId,
      p_consultation_id: params.consultationId,
    },
  );
}

export async function createConsultationDocument(params: {
  requesterId: string;
  consultationId: string;
  patientId: string;
  name: string;
  kind?: string | null;
  documentType?: string | null;
  title?: string | null;
  notes?: string | null;
  mimeType?: string | null;
  url?: string | null;
}): Promise<ConsultationDocumentRow> {
  return callRpc<ConsultationDocumentRow, Record<string, unknown>>(
    "rpc_create_consultation_document",
    {
      p_requester_id: params.requesterId,
      p_consultation_id: params.consultationId,
      p_patient_id: params.patientId,
      p_name: params.name,
      p_kind: params.kind ?? "PDF",
      p_document_type: params.documentType ?? null,
      p_title: params.title ?? null,
      p_notes: params.notes ?? null,
      p_mime_type: params.mimeType ?? null,
      p_url: params.url ?? null,
    },
  );
}

export async function deleteConsultationDocument(params: {
  requesterId: string;
  documentId: string;
}): Promise<boolean> {
  return callRpc<boolean, Record<string, unknown>>(
    "rpc_delete_consultation_document",
    {
      p_requester_id: params.requesterId,
      p_document_id: params.documentId,
    },
  );
}
