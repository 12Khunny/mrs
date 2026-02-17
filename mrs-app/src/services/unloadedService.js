import { createApiClient } from "./api";

export async function getUnloadedTruckDetailById({ apiUrl, token, id }) {
  const api = createApiClient({ baseURL: apiUrl, token });
  const res = await api.get(`/unloadedTruck/unloadedTruckDetail/${id}`);
  return res.data;
}
