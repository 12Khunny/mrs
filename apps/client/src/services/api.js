import { createApiClient } from "@mrs/shared-api";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";
const api = createApiClient(baseURL);

export default api;
