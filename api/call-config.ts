type RequestLike = {
  method?: string;
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    jsonResponse(res, 204, {});
    return;
  }

  if (req.method !== "GET") {
    jsonResponse(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
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
