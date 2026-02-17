// mrs-app/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AuthProvider, { useAuth } from "./providers/authProvider";

import LoginPage from "./pages/auth/Login";
import Navbar from "./components/Navbar";

import TruckWeighingAuto from "./pages/truckWeighing/Auto";
import TruckWeighingManual from "./pages/truckWeighing/Manual";
import TruckWeighingLoaded from "./pages/truckWeighing/Loaded";
import TruckWeighingUnloaded from "./pages/truckWeighing/Unloaded";

function ProtectedLayout() {
  const { token } = useAuth();

  // ✅ Online only ตาม requirement ใหม่
  if (!navigator.onLine) return <Navigate to="/login" replace />;
  if (!token) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function Home() {
  return <div style={{ padding: 16 }}>หน้าแรก</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login ไม่โชว์ Navbar */}
          <Route path="/login" element={<LoginPage />} />

          {/* หลัง login */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Home />} />

            {/* เมนูหลัก */}
            <Route path="/truckWeighing/Auto" element={<TruckWeighingAuto />} />
            <Route path="/truckWeighing/Manual" element={<TruckWeighingManual />} />

            {/* ✅ แยก 2 หน้า loaded / unloaded */}
            <Route path="/truckWeighing/Loaded" element={<TruckWeighingLoaded />} />
            <Route path="/truckWeighing/Unloaded/:id" element={<TruckWeighingUnloaded />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
