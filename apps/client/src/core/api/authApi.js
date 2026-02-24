import { createApiClient, ExternalAuthContract } from "@mrs/shared-api";

const runtimeApiUrl = typeof window !== "undefined" ? window?.mrsRuntimeConfig?.apiUrl : undefined;
const fallbackBaseURL = window.location.protocol === "file:" ? "http://localhost:5000/api" : "/api";
const externalApi = createApiClient(runtimeApiUrl ?? import.meta.env.VITE_API_URL ?? fallbackBaseURL);

export const login = async (payload) => {
  return externalApi.post(ExternalAuthContract.login.path, payload);
};
