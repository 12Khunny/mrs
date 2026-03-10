import http from "node:http";
import https from "node:https";

const BASE_URL = process.env.MRS_API_BASE ?? "http://localhost:8900";
const READER_SERVICE_BASE = process.env.MRS_RFID_READER_BASE ?? "http://localhost:5261";
const COOKIE_NAME = process.env.MRS_AUTH_COOKIE ?? "mrs_auth";
const RFID_RESOLVE_PATH = process.env.MRS_RFID_RESOLVE_PATH ?? "/manage-truck/rfid/resolve";
const LEGACY_RFID_RESOLVE_PATH = "/rfid/resolve";
const READER_READ_PATH = process.env.MRS_RFID_READER_READ_PATH ?? "/api/rfid/read";

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  return value.toLowerCase() === "true";
};

const state = {
  connected: parseBoolean(process.env.MRS_RFID_CONNECTED, false),
  readerName: process.env.MRS_RFID_READER_NAME ?? "RFID Reader",
  updatedAt: new Date().toISOString(),
  latestEvent: null,
  sequence: 0,
  readerHasTag: false,
  readerTag: null,
};

const normalizeTag = (value) => String(value ?? "").trim().toUpperCase();

const requestJson = ({ url, method = "GET", headers = {}, body = null }) =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;
    const payload = body == null ? null : JSON.stringify(body);

    const req = client.request(
      target,
      {
        method,
        headers: {
          ...headers,
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          text += chunk;
        });
        res.on("end", () => {
          let data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch {
            data = text;
          }

          resolve({
            ok: (res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 300,
            status: res.statusCode ?? 500,
            data,
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });

const checkReaderConnection = async () => {
  try {
    const response = await requestJson({
      url: `${READER_SERVICE_BASE}/api/health`,
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
};

const setDetectionState = (tagId) => {
  const normalizedTag = normalizeTag(tagId);
  if (!normalizedTag) return;

  state.connected = true;
  state.sequence += 1;
  state.latestEvent = {
    tag_id: normalizedTag,
    detected_at: new Date().toISOString(),
    sequence: state.sequence,
  };
  state.updatedAt = state.latestEvent.detected_at;
};

const pullLatestTagFromReader = async () => {
  try {
    const response = await requestJson({
      url: `${READER_SERVICE_BASE}${READER_READ_PATH}`,
      method: "GET",
    });

    if (!response.ok || !response.data || typeof response.data !== "object") {
      return null;
    }

    const rawTag =
      response.data.cardNumber ??
      response.data.card_number ??
      response.data.tag_id ??
      response.data.tagId;

    const normalizedTag = normalizeTag(rawTag);
    return normalizedTag || null;
  } catch {
    return null;
  }
};

const getReaderRuntimeStatus = async () => {
  try {
    const response = await requestJson({
      url: `${READER_SERVICE_BASE}/api/settings/reader/status`,
      method: "GET",
    });
    if (!response.ok || !response.data || typeof response.data !== "object") {
      return null;
    }
    return response.data;
  } catch {
    return null;
  }
};

const getAuthCandidates = (req) => {
  const candidates = [];
  const headerAuth = req.headers.authorization;
  const cookieToken = req.cookies?.[COOKIE_NAME];

  if (headerAuth) candidates.push(headerAuth);
  if (cookieToken) {
    candidates.push(`Bearer ${cookieToken}`);
    candidates.push(cookieToken);
  }

  return [...new Set(candidates.filter(Boolean))];
};

const resolveTruckFromUpstream = async (req, tagId) => {
  const authCandidates = getAuthCandidates(req);
  const tryAuth = authCandidates.length > 0 ? authCandidates : [null];
  const resolvePaths = [...new Set([RFID_RESOLVE_PATH, LEGACY_RFID_RESOLVE_PATH])];

  let response = null;
  for (const auth of tryAuth) {
    const headers = auth ? { Authorization: auth } : {};
    for (const resolvePath of resolvePaths) {
      response = await requestJson({
        url: `${BASE_URL}${resolvePath}?tag_id=${encodeURIComponent(tagId)}`,
        method: "GET",
        headers,
      });

      if (response.ok || response.status === 404 || (response.status !== 401 && response.status !== 403)) {
        break;
      }
    }

    if (response?.ok || response?.status === 404 || (response?.status !== 401 && response?.status !== 403)) {
      break;
    }
  }

  if (response?.ok) {
    const truck = response.data?.truck ?? response.data?.data?.truck ?? response.data;
    if (truck && typeof truck === "object") {
      return truck;
    }
    throw Object.assign(new Error("RFID resolve response does not include truck data"), {
      status: 502,
      payload: response.data,
    });
  }

  if (response?.status === 404) {
    return null;
  }

  throw Object.assign(new Error("Failed to resolve RFID tag from upstream"), {
    status: response?.status ?? 502,
    payload: response?.data ?? { message: "RFID resolve failed" },
  });
};

export const getRfidStatus = async (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const serviceConnected = await checkReaderConnection();
  const runtimeStatus = await getReaderRuntimeStatus();
  const readerConnected = Boolean(runtimeStatus?.isConnected);
  state.connected = serviceConnected && readerConnected;
  state.updatedAt = new Date().toISOString();

  res.json({
    connected: state.connected,
    service_connected: serviceConnected,
    reader_connected: readerConnected,
    reader_name: state.readerName,
    reader_last_error: runtimeStatus?.lastError ?? null,
    reader_result_code: runtimeStatus?.lastConnectResultCode ?? null,
    updated_at: state.updatedAt,
  });
};

export const getLatestDetection = async (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const latestTag = await pullLatestTagFromReader();
  if (!latestTag) {
    state.readerHasTag = false;
    state.readerTag = null;
  } else {
    const isSameTagStillPresent = state.readerHasTag && state.readerTag === latestTag;
    if (!isSameTagStillPresent) {
      setDetectionState(latestTag);
    }
    state.readerHasTag = true;
    state.readerTag = latestTag;
  }

  res.json({
    connected: state.connected,
    latest_event: state.latestEvent,
    sequence: state.sequence,
  });
};

export const resolveTagToTruck = async (req, res) => {
  const tagId = (req.query.tag_id ?? "").toString().trim();
  if (!tagId) {
    res.status(400).json({ message: "tag_id is required" });
    return;
  }

  try {
    const upstreamTruck = await resolveTruckFromUpstream(req, tagId);
    if (!upstreamTruck) {
      res.status(404).json({
        message: "No truck mapping for this RFID tag",
        tag_id: tagId,
      });
      return;
    }

    res.json({
      tag_id: tagId,
      truck: upstreamTruck,
      detected_at: state.latestEvent?.detected_at ?? null,
      sequence: state.sequence,
      source: "upstream",
    });
  } catch (error) {
    res
      .status(error.status ?? 500)
      .json(error.payload ?? { message: "RFID resolve failed" });
  }
};

export const setMockConnection = (req, res) => {
  const nextConnected = parseBoolean(req.body?.connected, false);
  state.connected = nextConnected;
  state.updatedAt = new Date().toISOString();
  res.json({ connected: state.connected, updated_at: state.updatedAt });
};

export const pushMockDetection = (req, res) => {
  const tagId = (req.body?.tag_id ?? "").toString().trim();
  if (!tagId) {
    res.status(400).json({ message: "tag_id is required" });
    return;
  }

  setDetectionState(tagId);

  res.json({
    connected: state.connected,
    latest_event: state.latestEvent,
    sequence: state.sequence,
  });
};

export const pushManualDetection = async (req, res) => {
  const tagId = (req.body?.tag_id ?? "").toString().trim();
  if (!tagId) {
    res.status(400).json({ message: "tag_id is required" });
    return;
  }

  try {
    const response = await requestJson({
      url: `${READER_SERVICE_BASE}/api/rfid/manual`,
      method: "POST",
      body: { cardNumber: tagId },
    });

    if (!response.ok) {
      res.status(response.status).json(
        response.data && typeof response.data === "object"
          ? response.data
          : { message: "Failed to push manual detection to reader service" }
      );
      return;
    }

    setDetectionState(tagId);

    res.json({
      connected: state.connected,
      latest_event: state.latestEvent,
      sequence: state.sequence,
      reader_service: response.data,
    });
  } catch {
    state.connected = false;
    state.updatedAt = new Date().toISOString();
    res.status(502).json({ message: "Cannot reach reader service" });
  }
};
