import axios from "axios";

export async function getLoadedTruckDetail({ apiUrl, token }) {
  const res = await axios.get(`${apiUrl}/loadedTruck/loadedTruckDetail`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // { truck_list, coop_list, default_payment_calculate_type }
}
