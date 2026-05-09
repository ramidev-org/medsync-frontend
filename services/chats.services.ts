import { callRpc } from "@/services/backend";
import type {
  ChatMessageRow,
  ConversationsListResponse,
} from "@/services/backend.types";

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

