import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
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
import { useAuth } from "../../providers/authProvider";
import { useNavigate } from "react-router-dom";

export default function TruckWeighingManual() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [truckList, setTruckList] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    const fetchInit = async () => {
      setLoading(true);
      try {
        // ใช้ detail เพื่อดึง truck_list เหมือนที่คุณทำอยู่
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

  const onConfirm = async () => {
    if (!selectedTruck) return;

    try {
      // 1) ดึง list รายการชั่งเข้า
      const listRes = await axios.get(`${apiUrl}/loadedTruck/loadedTruckList`, { headers });
      const list = Array.isArray(listRes.data) ? listRes.data : [];

      // 2) กรองตาม truck_id (ชัวร์กว่า truck_license)
      const sameTruck = list.filter((x) => x?.truck_id === selectedTruck?.truck_id);

      // ไม่เคยมีรายการเลย -> ไปหน้า ชั่งเข้า (เริ่มใหม่)
      if (sameTruck.length === 0) {
        navigate("/truckWeighing/Manual", { state: { truck: selectedTruck } });
        return;
      }

      // 3) หา “รายการล่าสุด” (ใช้ id มากสุด)
      const latest = sameTruck.reduce(
        (best, cur) => ((cur?.id || 0) > (best?.id || 0) ? cur : best),
        sameTruck[0]
      );

      // 4) เช็คว่ารายการล่าสุดมี unloaded หรือยัง (ใช้ endpoint ที่คุณจับได้)
      const detailRes = await axios.get(
        `${apiUrl}/unloadedTruck/unloadedTruckDetail/${latest.id}`,
        { headers }
      );

      const t = detailRes.data?.content ?? detailRes.data?.detail ?? detailRes.data;

      const hasLoaded = !!t?.truck_loaded_weight;
      const hasUnloaded = !!t?.truck_unloaded_weight;

      if (hasLoaded && !hasUnloaded) {
        const r = await Swal.fire({
          title: "พบรายการค้าง",
          html: `
            ทะเบียน <b>${selectedTruck.truck_license}</b> มีการชั่งเข้าแล้ว<br/>
            ต้องการไปบันทึก <b>ชั่งรถเปล่า</b> ของรายการเดิมหรือไม่?
          `,
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "ตกลง",
          cancelButtonText: "ยกเลิก",
          reverseButtons: true,
        });

        if (r.isConfirmed) {
          navigate(`/truckWeighing/Unloaded/${latest.id}`, {
            state: { truck: selectedTruck },
          });
        }
        return;
      }

      // ถ้ารายการล่าสุดครบแล้ว -> เริ่มใหม่ไปหน้า ชั่งเข้า
      navigate("/truckWeighing/Loaded", { state: { truck: selectedTruck } });
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "ตรวจสอบรายการล่าสุดไม่สำเร็จ",
        text: "โปรดลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
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
                  <b>{selectedTruck.owner}</b> | จำนวนช่อง: <b>{selectedTruck.number_channel}</b>
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
