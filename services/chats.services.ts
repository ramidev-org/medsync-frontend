import { callRpc } from "@/services/backend";
import type {
  ChatMessageRow,
  ConversationsListResponse,
} from "@/services/backend.types";
import { db } from "@/database/database_conn";

export async function getOrCreateDirectConversation(params: {
  requesterId: string;
  otherUserId: string;
}): Promise<string> {
  return callRpc<string, Record<string, unknown>>(
    "rpc_get_or_create_direct_conversation",
    {
      p_requester_id: params.requesterId,
      p_other_user_id: params.otherUserId,
    },
  );
}

export async function getConversations(params: {
  requesterId: string;
  page?: number;
  itemsPerPage?: number;
}): Promise<ConversationsListResponse> {
  return callRpc<ConversationsListResponse, Record<string, unknown>>(
    "rpc_get_conversations",
    {
      p_requester_id: params.requesterId,
      p_page: params.page ?? 1,
      p_items_per_page: params.itemsPerPage ?? 30,
    },
  );
}

export async function getMessages(params: {
  requesterId: string;
  conversationId: string;
  limit?: number;
  before?: string | null;
}): Promise<ChatMessageRow[]> {
  return callRpc<ChatMessageRow[], Record<string, unknown>>("rpc_get_messages", {
    p_requester_id: params.requesterId,
    p_conversation_id: params.conversationId,
    p_limit: params.limit ?? 50,
    p_before: params.before ?? null,
  });
}

const CHAT_DOCUMENT_BUCKET = "chat-documents";
const CHAT_READS_STORAGE_KEY = "medsync_chat_reads_v1";
const chatReadMarksMemory: Record<string, Record<string, string>> = {};

const isMissingChatRpc = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("rpc_mark_conversation_read");
};

function loadChatReadMarks() {
  if (typeof localStorage === "undefined") return chatReadMarksMemory;
  try {
    const raw = localStorage.getItem(CHAT_READS_STORAGE_KEY);
    if (!raw) return chatReadMarksMemory;
    const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
    Object.assign(chatReadMarksMemory, parsed);
    return chatReadMarksMemory;
  } catch {
    return chatReadMarksMemory;
  }
}

function persistChatReadMarks(next: Record<string, Record<string, string>>) {
  Object.keys(chatReadMarksMemory).forEach((key) => delete chatReadMarksMemory[key]);
  Object.assign(chatReadMarksMemory, next);
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CHAT_READS_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function getConversationReadMarks(requesterId: string) {
  return loadChatReadMarks()[requesterId] ?? {};
}

export function getConversationReadAt(requesterId: string, conversationId: string) {
  return getConversationReadMarks(requesterId)[conversationId] ?? null;
}

function setConversationReadAt(requesterId: string, conversationId: string, readAt: string) {
  const current = loadChatReadMarks();
  persistChatReadMarks({
    ...current,
    [requesterId]: {
      ...(current[requesterId] ?? {}),
      [conversationId]: readAt,
    },
  });
}

export async function markConversationRead(params: {
  requesterId: string;
  conversationId: string;
  readAt?: string;
}): Promise<boolean> {
  const readAt = params.readAt ?? new Date().toISOString();
  setConversationReadAt(params.requesterId, params.conversationId, readAt);
  try {
    return await callRpc<boolean, Record<string, unknown>>("rpc_mark_conversation_read", {
      p_requester_id: params.requesterId,
      p_conversation_id: params.conversationId,
      p_read_at: readAt,
    });
  } catch (error) {
    if (!isMissingChatRpc(error)) throw error;
    return true;
  }
}

export async function sendMessage(params: {
  requesterId: string;
  conversationId: string;
  body: string;
}): Promise<string> {
  return callRpc<string, Record<string, unknown>>("rpc_send_message", {
    p_requester_id: params.requesterId,
    p_conversation_id: params.conversationId,
    p_body: params.body,
  });
}

export async function uploadChatDocument(params: {
  clinicId: string;
  conversationId: string;
  requesterId: string;
  file: File;
}) {
  const fileExt = params.file.name.includes(".") ? params.file.name.split(".").pop()?.toLowerCase() : "";
  const safeBaseName = params.file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "document";
  const objectPath = [
    params.clinicId,
    params.conversationId,
    params.requesterId,
    `${Date.now()}_${safeBaseName}${fileExt ? `.${fileExt}` : ""}`,
  ].join("/");

  const { error } = await db.storage.from(CHAT_DOCUMENT_BUCKET).upload(objectPath, params.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: params.file.type || "application/octet-stream",
  });

  if (error) {
    throw new Error(error.message || "Unable to upload document.");
  }

  return {
    bucket: CHAT_DOCUMENT_BUCKET,
    path: objectPath,
    name: params.file.name,
    mimeType: params.file.type || "application/octet-stream",
    size: params.file.size,
  };
}

export async function getChatDocumentUrl(params: {
  bucket: string;
  path: string;
  expiresIn?: number;
}) {
  const signed = await db.storage
    .from(params.bucket)
    .createSignedUrl(params.path, params.expiresIn ?? 60 * 10);

  if (!signed.error && signed.data?.signedUrl) {
    return signed.data.signedUrl;
  }

  const { data } = db.storage.from(params.bucket).getPublicUrl(params.path);
  return data.publicUrl;
}

