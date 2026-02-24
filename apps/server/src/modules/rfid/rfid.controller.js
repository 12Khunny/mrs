const BASE_URL = process.env.MRS_API_BASE ?? "http://localhost:8900";

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  return value.toLowerCase() === "true";
};

const parseTagMap = () => {
  const raw = process.env.MRS_RFID_TAG_MAP ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const tagMap = parseTagMap();

const state = {
  connected: parseBoolean(process.env.MRS_RFID_CONNECTED, false),
  readerName: process.env.MRS_RFID_READER_NAME ?? "RFID Reader",
  updatedAt: new Date().toISOString(),
  latestEvent: null,
  sequence: 0,
};

const getAuthHeaders = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  return headers;
};

const fetchTruckList = async (req) => {
  const response = await fetch(`${BASE_URL}/loadedTruck/loadedTruckDetail`, {
    method: "GET",
    headers: getAuthHeaders(req),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error = new Error("Failed to fetch truck list");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return Array.isArray(data?.truck_list) ? data.truck_list : [];
};

const findTruckByTag = (tagId, truckList) => {
  const mapped = tagMap[tagId];
  if (mapped == null) return null;

  if (typeof mapped === "number") {
    return truckList.find((truck) => Number(truck?.truck_id) === mapped) ?? null;
  }

  const mappedText = String(mapped).trim();
  if (!mappedText) return null;

  return (
    truckList.find((truck) => String(truck?.truck_license ?? "").trim() === mappedText) ?? null
  );
};

export const getRfidStatus = (_req, res) => {
  res.json({
    connected: state.connected,
    reader_name: state.readerName,
    updated_at: state.updatedAt,
  });
};

export const getLatestDetection = (_req, res) => {
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
    const truckList = await fetchTruckList(req);
    const truck = findTruckByTag(tagId, truckList);
    if (!truck) {
      res.status(404).json({
        message: "No truck mapping for this RFID tag",
        tag_id: tagId,
      });
      return;
    }

    res.json({
      tag_id: tagId,
      truck,
      detected_at: state.latestEvent?.detected_at ?? null,
      sequence: state.sequence,
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

  state.connected = true;
  state.sequence += 1;
  state.latestEvent = {
    tag_id: tagId,
    detected_at: new Date().toISOString(),
    sequence: state.sequence,
  };
  state.updatedAt = state.latestEvent.detected_at;

  res.json({
    connected: state.connected,
    latest_event: state.latestEvent,
    sequence: state.sequence,
  });
};
