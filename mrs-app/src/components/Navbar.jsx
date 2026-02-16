import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  IconButton,
  Avatar,
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
  { label: "บันทึกการชั่งน้ำหนักแบบ Manual", path: "/truckWeighing/Manual/Record" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, logout } = useAuth();
  const { showToast } = useToast();

  const currentTab = React.useMemo(() => {
    const p = location.pathname;

    const best = routes
      .map((r, idx) => ({ ...r, idx }))
      .filter((r) => p === r.path || p.startsWith(r.path + "/"))
      .sort((a, b) => b.path.length - a.path.length)[0];

    return best ? best.idx : false;
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
    showToast("ออกจากระบบแล้ว", "info");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          {/* LEFT */}
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, cursor: "default", whiteSpace: "nowrap", userSelect: "none" }}
          >
            MRS
          </Typography>

          {/* CENTER */}
          <Tabs
            value={currentTab}
            onChange={(e, val) => navigate(routes[val].path)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ flexGrow: 1, minHeight: 48 }}
          >
            {routes.map((r) => (
              <Tab
                key={r.path}
                label={r.label}
                sx={{ minHeight: 48, textTransform: "none" }}
              />
            ))}
          </Tabs>

          {/* RIGHT */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={name || "User"}
            >
              {name || "User"}
            </Typography>

            <IconButton onClick={openMenu} size="small" aria-label="user menu">
              <Avatar sx={{ width: 34, height: 34 }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleClickLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ✅ Confirm Logout Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>ยืนยันการออกจากระบบ</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณต้องการออกจากระบบใช่หรือไม่?
          </DialogContentText>
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
