import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AuthProvider, { useAuth } from "./providers/authProvider";
import LoginPage from "./pages/auth/Login";
import Navbar from "./components/Navbar";

import TruckWeighingAuto from "./pages/truckWeighing/Auto";
import TruckWeighingManual from "./pages/truckWeighing/Manual";

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

function Home() {
  return <div style={{ padding: 16 }}>หน้าแรก</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<TruckWeighingAuto />} />

            <Route
              path="/truckWeighing/Auto"
              element={<TruckWeighingAuto/>}
            />
            <Route
              path="/truckWeighing/Manual"
              element={<TruckWeighingManual/>}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
