import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../providers/authProvider";
import { useToast } from "../providers/toastProvider";

const routes = [
  { label: "บันทึกการชั่งน้ำหนัก", path: "/truckWeighing/Auto" },
  { label: "บันทึกการชั่งน้ำหนักแบบ Manual", path: "/truckWeighing/Manual" },
];

// ✅ path ที่เป็น sub-flow ของแต่ละ tab
// key = prefix ของ path, value = tab index
const pathToTab = [
  { prefix: "/truckWeighing/Auto", tab: 0 },
  { prefix: "/truckWeighing/Manual", tab: 1 },
  { prefix: "/truckWeighing/Loaded", tab: 1 },   // ✅ Loaded อยู่ใน flow ของ Manual
  { prefix: "/truckWeighing/Unloaded", tab: 1 }, // ✅ Unloaded อยู่ใน flow ของ Manual
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { username, name, logout } = useAuth();
  const { showToast } = useToast();

  const currentTab = React.useMemo(() => {
    const p = location.pathname;
    const best = pathToTab
      .filter((r) => p === r.prefix || p.startsWith(r.prefix + "/") || p.startsWith(r.prefix))
      .sort((a, b) => b.prefix.length - a.prefix.length)[0];
    return best ? best.tab : 0;
  }, [location.pathname]);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleClickLogout = () => {
    closeMenu();
    setConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    setConfirmOpen(false);
    logout();
    showToast?.("ออกจากระบบแล้ว", "info");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          {/* LEFT */}
          <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.4 }}>
              MRS
            </Typography>
          </Box>

          {/* CENTER */}
          <Tabs
            value={currentTab}
            onChange={(_, val) => navigate(routes[val].path)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ flexGrow: 1, minHeight: 48 }}
          >
            {routes.map((r) => (
              <Tab key={r.path} label={r.label} sx={{ minHeight: 48 }} />
            ))}
          </Tabs>

          {/* RIGHT */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {name || "-"}
            </Typography>

            <IconButton color="inherit" onClick={openMenu}>
              <AccountCircleIcon />
            </IconButton>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
              <MenuItem disabled sx={{ fontWeight: 800, letterSpacing: 0.4 }}>
                <Box sx={{ lineHeight: 2 }}>
                  <Typography variant="body1" sx={{ opacity: 1, fontWeight: 700 }}>
                    {username || "-"}
                  </Typography>
                </Box>
              </MenuItem>

              <MenuItem onClick={handleClickLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>ยืนยันการออกจากระบบ</DialogTitle>
        <DialogContent>
          <DialogContentText>คุณต้องการออกจากระบบใช่หรือไม่?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>ยกเลิก</Button>
          <Button variant="contained" color="error" onClick={handleConfirmLogout}>
            ออกจากระบบ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}