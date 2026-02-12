import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider, { useAuth } from "./providers/authProvider";
import LoginPage from "./pages/auth/Login";
import Navbar from "./components/Navbar";

function ProtectedLayout({ children }) {
  const { token } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />   {/* ⭐ Navbar อยู่ตรงนี้ */}
      {children}
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

          {/* ทุกหน้าหลัง login จะมี navbar */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Home />
              </ProtectedLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
