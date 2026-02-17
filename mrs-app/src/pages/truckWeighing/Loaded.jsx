import { useEffect, useMemo, useRef, useState } from "react";
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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Checkbox,
  FormControlLabel,
  Chip,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ClearIcon from "@mui/icons-material/Clear";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../providers/authProvider";
import { useToast } from "../../providers/toastProvider";
import { getLoadedTruckDetail } from "../../services/loadedService";

// ─── helpers ──────────────────────────────────────────────────────────────────

function toISODate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toCurrentTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MONTHS_TH = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

// YYYY-MM-DD → "01 มกราคม 2568" (พ.ศ.)
function formatDateThai(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${String(parseInt(d)).padStart(2, "0")} ${MONTHS_TH[parseInt(m) - 1]} ${parseInt(y) + 543}`;
}

function channelLabel(ch) {
  return Array.isArray(ch) ? ch.join("-") : String(ch);
}

// ─── CalendarInput: TextField แสดง Thai format + icon เปิด native date picker ──
function CalendarInput({ value, onChange, maxDate, error, helperText }) {
  const hiddenRef = useRef(null);

  const handleIconClick = () => {
    hiddenRef.current?.showPicker?.();
    hiddenRef.current?.click();
  };

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        fullWidth size="small"
        value={formatDateThai(value)}
        placeholder="เลือกวันที่"
        error={error}
        helperText={helperText}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleIconClick} tabIndex={-1}>
                <CalendarMonthIcon fontSize="small" color={error ? "error" : "action"} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        onClick={handleIconClick}
        sx={{ cursor: "pointer", "& input": { cursor: "pointer" } }}
      />
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        max={maxDate}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: "100%",
          opacity: 0,
          pointerEvents: "none",
        }}
        tabIndex={-1}
      />
    </Box>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Loaded() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const lockedTruck = location.state?.truck ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [truckList, setTruckList] = useState([]);
  const [coopList, setCoopList] = useState([]);

  const [selectedTruck, setSelectedTruck] = useState(lockedTruck);
  const [channelNumber, setChannelNumber] = useState(lockedTruck?.number_channel ?? 0);

  const [loadedDate, setLoadedDate] = useState(toISODate());
  const [loadedTime, setLoadedTime] = useState(toCurrentTime());
  const [loadedWeight, setLoadedWeight] = useState("");
  const [driverName, setDriverName] = useState("");

  const [milkCompartmentList, setMilkCompartmentList] = useState([]);
  const [checked, setChecked] = useState(false);

  const [dateError, setDateError] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [weightError, setWeightError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const headersReady = useMemo(() => Boolean(token && apiUrl), [token, apiUrl]);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await getLoadedTruckDetail({ apiUrl, token });
        setTruckList(data?.truck_list ?? []);
        setCoopList(data?.coop_list ?? []);
        if (data?.default_payment_calculate_type === 2) setChecked(true);
      } catch (e) {
        console.error(e);
        showToast("โหลดข้อมูลไม่สำเร็จ", "error");
      } finally {
        setLoading(false);
      }
    };
    if (!navigator.onLine) { setLoading(false); return; }
    if (headersReady) run();
  }, [headersReady, apiUrl, token, showToast]);

  useEffect(() => {
    if (channelNumber === 0) { setMilkCompartmentList([]); return; }
    if (checked) {
      const channelName = Array.from({ length: channelNumber }, (_, i) => i + 1);
      setMilkCompartmentList([{ channel: channelName, coop: [] }]);
    } else {
      setMilkCompartmentList(
        Array.from({ length: channelNumber }, (_, i) => ({ channel: i + 1, coop: [] }))
      );
    }
  }, [channelNumber, checked]);

  const handleSelectTruck = (truck) => {
    setSelectedTruck(truck);
    setChannelNumber(truck?.number_channel ?? 0);
  };

  const handleCoopChange = (rowIndex, newCoops) => {
    setMilkCompartmentList((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], coop: newCoops };
      return next;
    });
  };

  const validate = () => {
    if (!selectedTruck) { alert("โปรดกรอก ทะเบียนรถ"); return false; }
    if (!loadedDate)    { setDateError(true); return false; }
    if (!loadedTime)    { setTimeError(true); return false; }
    if (!loadedWeight || isNaN(parseFloat(loadedWeight))) { setWeightError(true); return false; }
    const isCoopNull = milkCompartmentList.every((item) => item.coop.length === 0);
    if (isCoopNull) { alert("โปรดเลือก ศูนย์ ฯ/สหกรณ์ที่ส่งน้ำนม"); return false; }
    setDateError(false); setTimeError(false); setWeightError(false);
    return true;
  };

  const onSubmit = () => { if (validate()) setConfirmOpen(true); };

  const onConfirmSave = async () => {
    setConfirmOpen(false);
    setSaving(true);

    try {
      let finalList = milkCompartmentList;
      if (checked) {
        finalList = milkCompartmentList[0].channel.map((_, i) => ({
          channel: i + 1,
          coop: milkCompartmentList[0].coop,
        }));
      }

      const [y, m, d] = loadedDate.split("-");
      const [hh, mm] = loadedTime.split(":");
      const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm));

      const payload = {
        truck_id: selectedTruck.truck_id,
        driver_name: driverName,
        truck_loaded_date_time: dt.toISOString(),
        truck_loaded_weight: parseFloat(parseFloat(loadedWeight).toFixed(2)),
        truck_milk_channel_coop: finalList,
        calulate_type: checked ? 2 : 1,
      };

      await axios.post(`${apiUrl}/loadedTruck/save`, payload, { headers });
      
      showToast("บันทึกสำเร็จ", "success");
      navigate("/truckWeighing/Manual", { replace: true });
    } catch (error) {
      console.error("Save error:", error);
      showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    } finally {
      setSaving(false);
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          บันทึกการชั่งน้ำหนักรถพร้อมน้ำนม
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
            <CircularProgress size={22} />
            <Typography>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                ทะเบียนรถ : <span style={{ color: "red" }}>*</span>
              </Typography>
              {lockedTruck ? (
                <TextField fullWidth size="small" value={lockedTruck.truck_license}
                  InputProps={{ readOnly: true }}
                  sx={{ "& .MuiInputBase-root": { bgcolor: "#f5f5f5" } }} />
              ) : (
                <>
                  <Autocomplete
                    options={truckList} value={selectedTruck}
                    onChange={(_, v) => handleSelectTruck(v)}
                    getOptionLabel={(opt) => opt?.truck_license ?? ""}
                    isOptionEqualToValue={(a, b) => a?.truck_id === b?.truck_id}
                    renderInput={(params) => (
                      <TextField {...params} size="small" placeholder="ทะเบียนรถ" />
                    )}
                  />
                  {!selectedTruck && (
                    <Typography variant="caption" color="error">โปรดกรอก ทะเบียนรถ</Typography>
                  )}
                </>
              )}
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                ชื่อ-นามสกุลคนขับรถ :
              </Typography>
              <TextField fullWidth size="small" value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="ชื่อ-นามสกุลคนขับรถ" />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                วันที่ชั่งน้ำหนัก : <span style={{ color: "red" }}>*</span>
              </Typography>
              <CalendarInput
                value={loadedDate}
                onChange={(v) => { setLoadedDate(v); setDateError(false); }}
                maxDate={toISODate()}
                error={dateError}
                helperText={dateError ? "กรุณาระบุวันที่" : ""}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                เวลาที่ชั่งน้ำหนัก : <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth size="small" type="time"
                value={loadedTime}
                onChange={(e) => { setLoadedTime(e.target.value); setTimeError(false); }}
                error={timeError}
                helperText={timeError ? "กรุณาระบุเวลา" : ""}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: loadedTime ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setLoadedTime("")} tabIndex={-1}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                เจ้าของรถ :
              </Typography>
              <TextField fullWidth size="small" value={selectedTruck?.owner ?? ""}
                InputProps={{ readOnly: true }} placeholder="เจ้าของรถ"
                sx={{ "& .MuiInputBase-root": { bgcolor: "#f5f5f5" } }} />
            </Box>
          </Box>
        )}
      </Paper>

      {!loading && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 2 }}>
          <Box sx={{ maxWidth: 360 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              น้ำหนักรถพร้อมน้ำนม (กก.) : <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField fullWidth size="small" type="number"
              value={loadedWeight}
              onChange={(e) => { setLoadedWeight(e.target.value); setWeightError(false); }}
              onBlur={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) setLoadedWeight(v.toFixed(2));
              }}
              inputProps={{ step: "0.01", min: "0" }}
              placeholder="น้ำหนักรถพร้อมน้ำนม"
              error={weightError}
              helperText={weightError ? "กรุณาระบุน้ำหนัก" : ""}
            />
          </Box>
        </Paper>
      )}

      {!loading && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              บันทึกข้อมูลช่องน้ำนม
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} size="small" />}
              label="ลงทั้งคัน"
              sx={{ ml: 0.5, "& .MuiFormControlLabel-label": { fontWeight: 600, fontSize: 14 } }}
            />
          </Box>

          {selectedTruck && milkCompartmentList.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fafafa" }}>
                    <TableCell sx={{ fontWeight: 700, width: 100, textAlign: "center" }}>ช่อง ↕</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ศูนย์ ฯ / สหกรณ์ที่ส่งน้ำนม ↕</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {milkCompartmentList.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ textAlign: "center", fontWeight: 600 }}>
                        {channelLabel(row.channel)}
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          multiple disableCloseOnSelect size="small"
                          options={coopList}
                          value={row.coop}
                          onChange={(_, newVal) => handleCoopChange(idx, newVal)}
                          getOptionLabel={(opt) => opt?.coop_name ?? ""}
                          isOptionEqualToValue={(a, b) => a?.coop_id === b?.coop_id}
                          filterSelectedOptions
                          renderTags={(value, getTagProps) =>
                            value.map((option, i) => {
                              const { key, ...tagProps } = getTagProps({ index: i });
                              return (
                                <Chip key={key} label={option.coop_name} size="small" {...tagProps} />
                              );
                            })
                          }
                          renderInput={(params) => (
                            <TextField {...params} placeholder={row.coop.length === 0 ? "เลือก" : ""} />
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            !selectedTruck && (
              <Typography variant="body2" color="text.secondary">กรุณาเลือกทะเบียนรถก่อน</Typography>
            )
          )}

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
            <Button 
              variant="contained" 
              color="error" 
              size="large"
              sx={{ minWidth: 160, fontWeight: 700 }} 
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              size="large"
              sx={{ minWidth: 160, fontWeight: 700 }} 
              onClick={onSubmit} 
              disabled={!selectedTruck || saving}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </Box>
        </Paper>
      )}

      <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)}>
        <DialogTitle>ยืนยันการบันทึก</DialogTitle>
        <DialogContent>
          <DialogContentText>ต้องการบันทึกข้อมูลทั้งหมดหรือไม่</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="error" variant="contained" onClick={() => setConfirmOpen(false)} disabled={saving}>
            ยกเลิก
          </Button>
          <Button color="success" variant="contained" onClick={onConfirmSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "ตกลง"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}