import { callRpc } from "@/services/backend";
import type { InventoryListResponse } from "@/services/backend.types";

export async function getInventory(params: {
  requesterId: string;
  search?: string;
  page?: number;
  itemsPerPage?: number;
}): Promise<InventoryListResponse> {
  return callRpc<InventoryListResponse, Record<string, unknown>>(
    "rpc_get_inventory",
    {
      p_requester_id: params.requesterId,
      p_search: params.search ?? null,
      p_page: params.page ?? 1,
      p_items_per_page: params.itemsPerPage ?? 50,
    },
  );
}

export async function upsertInventoryItem(params: {
  requesterId: string;
  name: string;
  itemId?: string | null;
  sku?: string | null;
  unit?: string | null;
  reorderThreshold?: number | null;
  notes?: string | null;
}): Promise<string> {
  return callRpc<string, Record<string, unknown>>("rpc_upsert_inventory_item", {
    p_requester_id: params.requesterId,
    p_name: params.name,
    p_item_id: params.itemId ?? null,
    p_sku: params.sku ?? null,
    p_unit: params.unit ?? null,
    p_reorder_threshold: params.reorderThreshold ?? null,
    p_notes: params.notes ?? null,
  });
}

export async function adjustInventory(params: {
  requesterId: string;
  itemId: string;
  delta: number;
  reason?: string | null;
}): Promise<boolean> {
  return callRpc<boolean, Record<string, unknown>>("rpc_adjust_inventory", {
    p_requester_id: params.requesterId,
    p_item_id: params.itemId,
    p_delta: params.delta,
    p_reason: params.reason ?? null,
  });
}

