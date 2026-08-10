import Constants from "expo-constants";
import { db } from "@/database/database_conn";

export type CallMode = "audio" | "video";

export type IceServerConfig = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export type CallInvitePayload = {
  sessionId: string;
  conversationId: string;
  clinicId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  mode: CallMode;
  createdAt: string;
};

export type CallLaunchParams = {
  sessionId: string;
  conversationId: string;
  clinicId: string;
  mode: CallMode;
  role: "caller" | "callee";
  peerId: string;
  peerName: string;
  startedById: string;
  startedBy: string;
  receiverId: string;
};

export function buildPresenceChannelName(clinicId: string) {
  return `clinic:${clinicId}:presence`;
}

export function buildIncomingCallChannelName(clinicId: string, receiverId: string) {
  return `clinic:${clinicId}:user:${receiverId}`;
}

export function buildCallChannelName(sessionId: string) {
  return `call:${sessionId}`;
}

export function createCallSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getCallConfigEndpoint() {
  const configured = readPublicEnv("EXPO_PUBLIC_CALL_CONFIG_ENDPOINT");
  if (configured) return configured;

  if (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
    return "http://127.0.0.1:3001/api/call-config";
  }

  return "/api/call-config";
}

export async function fetchCallConfig() {
  const { data } = await db.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Sign in before starting a call.");
  }

  const response = await fetch(getCallConfigEndpoint(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "Unable to load call configuration.");
  }

  const iceServers = Array.isArray(payload?.iceServers) ? (payload.iceServers as IceServerConfig[]) : [];
  if (iceServers.length === 0) {
    throw new Error("The call server did not return any ICE servers.");
  }

  return {
    iceServers,
  };
}

export function buildCallSessionUrl(params: CallLaunchParams) {
  const search = new URLSearchParams({
    conversationId: params.conversationId,
    clinicId: params.clinicId,
    mode: params.mode,
    role: params.role,
    peerId: params.peerId,
    peerName: params.peerName,
    startedById: params.startedById,
    startedBy: params.startedBy,
    receiverId: params.receiverId,
  });

  return `/call/${encodeURIComponent(params.sessionId)}?${search.toString()}`;
}

export function openCallSessionTab(params: CallLaunchParams) {
  const url = buildCallSessionUrl(params);

  if (typeof window !== "undefined") {
    const opened = window.open(url, "_blank");
    if (opened) return;
    window.location.href = url;
    return;
  }

  throw new Error("Opening a call tab is only supported on web.");
}

function readPublicEnv(key: string) {
  const processValue = (process.env as any)?.[key];
  if (processValue != null && String(processValue).trim()) {
    return String(processValue).trim();
  }

  const expoExtra =
    (Constants.expoConfig as any)?.extra ??
    (Constants as any).manifest2?.extra ??
    (Constants as any).manifest?.extra ??
    {};

  const extraValue = expoExtra?.[key] ?? expoExtra?.[key.replace(/^EXPO_PUBLIC_/, "")];
  if (extraValue != null && String(extraValue).trim()) {
    return String(extraValue).trim();
  }

  return "";
}
