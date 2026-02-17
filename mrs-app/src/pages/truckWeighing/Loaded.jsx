import { useEffect, useMemo, useState } from "react";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import { useAuth } from "../../providers/authProvider";

// ✅ แบบ A (แนะนำ): ถ้าไฟล์อยู่ src/services/loadedService.js
import { getLoadedTruckDetail } from "../../services/loadedService";

// ✅ แบบ B: ถ้าไฟล์อยู่ src/pages/services/loadedService.js
// import { getLoadedTruckDetail } from "../services/loadedService";

function toISODate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toISOTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Loaded() {
  const apiUrl = import.meta.env.VITE_API_URL; // https://api.zyanwoa.com/__testapi2__
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [truckList, setTruckList] = useState([]);
  const [coopList, setCoopList] = useState([]);

  const [selectedTruck, setSelectedTruck] = useState(null);

  // ฟิลด์ฟอร์ม
  const [loadedDate, setLoadedDate] = useState(toISODate());
  const [loadedTime, setLoadedTime] = useState(toISOTime());
  const [loadedWeight, setLoadedWeight] = useState("");
  const [driverName, setDriverName] = useState("");

  // ช่องน้ำนม: เก็บ coop ต่อ channel
  const [channelCoops, setChannelCoops] = useState({}); // {1: coop_id, 2: coop_id, 3: coop_id}

  const headersReady = useMemo(() => Boolean(token && apiUrl), [token, apiUrl]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getLoadedTruckDetail({ apiUrl, token });
        setTruckList(data?.truck_list ?? []);
        setCoopList(data?.coop_list ?? []);
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
    if (headersReady) run();
  }, [headersReady, apiUrl, token]);

  const channelCount = selectedTruck?.number_channel ?? 0;
  const channels = Array.from({ length: channelCount }, (_, i) => i + 1);

  const handleSelectCoop = (ch, coopId) => {
    setChannelCoops((prev) => ({ ...prev, [ch]: coopId }));
  };

  const validate = () => {
    if (!selectedTruck) return "กรุณาเลือกทะเบียนรถ";
    if (!loadedDate) return "กรุณาเลือกวันที่ชั่งน้ำหนัก";
    if (!loadedTime) return "กรุณาเลือกเวลาชั่งน้ำหนัก";
    if (!loadedWeight) return "กรุณากรอกน้ำหนักรถพร้อมน้ำนม";
    // ตัวอย่าง validate coop ครบทุกช่อง
    for (const ch of channels) {
      if (!channelCoops[ch]) return `กรุณาเลือกสหกรณ์ของช่อง ${ch}`;
    }
    return "";
  };

  const onSave = () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    // TODO: ตรงนี้ค่อยต่อ API “บันทึก loaded” ของคุณ
    // payload ตัวอย่าง:
    const payload = {
      truck_id: selectedTruck.truck_id,
      truck_license: selectedTruck.truck_license,
      driver_name: driverName,
      truck_loaded_date_time: `${loadedDate}T${loadedTime}`,
      truck_loaded_weight: loadedWeight,
      truck_milk_channel_coop: channels.map((ch) => ({
        channel: ch,
        coop_id: channelCoops[ch],
      })),
    };

    console.log("SAVE LOADED payload:", payload);
    alert("ฟอร์ม Loaded ผ่านแล้ว (ต่อ API บันทึกได้เลย)");
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
          บันทึกการชั่งน้ำหนักรถพร้อมน้ำนม (Loaded)
        </Typography>

        {loading ? (
          <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={22} />
            <Typography>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={truckList}
                  value={selectedTruck}
                  onChange={(_, v) => {
                    setSelectedTruck(v);
                    setChannelCoops({});
                  }}
                  getOptionLabel={(opt) => opt?.truck_license ?? ""}
                  isOptionEqualToValue={(a, b) => a?.truck_id === b?.truck_id}
                  renderInput={(params) => (
                    <TextField {...params} label="ทะเบียนรถ" placeholder="พิมพ์เพื่อค้นหา" />
                  )}
                />

                <TextField
                  sx={{ mt: 2 }}
                  fullWidth
                  label="เจ้าของรถ"
                  value={selectedTruck?.owner ?? ""}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  sx={{ mt: 2 }}
                  fullWidth
                  label="ชื่อ-นามสกุลคนขับรถ"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="วันที่ชั่งน้ำหนัก"
                  value={loadedDate}
                  onChange={(e) => setLoadedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  sx={{ mt: 2 }}
                  fullWidth
                  type="time"
                  label="เวลาชั่งน้ำหนัก"
                  value={loadedTime}
                  onChange={(e) => setLoadedTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="น้ำหนักรถพร้อมน้ำนม (กก.)"
                  value={loadedWeight}
                  onChange={(e) => setLoadedWeight(e.target.value)}
                  placeholder="เช่น 24370"
                />

                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button variant="contained" onClick={onSave} disabled={!selectedTruck}>
                    บันทึกข้อมูล
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setSelectedTruck(null);
                      setDriverName("");
                      setLoadedWeight("");
                      setChannelCoops({});
                      setLoadedDate(toISODate());
                      setLoadedTime(toISOTime());
                    }}
                  >
                    ยกเลิก
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {selectedTruck && (
              <Box sx={{ mt: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  บันทึกข้อมูลช่องน้ำนมลงถังคืน
                </Typography>

                <Grid container spacing={2}>
                  {channels.map((ch) => (
                    <Grid key={ch} item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>{`ช่อง ${ch} - ศูนย์/สหกรณ์ที่ส่งน้ำนม`}</InputLabel>
                        <Select
                          label={`ช่อง ${ch} - ศูนย์/สหกรณ์ที่ส่งน้ำนม`}
                          value={channelCoops[ch] ?? ""}
                          onChange={(e) => handleSelectCoop(ch, e.target.value)}
                        >
                          <MenuItem value="">
                            <em>เลือก</em>
                          </MenuItem>
                          {coopList.map((c) => (
                            <MenuItem key={c.coop_id} value={c.coop_id}>
                              {c.coop_nickname || c.coop_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
