const getToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("mrs_auth_v1") || "{}");
    return stored.token ?? null;
  } catch {
    return null;
  }
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const handleResponse = async (res) => {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? body?.detail ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.json();
};

export const createApiClient = (baseURL) => {
  return {
    get: async (url) => {
      const token = getToken();
      const res = await fetch(`${baseURL}${url}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return handleResponse(res);
    },

    post: async (url, body) => {
      const token = getToken();
      const res = await fetch(`${baseURL}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },

    put: async (url, body) => {
      const token = getToken();
      const res = await fetch(`${baseURL}${url}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },

    delete: async (url) => {
      const token = getToken();
      const res = await fetch(`${baseURL}${url}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return handleResponse(res);
    },
  };
};

export { ApiError };
