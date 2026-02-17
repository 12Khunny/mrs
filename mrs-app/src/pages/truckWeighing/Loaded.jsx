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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../providers/authProvider";
import { getLoadedTruckDetail } from "../../services/loadedService";

function toISODate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toISOTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// แปลง YYYY-MM-DD → DD เดือนไทย YYYY
function formatDateThai(iso) {
  if (!iso) return "";
  const months = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
  ];
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${parseInt(y) + 543}`;
}

export default function Loaded() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [truckList, setTruckList] = useState([]);
  const [coopList, setCoopList] = useState([]);

  // ✅ ถ้ามาจาก Manual จะมี truck ใน state → lock ไม่ให้เปลี่ยน
  const lockedTruck = location.state?.truck ?? null;
  const [selectedTruck, setSelectedTruck] = useState(lockedTruck);

  const [loadedDate, setLoadedDate] = useState(toISODate());
  const [loadedTime, setLoadedTime] = useState(toISOTime());
  const [loadedWeight, setLoadedWeight] = useState("");
  const [driverName, setDriverName] = useState("");
  const [channelCoops, setChannelCoops] = useState({});
  const [fillAll, setFillAll] = useState(false); // toggle บันทึกช่องเดียวกันทั้งคัน
  const [allCoop, setAllCoop] = useState("");    // coop เดียวสำหรับทุกช่องเมื่อ fillAll

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
    if (!navigator.onLine) { setLoading(false); return; }
    if (headersReady) run();
  }, [headersReady, apiUrl, token]);

  const channelCount = selectedTruck?.number_channel ?? 0;
  const channels = Array.from({ length: channelCount }, (_, i) => i + 1);

  const handleCoopChange = (ch, val) => {
    setChannelCoops((prev) => ({ ...prev, [ch]: val }));
  };

  // เมื่อ fillAll เปิด → ตั้ง coop เดียวกันทุกช่อง
  const handleFillAll = (val) => {
    setAllCoop(val);
    const all = {};
    channels.forEach((ch) => { all[ch] = val; });
    setChannelCoops(all);
  };

  const validate = () => {
    if (!selectedTruck) return "กรุณาเลือกทะเบียนรถ";
    if (!loadedDate)    return "กรุณาเลือกวันที่ชั่งน้ำหนัก";
    if (!loadedTime)    return "กรุณาเลือกเวลาชั่งน้ำหนัก";
    if (!loadedWeight)  return "กรุณากรอกน้ำหนักรถพร้อมน้ำนม";
    for (const ch of channels) {
      if (!channelCoops[ch]) return `กรุณาเลือกสหกรณ์ของช่อง ${ch}`;
    }
    return "";
  };

  const onSave = () => {
    const err = validate();
    if (err) { alert(err); return; }
    const payload = {
      truck_id: selectedTruck.truck_id,
      truck_license: selectedTruck.truck_license,
      driver_name: driverName,
      truck_loaded_date_time: `${loadedDate}T${loadedTime}`,
      truck_loaded_weight: loadedWeight,
      truck_milk_channel_coop: channels.map((ch) => ({ channel: ch, coop_id: channelCoops[ch] })),
    };
    console.log("SAVE LOADED payload:", payload);
    alert("ฟอร์ม Loaded ผ่านแล้ว (ต่อ API บันทึกได้เลย)");
  };

  const onReset = () => {
    if (!lockedTruck) setSelectedTruck(null);
    setDriverName("");
    setLoadedWeight("");
    setChannelCoops({});
    setAllCoop("");
    setFillAll(false);
    setLoadedDate(toISODate());
    setLoadedTime(toISOTime());
  };

  if (!navigator.onLine) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อใช้งานหน้านี้</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>

        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
          บันทึกการชั่งน้ำหนักรถพร้อมน้ำนม
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={22} />
            <Typography>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : (
          <>
            {/* ───── แถวบน: 3 คอลัมน์ ───── */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, mb: 3 }}>

              {/* คอลัมน์ 1: ทะเบียนรถ / เจ้าของรถ / คนขับ */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    ทะเบียนรถ : <span style={{ color: "red" }}>*</span>
                  </Typography>
                  {/* ✅ ถ้ามาจาก Manual (lockedTruck) → readonly TextField, ไม่ให้เปลี่ยน */}
                  {lockedTruck ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={lockedTruck.truck_license}
                      InputProps={{ readOnly: true }}
                      sx={{ "& .MuiInputBase-root": { bgcolor: "#f5f5f5" } }}
                    />
                  ) : (
                    <Autocomplete
                      options={truckList}
                      value={selectedTruck}
                      onChange={(_, v) => { setSelectedTruck(v); setChannelCoops({}); setAllCoop(""); setFillAll(false); }}
                      getOptionLabel={(opt) => opt?.truck_license ?? ""}
                      isOptionEqualToValue={(a, b) => a?.truck_id === b?.truck_id}
                      renderInput={(params) => (
                        <TextField {...params} size="small" placeholder="พิมพ์เพื่อค้นหา" />
                      )}
                    />
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    เจ้าของรถ
                  </Typography>
                  {/* ✅ เจ้าของรถ readonly เสมอ (ดึงจาก truck) */}
                  <TextField
                    fullWidth
                    size="small"
                    value={selectedTruck?.owner ?? ""}
                    InputProps={{ readOnly: true }}
                    sx={{ "& .MuiInputBase-root": { bgcolor: "#f5f5f5" } }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    ชื่อ-นามสกุลคนขับรถ :
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="ชื่อ-นามสกุลคนขับรถ"
                  />
                </Box>
              </Box>

              {/* คอลัมน์ 2: วันที่ / เวลา */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    วันที่ชั่งน้ำหนัก : <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={loadedDate}
                    onChange={(e) => setLoadedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    // แสดงวันที่ไทยเป็น placeholder (optional)
                    inputProps={{ style: { cursor: "pointer" } }}
                  />
                  {loadedDate && (
                    <Typography variant="caption" color="text.secondary">
                      {formatDateThai(loadedDate)}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    เวลาที่ชั่งน้ำหนัก : <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={loadedTime}
                    onChange={(e) => setLoadedTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>

              {/* คอลัมน์ 3: น้ำหนัก + ปุ่ม */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    น้ำหนักรถพร้อมน้ำนม (กก.) : <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={loadedWeight}
                    onChange={(e) => setLoadedWeight(e.target.value)}
                    placeholder="น้ำหนักรถพร้อมน้ำนม"
                    type="number"
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </Box>
            </Box>

            {/* ───── ตารางช่องน้ำนม ───── */}
            {selectedTruck && channelCount > 0 && (
              <Box sx={{ mt: 1 }}>
                {/* Header + Toggle */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    บันทึกข้อมูลช่องน้ำนมลงทั้งคัน
                  </Typography>
                  <Switch
                    checked={fillAll}
                    onChange={(e) => {
                      setFillAll(e.target.checked);
                      if (!e.target.checked) { setAllCoop(""); setChannelCoops({}); }
                    }}
                    size="small"
                  />
                </Box>

                {/* เมื่อ toggle เปิด: dropdown เลือก coop เดียว apply ทุกช่อง */}
                {fillAll && (
                  <Box sx={{ mb: 2, maxWidth: 400 }}>
                    <FormControl fullWidth size="small">
                      <Select
                        displayEmpty
                        value={allCoop}
                        onChange={(e) => handleFillAll(e.target.value)}
                        renderValue={(v) => v ? (coopList.find(c => c.coop_id === v)?.coop_nickname || coopList.find(c => c.coop_id === v)?.coop_name || v) : <em style={{ color: "#aaa" }}>เลือกสหกรณ์ (ใช้กับทุกช่อง)</em>}
                      >
                        <MenuItem value=""><em>เลือก</em></MenuItem>
                        {coopList.map((c) => (
                          <MenuItem key={c.coop_id} value={c.coop_id}>
                            {c.coop_nickname || c.coop_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#fafafa" }}>
                        <TableCell sx={{ fontWeight: 700, width: 100, textAlign: "center" }}>
                          ช่อง&nbsp;↕
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          ศูนย์ฯ / สหกรณ์ที่ส่งน้ำนม&nbsp;↕
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {channels.map((ch) => (
                        <TableRow key={ch} hover>
                          <TableCell sx={{ textAlign: "center", fontWeight: 600 }}>
                            {ch}
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                displayEmpty
                                value={channelCoops[ch] ?? ""}
                                onChange={(e) => handleCoopChange(ch, e.target.value)}
                                disabled={fillAll} // ล็อคเมื่อใช้ fillAll
                                renderValue={(v) =>
                                  v
                                    ? (coopList.find((c) => c.coop_id === v)?.coop_nickname ||
                                       coopList.find((c) => c.coop_id === v)?.coop_name || v)
                                    : <em style={{ color: "#aaa" }}>เลือก</em>
                                }
                                sx={{ bgcolor: fillAll ? "#f5f5f5" : "inherit" }}
                              >
                                <MenuItem value=""><em>เลือก</em></MenuItem>
                                {coopList.map((c) => (
                                  <MenuItem key={c.coop_id} value={c.coop_id}>
                                    {c.coop_nickname || c.coop_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* ───── ปุ่ม บันทึก / ยกเลิก (ขวาล่าง) ───── */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                sx={{ minWidth: 160, fontWeight: 700 }}
                onClick={onSave}
                disabled={!selectedTruck}
              >
                บันทึกข้อมูล
              </Button>
              <Button
                variant="contained"
                color="error"
                size="large"
                sx={{ minWidth: 160, fontWeight: 700 }}
                onClick={onReset}
              >
                ยกเลิก
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}