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

const getAuthHeader = () => {
  if (typeof window === "undefined") return null;
  const token = window.__MRS_ACCESS_TOKEN;
  if (!token) return null;
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
};

export const createApiClient = (baseURL) => {
  return {
    get: async (url) => {
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseURL}${url}`, {
        headers: authHeader ? { Authorization: authHeader } : undefined,
        credentials: "include",
      });
      return handleResponse(res);
    },

    post: async (url, body) => {
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseURL}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },

    put: async (url, body) => {
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseURL}${url}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },

    delete: async (url) => {
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseURL}${url}`, {
        method: "DELETE",
        headers: authHeader ? { Authorization: authHeader } : undefined,
        credentials: "include",
      });
      return handleResponse(res);
    },
  };
};

export { ApiError };
