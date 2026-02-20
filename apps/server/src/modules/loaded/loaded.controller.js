const BASE_URL = process.env.MRS_API_BASE ?? "https://api.zyanwoa.com/__testapi2__";

async function forward(req, res, path, options = {}) {
  const headers = {};
  const auth = req.headers.authorization;
  if (auth) headers.Authorization = auth;
  if (options.body) headers["Content-Type"] = "application/json";

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    res.status(response.status).json(data ?? { message: "Upstream error" });
    return;
  }

  res.json(data);
}

export function getLoadedTruckDetail(req, res) {
  return forward(req, res, "/loadedTruck/loadedTruckDetail");
}

export function getLoadedTruckList(req, res) {
  return forward(req, res, "/loadedTruck/loadedTruckList");
}

export function saveLoadedTruck(req, res) {
  return forward(req, res, "/loadedTruck/save", { method: "POST", body: req.body });
}
