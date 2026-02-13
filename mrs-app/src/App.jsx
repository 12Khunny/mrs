import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AuthProvider, { useAuth } from "./providers/authProvider";
import LoginPage from "./pages/auth/Login";
import Navbar from "./components/Navbar";
import TruckWeighingManual from "./pages/truckWeighing/Manual";

function ProtectedLayout() {
  const { token } = useAuth();

  // ✅ ออนไลน์เท่านั้น
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
          {/* หน้า login ไม่มี navbar */}
          <Route path="/login" element={<LoginPage />} />

          {/* ทุกหน้าหลัง login */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Home />} />

            {/* ✅ path แบบเว็บหลัก */}
            <Route
              path="/truck-weighing/manual"
              element={<TruckWeighingManual />}
            />
          </Route>

          {/* กันพิมพ์ path แปลกๆ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
