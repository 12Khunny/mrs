import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Autocomplete,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../../providers/authProvider";
import { useNavigate } from "react-router-dom";

export default function TruckWeighingManual() {
  const apiUrl = import.meta.env.VITE_API_URL; // เช่น https://api.zyanwoa.com/__testapi2__
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [truckList, setTruckList] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  useEffect(() => {
    const fetchInit = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/loadedTruck/loadedTruckDetail`, { headers });
        setTruckList(res.data?.truck_list ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    if (token) fetchInit();
  }, [apiUrl, headers, token]);

  const onConfirm = () => {
    if (!selectedTruck) return;

    // ✅ ทางเลือก A: อยู่หน้าเดิมแล้วค่อยแสดงฟอร์มต่อ (stepper) — เราจะทำต่อขั้นถัดไปได้
    // ✅ ทางเลือก B: ไปหน้า record แยก route พร้อม state เหมือนเว็บหลัก
    navigate("/truck-weighing/manual/record", { state: { truck: selectedTruck } });
  };

  if (!navigator.onLine) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อใช้งานหน้านี้</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          บันทึกการชั่งน้ำหนักแบบ Manual
        </Typography>

        {loading ? (
          <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={22} />
            <Typography>กำลังโหลดทะเบียนรถ...</Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Autocomplete
              options={truckList}
              value={selectedTruck}
              onChange={(_, v) => setSelectedTruck(v)}
              getOptionLabel={(opt) => opt?.truck_license ?? ""}
              isOptionEqualToValue={(a, b) => a?.truck_id === b?.truck_id}
              renderInput={(params) => (
                <TextField {...params} label="เลือกทะเบียนรถ" placeholder="พิมพ์เพื่อค้นหา" />
              )}
            />

            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <Button variant="contained" onClick={onConfirm} disabled={!selectedTruck}>
                ตกลง
              </Button>
            </Box>

            {selectedTruck && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  เลือก: <b>{selectedTruck.truck_license}</b> | เจ้าของ:{" "}
                  <b>{selectedTruck.owner}</b> | จำนวนช่อง:{" "}
                  <b>{selectedTruck.number_channel}</b>
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
