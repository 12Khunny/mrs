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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import { useAuth } from "../../providers/authProvider";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../providers/toastProvider";

const filterOptions = (options, { inputValue }) => {
  const searchTerm = inputValue.trim().toLowerCase();
  if (!searchTerm) return options;
  return options.filter(option => 
    (option.truck_license || '').toLowerCase().includes(searchTerm) ||
    (option.owner || '').toLowerCase().includes(searchTerm)
  );
};

export default function TruckWeighingManual() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [truckList, setTruckList] = useState([]);
  const [selectedTruck, setSelectedTruck] = useState(null);

  const [pendingOpen, setPendingOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    const fetchInit = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/loadedTruck/loadedTruckDetail`, { headers });
        setTruckList(res.data?.truck_list ?? []);
      } catch (e) {
        console.error(e);
        showToast("โหลดทะเบียนรถไม่สำเร็จ", "error");
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    if (token) fetchInit();
  }, [apiUrl, headers, token, showToast]);

  const onConfirm = async () => {
    if (!selectedTruck) return;

    try {
      const listRes = await axios.get(`${apiUrl}/loadedTruck/loadedTruckList`, { headers });
      const list = Array.isArray(listRes.data) ? listRes.data : [];

      const sameTruck = list.filter((x) => x?.truck_license === selectedTruck?.truck_license);

      if (sameTruck.length === 0) {
        navigate("/truckWeighing/Loaded", { state: { truck: selectedTruck } });
        return;
      }

      const latest = sameTruck.reduce(
        (best, cur) => ((cur?.id || 0) > (best?.id || 0) ? cur : best),
        sameTruck[0]
      );

      let detail;
      try {
        const detailRes = await axios.get(
          `${apiUrl}/unloadedTruck/unloadedTruckDetail/${latest.id}`,
          { headers }
        );
        detail = detailRes.data?.content ?? detailRes.data?.detail ?? detailRes.data;
      } catch (e) {
        detail = null;
      }

      const hasLoaded = !!(latest?.truck_loaded_weight || detail?.truck_loaded_weight);
      const hasUnloaded = !!detail?.truck_unloaded_weight;

      if (hasLoaded && !hasUnloaded) {
        setPendingPayload({ latestId: latest.id, truck: selectedTruck });
        setPendingOpen(true);
        return;
      }

      navigate("/truckWeighing/Loaded", { state: { truck: selectedTruck } });
    } catch (e) {
      console.error(e);
      showToast("ตรวจสอบรายการล่าสุดไม่สำเร็จ", "error");
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
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
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
              openOnFocus
              autoHighlight
              options={truckList}
              value={selectedTruck}
              onChange={(_, v) => setSelectedTruck(v)}
              getOptionLabel={(opt) => opt?.truck_license ?? ""}
              isOptionEqualToValue={(a, b) => a?.truck_license === b?.truck_license}
              filterOptions={filterOptions}
              renderInput={(params) => (
                <TextField {...params} label="เลือกทะเบียนรถ" placeholder="พิมพ์เพื่อค้นหา..." />
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

      <Dialog open={pendingOpen} onClose={() => setPendingOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>พบรายการค้าง</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ทะเบียน <b>{pendingPayload?.truck?.truck_license}</b> มีการชั่งเข้าแล้ว
            <br />
            ต้องการไปบันทึก <b>ชั่งรถเปล่า</b> ของรายการเดิมหรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingOpen(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={() => {
              const id = pendingPayload?.latestId;
              const truck = pendingPayload?.truck;
              setPendingOpen(false);
              if (id) navigate(`/truckWeighing/Unloaded/${id}`, { state: { truck } });
            }}
          >
            ตกลง
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}