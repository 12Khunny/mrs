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

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { username, name, logout } = useAuth(); // ✅ เพิ่ม username
  const { showToast } = useToast();

  const currentTab = React.useMemo(() => {
    const p = location.pathname;
    const best = routes
      .map((r, idx) => ({ ...r, idx }))
      .filter((r) => p === r.path || p.startsWith(r.path + "/"))
      .sort((a, b) => b.path.length - a.path.length)[0];

    return best ? best.idx : 0; // ✅ default
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
                  <Typography variant="h8" sx={{ opacity: 1 }}>
                    {username || "-"}
                  </Typography>
                  {/* <Typography variant="body2" sx={{ opacity: 1 }}>
                    {name || "-"}
                  </Typography> */}
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