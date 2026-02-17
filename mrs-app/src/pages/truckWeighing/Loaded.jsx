import { Container, Paper, Typography, Box, Button, Alert } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export default function TruckWeighingManualLoaded() {
  const navigate = useNavigate();
  const location = useLocation();
  const truck = location.state?.truck;

  if (!truck) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">
          ไม่พบข้อมูลรถที่เลือก กรุณากลับไปหน้าเลือกทะเบียน
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => navigate("/truckWeighing/Manual")}>
              กลับไปหน้าเลือกทะเบียน
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          บันทึกการชั่งน้ำหนักรถพร้อมน้ำนม (Loaded)
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            ทะเบียน: <b>{truck.truck_license}</b> | เจ้าของ: <b>{truck.owner}</b> | ช่อง:{" "}
            <b>{truck.number_channel}</b>
          </Alert>
        </Box>

        <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate("/truckWeighing/Manual")}>
            เปลี่ยนทะเบียน
          </Button>
          {/* ปุ่มบันทึกจริงจะทำขั้นต่อไป */}
          <Button variant="contained" disabled>
            บันทึก (ยังไม่ใส่ฟอร์ม)
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
