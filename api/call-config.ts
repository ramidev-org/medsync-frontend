import { createClient } from "@supabase/supabase-js";

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

function jsonResponse(res: ResponseLike, statusCode: number, body: unknown) {
  res.status(statusCode).json(body);
}

async function authorize(req: RequestLike) {
  const authorization = req.headers.authorization;
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  const token = value?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase authentication is not configured.");

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return false;

  const { data: member, error: memberError } = await client
    .from("users_metadata")
    .select("id, clinic_id")
    .eq("id", authData.user.id)
    .eq("active", true)
    .maybeSingle();

  return !memberError && !!member?.clinic_id;
}

function readIceServersFromEnv() {
  const rawJson = process.env.CALL_ICE_SERVERS_JSON || "";
  if (rawJson.trim()) {
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as IceServer[];
      }
    } catch {
      throw new Error("CALL_ICE_SERVERS_JSON must be valid JSON.");
    }
  }

  const stunUrls = (process.env.CALL_STUN_URLS || "stun:stun.l.google.com:19302")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const iceServers: IceServer[] = [];
  if (stunUrls.length > 0) {
    iceServers.push({
      urls: stunUrls.length === 1 ? stunUrls[0] : stunUrls,
    });
  }

  const turnUrl = (process.env.CALL_TURN_URL || "").trim();
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: (process.env.CALL_TURN_USERNAME || "").trim(),
      credential: (process.env.CALL_TURN_CREDENTIAL || "").trim(),
    });
  }

  return iceServers;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  const allowedOrigin = (process.env.CALL_ALLOWED_ORIGIN || "").trim();
  if (allowedOrigin) res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    jsonResponse(res, 204, {});
    return;
  }

  if (req.method !== "GET") {
    jsonResponse(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    if (!(await authorize(req))) {
      jsonResponse(res, 401, { error: "Unauthorized." });
      return;
    }

    const iceServers = readIceServersFromEnv();
    if (iceServers.length === 0) {
      jsonResponse(res, 500, { error: "No ICE servers configured." });
      return;
    }

    jsonResponse(res, 200, { iceServers });
  } catch (error: any) {
    jsonResponse(res, 500, { error: error?.message || "Unable to load call configuration." });
  }
}
