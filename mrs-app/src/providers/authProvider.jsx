import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));
  const [name, setName] = useState(localStorage.getItem("name"));
  const [userType, setUserType] = useState(localStorage.getItem("userType"));
  const [coop, setCoopState] = useState(localStorage.getItem("coop-msc-milk-supply-chain") || "[]");
  const apiUrl = import.meta.env.VITE_API_URL;

  const setCoop = (coopList) => setCoopState(JSON.stringify(coopList ?? []));

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setName(null);
    setUserType(null);
    setCoopState("[]");
    localStorage.clear();
  };

  // persist
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken ?? "");
      localStorage.setItem("name", name ?? "");
      localStorage.setItem("userType", userType ?? "");
      localStorage.setItem("coop-msc-milk-supply-chain", coop ?? "[]");
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("name");
      localStorage.removeItem("userType");
      localStorage.removeItem("coop-msc-milk-supply-chain");
    }
  }, [token, refreshToken, name, userType, coop]);

  useEffect(() => {
    const handleOffline = () => logout();
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, []);

  // (แนะนำ) ถ้ามี token ให้ ping เว็บหลักซัก endpoint เพื่อยืนยันว่าใช้งานได้จริง
  useEffect(() => {
    const checkSession = async () => {
      if (!token) return;
      if (!navigator.onLine) {
        Swal.fire({
          icon: "warning",
          title: "ไม่มีอินเทอร์เน็ต",
          text: "ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อเข้าสู่ระบบ",
          confirmButtonText: "ตกลง",
        });
        return;
      }

      try {
        await axios.get(`${apiUrl}/authen/me`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        });
      } catch {
        // token หมดอายุ/ติดต่อไม่ได้ -> กลับไป login
        logout();
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      name,
      userType,
      coop,
      setToken,
      setRefreshToken,
      setName,
      setUserType,
      setCoop,
      logout,
    }),
    [token, refreshToken, name, userType, coop]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
