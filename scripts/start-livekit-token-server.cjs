const http = require("node:http");
const { AccessToken } = require("livekit-server-sdk");

const PORT = Number(process.env.LIVEKIT_TOKEN_SERVER_PORT || 3001);
const LIVEKIT_URL = process.env.LIVEKIT_URL || process.env.EXPO_PUBLIC_LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
}

function sanitizeRoomName(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/[_-]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 128);
}

function buildParticipantName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    user?.email ||
    "Team member"
  );
}

function buildParticipantIdentity(userId) {
  return `medsync_${userId}`;
}

async function getAuthenticatedUser(authHeader) {
  const match = String(authHeader || "").match(/^Bearer\s+(.+)$/i);
  const bearer = match?.[1]?.trim();
  if (!bearer) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${bearer}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) return null;
  return response.json();
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.url !== "/api/livekit-token" || req.method !== "POST") {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    sendJson(res, 500, { error: "Missing LiveKit or Supabase server environment variables." });
    return;
  }

  let rawBody = "";
  req.on("data", (chunk) => {
    rawBody += chunk;
  });

  req.on("end", async () => {
    try {
      const body = rawBody ? JSON.parse(rawBody) : {};
      const roomName = sanitizeRoomName(body.room_name);
      if (!roomName.startsWith("medsync-")) {
        sendJson(res, 400, { error: "Invalid room name." });
        return;
      }

      const user = await getAuthenticatedUser(req.headers.authorization);
      if (!user?.id) {
        sendJson(res, 401, { error: "Unable to verify the signed-in user." });
        return;
      }

      const participantIdentity = buildParticipantIdentity(user.id);
      const participantName = buildParticipantName(user);
      const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: participantIdentity,
        metadata:
          typeof body.participant_metadata === "string"
            ? body.participant_metadata
            : JSON.stringify({ source: "medsync-chat" }),
        attributes: {
          email: user.email || "",
          role: String(user.user_metadata?.role ?? ""),
          ...(body.participant_attributes || {}),
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
      sendJson(res, 200, {
        participant_identity: participantIdentity,
        participant_name: participantName,
        participant_token: participantToken,
        server_url: LIVEKIT_URL,
      });
    } catch (error) {
      console.error("[livekit-token-server] failed:", error);
      sendJson(res, 500, { error: error?.message || "Unable to create a LiveKit token." });
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[livekit-token-server] listening on http://127.0.0.1:${PORT}/api/livekit-token`);
});
