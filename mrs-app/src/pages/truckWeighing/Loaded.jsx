// mrs-app/src/pages/truckWeighing/Loaded.jsx
import { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
} from "@mui/material";

import { useAuth } from "../../providers/authProvider";
import { useToast } from "../../providers/toastProvider";

export default function TruckWeighingLoaded() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const truck = location.state?.truck;

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [driverName, setDriverName] = useState("");
  const [loadedWeight, setLoadedWeight] = useState("");

  if (!navigator.onLine) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อใช้งานหน้านี้</Alert>
      </Container>
    );
  }

  if (!truck) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">
          ยังไม่ได้เลือกทะเบียนรถ — กลับไปหน้า Manual แล้วเลือกทะเบียนรถก่อน
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => navigate("/truckWeighing/Manual")}>
            ไปหน้าเลือกทะเบียนรถ
          </Button>
        </Box>
      </Container>
    );
  }

  const onSave = async () => {
    try {
      // ✅ TODO: endpoint จริงของ “บันทึกชั่งเข้า” (เว็บหลักใช้ /loadedTruck/save)
      const payload = {
        truck_id: truck.truck_id,
        driver_name: driverName,
        truck_loaded_weight: loadedWeight,
      };

      await axios.post(`${apiUrl}/loadedTruck/save`, payload, { headers });
      showToast?.("บันทึกชั่งเข้า (Loaded) สำเร็จ", "success");

      // หลังบันทึกแล้ว กลับไปหน้าเลือกทะเบียนรถ (หรือจะพาไปหน้า unloaded ก็ได้)
      navigate("/truckWeighing/Manual", { replace: true });
    } catch (e) {
      console.error(e);
      showToast?.("บันทึกชั่งเข้าไม่สำเร็จ", "error");
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          บันทึกการชั่งน้ำหนักรถพร้อมน้ำนม (Loaded)
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            ทะเบียน: <b>{truck.truck_license}</b> | เจ้าของ: <b>{truck.owner}</b> | ช่อง:{" "}
            <b>{truck.number_channel}</b>
          </Alert>
        </Box>

        <Box sx={{ mt: 3, display: "grid", gap: 2, maxWidth: 520 }}>
          <TextField
            label="ชื่อ-นามสกุลคนขับรถ"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
          />

          <TextField
            label="น้ำหนักรถพร้อมน้ำนม (กก.)"
            value={loadedWeight}
            onChange={(e) => setLoadedWeight(e.target.value)}
            placeholder="เช่น 15050"
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate("/truckWeighing/Manual")}>
              ย้อนกลับ
            </Button>
            <Button variant="contained" onClick={onSave} disabled={!loadedWeight}>
              บันทึก
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
