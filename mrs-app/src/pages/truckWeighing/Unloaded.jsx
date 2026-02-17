import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../providers/authProvider";
import { useNavigate, useParams } from "react-router-dom";

export default function TruckWeighingUnloaded() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/unloadedTruck/unloadedTruckDetail/${id}`, { headers });
        const t = res.data?.content ?? res.data?.detail ?? res.data;
        setDetail(t);
      } catch (e) {
        console.error(e);
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    if (token && id) fetchDetail();
  }, [apiUrl, headers, token, id]);

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
          บันทึกการชั่งน้ำหนักรถเปล่า (Unloaded)
        </Typography>

        {loading ? (
          <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={22} />
            <Typography>กำลังโหลดข้อมูลรายการ...</Typography>
          </Box>
        ) : !detail ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            โหลดข้อมูลไม่สำเร็จ หรือไม่พบรายการ
          </Alert>
        ) : (
          <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
            <Alert severity="info">
              ทะเบียน: <b>{detail.truck_license}</b> | คนขับ: <b>{detail.driver_name}</b>
            </Alert>

            <Alert severity="success">
              ชั่งเข้า: <b>{detail.truck_loaded_weight}</b> ({detail.truck_loaded_date_time_text})
            </Alert>

            <Alert severity={detail.truck_unloaded_weight ? "success" : "warning"}>
              ชั่งออก:{" "}
              <b>{detail.truck_unloaded_weight ?? "ยังไม่มีข้อมูล (ต้องบันทึก)"}</b>{" "}
              {detail.truck_unloaded_date_time_text ? `(${detail.truck_unloaded_date_time_text})` : ""}
            </Alert>

            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={() => navigate("/truckWeighing/Manual")}>
                กลับไปเลือกทะเบียน
              </Button>

              {/* ปุ่มบันทึกจริงจะทำขั้นต่อไป */}
              <Button variant="contained" disabled>
                บันทึกชั่งรถเปล่า (ยังไม่ใส่ฟอร์ม)
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
