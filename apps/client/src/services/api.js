import { createApiClient } from "@mrs/shared-api";

const runtimeApiUrl = typeof window !== "undefined" ? window?.mrsRuntimeConfig?.apiUrl : undefined;
const fallbackBaseURL = window.location.protocol === "file:" ? "http://localhost:5000/api" : "/api";
const baseURL = runtimeApiUrl ?? import.meta.env.VITE_API_URL ?? fallbackBaseURL;
const api = createApiClient(baseURL);

export default api;
