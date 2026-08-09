const http = require("node:http");

const PORT = Number(process.env.CALL_SERVER_PORT || 3001);

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(body));
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

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.url !== "/api/call-config" || req.method !== "GET") {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  try {
    const iceServers = readIceServersFromEnv();
    if (!iceServers.length) {
      sendJson(res, 500, { error: "No ICE servers configured." });
      return;
    }

    sendJson(res, 200, { iceServers });
  } catch (error) {
    console.error("[calling-server] failed:", error);
    sendJson(res, 500, {
      error: error?.message || "Unable to load call configuration.",
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[calling-server] listening on http://127.0.0.1:${PORT}/api/call-config`);
});
