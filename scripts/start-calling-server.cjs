const http = require("node:http");
const { createClient } = require("@supabase/supabase-js");

const PORT = Number(process.env.CALL_SERVER_PORT || 3001);

function sendJson(req, res, statusCode, body) {
  const allowedOrigins = String(
    process.env.CALL_ALLOWED_ORIGINS || "http://localhost:8081,http://127.0.0.1:8081",
  )
    .split(",")
    .map((value) => value.trim());
  const origin = String(req.headers.origin || "");
  res.writeHead(statusCode, {
    ...(origin && allowedOrigins.includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
}

async function authorize(req) {
  const token = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1];
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
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  }

  const stunUrls = String(process.env.CALL_STUN_URLS || "stun:stun.l.google.com:19302")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const iceServers = [];
  if (stunUrls.length > 0) {
    iceServers.push({
      urls: stunUrls.length === 1 ? stunUrls[0] : stunUrls,
    });
  }

  const turnUrl = String(process.env.CALL_TURN_URL || "").trim();
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: String(process.env.CALL_TURN_USERNAME || "").trim(),
      credential: String(process.env.CALL_TURN_CREDENTIAL || "").trim(),
    });
  }

  return iceServers;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(req, res, 204, {});
    return;
  }

  if (req.url !== "/api/call-config" || req.method !== "GET") {
    sendJson(req, res, 404, { error: "Not found." });
    return;
  }

  try {
    if (!(await authorize(req))) {
      sendJson(req, res, 401, { error: "Unauthorized." });
      return;
    }

    const iceServers = readIceServersFromEnv();
    if (!iceServers.length) {
      sendJson(req, res, 500, { error: "No ICE servers configured." });
      return;
    }

    sendJson(req, res, 200, { iceServers });
  } catch (error) {
    console.error("[calling-server] failed:", error);
    sendJson(req, res, 500, {
      error: error?.message || "Unable to load call configuration.",
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[calling-server] listening on http://127.0.0.1:${PORT}/api/call-config`);
});
