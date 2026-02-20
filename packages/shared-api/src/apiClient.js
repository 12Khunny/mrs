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
      const res = await fetch(`${baseURL}${url}`, {
        credentials: "include",
      });
      return handleResponse(res);
    },

    post: async (url, body) => {
      const res = await fetch(`${baseURL}${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },

    put: async (url, body) => {
      const res = await fetch(`${baseURL}${url}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      return handleResponse(res);
    },

    delete: async (url) => {
      const res = await fetch(`${baseURL}${url}`, {
        method: "DELETE",
        credentials: "include",
      });
      return handleResponse(res);
    },
  };
};

export { ApiError };
