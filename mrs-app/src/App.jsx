import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./providers/authProvider";

import LoginPage from "./pages/auth/Login";
import Navbar from "./components/Navbar";

import TruckWeighingAuto from "./pages/truckWeighing/Auto";
import TruckWeighingManual from "./pages/truckWeighing/Manual";
import TruckWeighingLoaded from "./pages/truckWeighing/Loaded";
import TruckWeighingUnloaded from "./pages/truckWeighing/Unloaded";

function ProtectedLayout() {
  const { isReady, token } = useAuth();

  if (!isReady) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/truckWeighing/Auto" element={<TruckWeighingAuto />} />
          <Route path="/truckWeighing/Manual" element={<TruckWeighingManual />} />
          <Route path="/truckWeighing/Loaded" element={<TruckWeighingLoaded />} />
          <Route path="/truckWeighing/Unloaded/:id" element={<TruckWeighingUnloaded />} />
        </Route>

        <Route path="*" element={<Navigate to="/truckWeighing/Auto" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
