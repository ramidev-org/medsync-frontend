import { createClient } from "@supabase/supabase-js";
import { AccessToken } from "livekit-server-sdk";

type RequestLike = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const LIVEKIT_URL = process.env.LIVEKIT_URL || process.env.EXPO_PUBLIC_LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

function readHeader(headers: RequestLike["headers"], name: string) {
  if (!headers) return "";
  const value = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function jsonError(res: ResponseLike, statusCode: number, message: string) {
  res.status(statusCode).json({ error: message });
}

function extractBearerToken(headers: RequestLike["headers"]) {
  const authHeader = readHeader(headers, "authorization");
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function sanitizeRoomName(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/[_-]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  return normalized.slice(0, 128);
}

function buildParticipantIdentity(userId: string) {
  return `medsync_${userId}`;
}

function buildParticipantName(user: any) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    user?.email ||
    "Team member"
  );
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).json({});
    return;
  }

  if (req.method !== "POST") {
    jsonError(res, 405, "Method not allowed.");
    return;
  }

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    jsonError(res, 500, "Missing LiveKit or Supabase server environment variables.");
    return;
  }

  const accessToken = extractBearerToken(req.headers);
  if (!accessToken) {
    jsonError(res, 401, "Missing bearer token.");
    return;
  }

  const roomName = sanitizeRoomName(req.body?.room_name);
  if (!roomName.startsWith("medsync-")) {
    jsonError(res, 400, "Invalid room name.");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.id) {
    jsonError(res, 401, "Unable to verify the signed-in user.");
    return;
  }

  const participantIdentity = buildParticipantIdentity(data.user.id);
  const participantName = buildParticipantName(data.user);
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    metadata:
      typeof req.body?.participant_metadata === "string"
        ? req.body.participant_metadata
        : JSON.stringify({ source: "medsync-chat" }),
    attributes: {
      email: data.user.email || "",
      role: String(data.user.user_metadata?.role ?? ""),
      ...(req.body?.participant_attributes || {}),
    },
    name: participantName,
    ttl: "10m",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: false,
  });

  const participantToken = await token.toJwt();
  res.status(200).json({
    participant_identity: participantIdentity,
    participant_name: participantName,
    participant_token: participantToken,
    server_url: LIVEKIT_URL,
  });
}
