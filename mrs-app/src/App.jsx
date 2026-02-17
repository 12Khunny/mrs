import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./providers/authProvider"; // ✅ ไม่ต้อง import AuthProvider แล้ว

import LoginPage from "./pages/auth/Login";
import Navbar from "./components/Navbar";

import TruckWeighingAuto from "./pages/truckWeighing/Auto";
import TruckWeighingManual from "./pages/truckWeighing/Manual";
import TruckWeighingLoaded from "./pages/truckWeighing/Loaded";
import TruckWeighingUnloaded from "./pages/truckWeighing/Unloaded";

function ProtectedLayout() {
  const { token } = useAuth();
  if (!navigator.onLine) return <Navigate to="/login" replace />;
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

        {/* ✅ ให้เข้า auto เป็น default */}
        <Route path="*" element={<Navigate to="/truckWeighing/Auto" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
