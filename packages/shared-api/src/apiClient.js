const getToken = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("mrs_auth_v1") || "{}");
    return stored.token ?? null;
  } catch {
    return null;
  }
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

      return res.json();
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

      return res.json();
    },
  };
};
