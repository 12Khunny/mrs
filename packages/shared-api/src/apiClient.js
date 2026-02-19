export const createApiClient = (baseURL) => {
  return {
    get: async (url) => {
      const res = await fetch(`${baseURL}${url}`);
      return res.json();
    },

    post: async (url, body) => {
      const res = await fetch(`${baseURL}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      return res.json();
    },
  };
};
