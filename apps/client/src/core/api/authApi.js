import { createApiClient, ExternalAuthContract } from "@mrs/shared-api";

const externalApi = createApiClient(import.meta.env.VITE_API_URL);

export const login = async (payload) => {
  return externalApi.post(ExternalAuthContract.login.path, payload);
};
