const BASE_URL = process.env.MRS_API_BASE;
const COOKIE_NAME = process.env.MRS_AUTH_COOKIE ?? "mrs_auth";

export const login = async (req, res) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body ?? {}),
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

  const token =
    data?.access_token ?? data?.token ?? data?.accessToken ?? data?.content?.access_token ?? null;
  if (token) {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  res.json(data);
};

export const externalLogin = async (req, res) => {
  const response = await fetch(`${BASE_URL}/authen/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body ?? {}),
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

  const token =
    data?.access_token ?? data?.token ?? data?.accessToken ?? data?.content?.access_token ?? null;
  if (token) {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  res.json(data);
};

export const me = async (req, res) => {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) {
    try {
      const payloadPart = cookieToken.split(".")[1];
      const decoded = JSON.parse(
        Buffer.from(payloadPart, "base64url").toString("utf-8")
      );
      const exp = decoded?.exp;
      if (!exp || exp * 1000 > Date.now()) {
        res.json({
          username: decoded?.sub ?? decoded?.username ?? null,
        });
        return;
      }
    } catch {
      // Fall through to upstream check.
    }
  }

  const tryFetch = async (path) => {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return { response, data };
  };

  const first = await tryFetch("/auth/me");
  if (first.response.ok) {
    res.json(first.data);
    return;
  }

  const second = await tryFetch("/authen/me");
  if (second.response.ok) {
    res.json(second.data);
    return;
  }

  res.status(first.response.status || 500).json(first.data ?? { message: "Upstream error" });
};
