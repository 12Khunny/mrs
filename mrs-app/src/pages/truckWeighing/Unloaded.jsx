import { useMemo, useRef, useState } from "react";
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

import { useAuth } from "../../providers/authProvider";
import { useToast } from "../../providers/toastProvider";

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

function formatDateThai(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${String(parseInt(d)).padStart(2, "0")} ${MONTHS_TH[parseInt(m) - 1]} ${parseInt(y) + 543}`;
}

// ─── CalendarInput ────────────────────────────────────────────────────────────

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

export default function TruckWeighingUnloaded() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const truck = location.state?.truck;

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [unloadedDate, setUnloadedDate] = useState(toISODate());
  const [unloadedTime, setUnloadedTime] = useState(toCurrentTime());
  const [unloadedWeight, setUnloadedWeight] = useState("");
  const [driverName, setDriverName] = useState("");

  const [dateError, setDateError] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [weightError, setWeightError] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!navigator.onLine) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อใช้งานหน้านี้</Alert>
      </Container>
    );
  }

  const validate = () => {
    if (!unloadedDate) { setDateError(true); return false; }
    if (!unloadedTime) { setTimeError(true); return false; }
    if (!unloadedWeight || isNaN(parseFloat(unloadedWeight))) { setWeightError(true); return false; }
    setDateError(false); setTimeError(false); setWeightError(false);
    return true;
  };

  const onSubmit = () => {
    if (validate()) setConfirmOpen(true);
  };

  const onConfirmSave = async () => {
    setConfirmOpen(false);
    setSaving(true);

    try {
      const [y, m, d] = unloadedDate.split("-");
      const [hh, mm] = unloadedTime.split(":");
      const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm));

      const payload = {
        id: Number(id),
        driver_name: driverName,
        truck_unloaded_date_time: dt.toISOString(),
        truck_unloaded_weight: parseFloat(parseFloat(unloadedWeight).toFixed(2)),
      };

      await axios.post(`${apiUrl}/unloadedTruck/save`, payload, { headers });
      
      showToast("บันทึกชั่งออกสำเร็จ", "success");
      navigate("/truckWeighing/Manual", { replace: true });
    } catch (error) {
      console.error("Save error:", error);
      showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          บันทึกการชั่งน้ำหนักรถเปล่า
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Alert severity="info">
            Transaction ID: <b>{id}</b>
            {truck?.truck_license && (
              <>
                {" "}| ทะเบียน: <b>{truck.truck_license}</b>
              </>
            )}
          </Alert>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              วันที่ชั่งน้ำหนัก : <span style={{ color: "red" }}>*</span>
            </Typography>
            <CalendarInput
              value={unloadedDate}
              onChange={(v) => { setUnloadedDate(v); setDateError(false); }}
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
              value={unloadedTime}
              onChange={(e) => { setUnloadedTime(e.target.value); setTimeError(false); }}
              error={timeError}
              helperText={timeError ? "กรุณาระบุเวลา" : ""}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: unloadedTime ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setUnloadedTime("")} tabIndex={-1}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
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

        <Box sx={{ maxWidth: 360, mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            น้ำหนักรถเปล่า (กก.) : <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField 
            fullWidth 
            size="small" 
            type="number"
            value={unloadedWeight}
            onChange={(e) => { setUnloadedWeight(e.target.value); setWeightError(false); }}
            onBlur={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) setUnloadedWeight(v.toFixed(2));
            }}
            inputProps={{ step: "0.01", min: "0" }}
            placeholder="น้ำหนักรถเปล่า"
            error={weightError}
            helperText={weightError ? "กรุณาระบุน้ำหนัก" : ""}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
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
            disabled={saving}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </Box>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)}>
        <DialogTitle>ยืนยันการบันทึก</DialogTitle>
        <DialogContent>
          <DialogContentText>ต้องการบันทึกข้อมูลชั่งรถเปล่าหรือไม่</DialogContentText>
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