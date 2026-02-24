const BASE_URL = process.env.MRS_API_BASE ?? "http://localhost:8900";
const COOKIE_NAME = process.env.MRS_AUTH_COOKIE ?? "mrs_auth";

function getAuthCandidates(req) {
  const candidates = [];
  const headerAuth = req.headers.authorization;
  const cookieToken = req.cookies?.[COOKIE_NAME];

  if (headerAuth) candidates.push(headerAuth);
  if (cookieToken) {
    candidates.push(`Bearer ${cookieToken}`);
    candidates.push(cookieToken);
  }

  return [...new Set(candidates.filter(Boolean))];
}

async function forward(req, res, path, options = {}) {
  const authCandidates = getAuthCandidates(req);
  const tryAuth = authCandidates.length > 0 ? authCandidates : [null];
  let response = null;
  let data = null;

  for (const auth of tryAuth) {
    const headers = {};
    if (auth) headers.Authorization = auth;
    if (options.body) headers["Content-Type"] = "application/json";

    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (response.ok || (response.status !== 401 && response.status !== 403)) {
      break;
    }
  }

  if (!response.ok) {
    res.status(response.status).json(data ?? { message: "Upstream error" });
    return;
  }

  res.json(data);
}

export function getUnloadedTruckDetail(req, res) {
  const { id } = req.params;
  return forward(req, res, `/unloadedTruck/unloadedTruckDetail/${id}`);
}

export function saveUnloadedTruck(req, res) {
  return forward(req, res, "/unloadedTruck/save", { method: "POST", body: req.body });
}
