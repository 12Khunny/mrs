import axios from "axios";

export function createApiClient({ baseURL, token }) {
  const instance = axios.create({ baseURL });

  instance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return instance;
}
