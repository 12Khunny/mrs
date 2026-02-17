// mrs-app/src/pages/truckWeighing/Unloaded.jsx
import { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

export default function TruckWeighingUnloaded() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // id ของ transaction เดิม

  const truck = location.state?.truck;

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [unloadedWeight, setUnloadedWeight] = useState("");

  if (!navigator.onLine) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อใช้งานหน้านี้</Alert>
      </Container>
    );
  }

  const onSave = async () => {
    try {
      // ✅ TODO: endpoint จริงของ “บันทึกชั่งออก” (เดาเป็น /unloadedTruck/save)
      // โดยส่ง id ของรายการเดิมเพื่อเติมข้อมูลให้ครบ transaction
      const payload = {
        id: Number(id),
        truck_unloaded_weight: unloadedWeight,
      };

      await axios.post(`${apiUrl}/unloadedTruck/save`, payload, { headers });
      showToast?.("บันทึกชั่งออก (Unloaded) สำเร็จ", "success");

      navigate("/truckWeighing/Manual", { replace: true });
    } catch (e) {
      console.error(e);
      showToast?.("บันทึกชั่งออกไม่สำเร็จ", "error");
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          บันทึกการชั่งน้ำหนักรถเปล่า (Unloaded)
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            Transaction ID: <b>{id}</b>
            {truck?.truck_license ? (
              <>
                {" "}
                | ทะเบียน: <b>{truck.truck_license}</b>
              </>
            ) : null}
          </Alert>
        </Box>

        <Box sx={{ mt: 3, display: "grid", gap: 2, maxWidth: 520 }}>
          <TextField
            label="น้ำหนักรถเปล่า (กก.)"
            value={unloadedWeight}
            onChange={(e) => setUnloadedWeight(e.target.value)}
            placeholder="เช่น 8980"
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate("/truckWeighing/Manual")}>
              ย้อนกลับ
            </Button>
            <Button variant="contained" color="success" onClick={onSave} disabled={!unloadedWeight}>
              บันทึก
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
