import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/authProvider";
import { useToast } from "../../providers/toastProvider";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { login } = useAuth();
  const { showToast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!navigator.onLine) {
      showToast("ไม่มีอินเทอร์เน็ต: ต้องเชื่อมต่อเพื่อเข้าสู่ระบบ", "warning");
      return;
    }

    try {
      const res = await axios.post(`${apiUrl}/authen/login`, {
        username,
        password,
      });

      const data = res.data || {};
      const token = data.access_token || data.token || null;

      const userObj = data.user || {};

      const savedUsername = data.username ?? userObj.username ?? username ?? "";
      const savedName = data.name ?? userObj.name ?? "";

      const savedUserType = data.userType ?? userObj.userType ?? null;
      const savedCoop = data.coop ?? userObj.coop ?? [];

      login({
        token,
        refreshToken: data.refresh_token ?? data.refreshToken ?? null,
        username: savedUsername,
        name: savedName,
        userType: savedUserType,
        coop: savedCoop,
      });

      showToast("เข้าสู่ระบบสำเร็จ", "success");
      navigate("/truckWeighing/Auto", { replace: true });
    } catch (err) {
      if (!navigator.onLine || err?.message === "Network Error") {
        showToast("เชื่อมต่อไม่ได้: กรุณาตรวจสอบอินเทอร์เน็ต", "warning");
        return;
      }

      const status = err?.response?.status;
      if (status === 400 || status === 401) {
        showToast("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", "error");
        return;
      }

      showToast("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่", "error");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper sx={{ p: 4, width: 350 }}>
        <Typography variant="h6" mb={2}>
          Login
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="contained" fullWidth sx={{ mt: 2 }} type="submit">
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
