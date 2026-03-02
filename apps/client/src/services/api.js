import { createApiClient } from "@mrs/shared-api";

const runtimeApiUrl = typeof window !== "undefined" ? window?.mrsRuntimeConfig?.apiUrl : undefined;
const defaultApiBaseUrl =
  typeof __MRS_DEFAULT_API_BASE_URL__ !== "undefined"
    ? __MRS_DEFAULT_API_BASE_URL__
    : "http://localhost:5000/api";
const fallbackBaseURL = window.location.protocol === "file:" ? defaultApiBaseUrl : "/api";
const baseURL = runtimeApiUrl ?? import.meta.env.VITE_API_URL ?? fallbackBaseURL;
const api = createApiClient(baseURL);

export default api;
