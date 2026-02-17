import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "mrs_auth_v1";

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [name, setNameState] = useState("");
  const [userType, setUserTypeState] = useState(null);
  const [coop, setCoopState] = useState([]);

  // ✅ hydrate จาก localStorage ตอนเปิดแอพ/รีเฟรช
  useEffect(() => {
    const saved = readStorage();
    if (saved?.token) setTokenState(saved.token);
    if (saved?.refreshToken) setRefreshTokenState(saved.refreshToken);
    if (saved?.name) setNameState(saved.name);
    if (saved?.userType != null) setUserTypeState(saved.userType);
    if (Array.isArray(saved?.coop)) setCoopState(saved.coop);
  }, []);

  // ✅ helper: update + persist
  const setToken = (v) => {
    setTokenState(v);
    const cur = readStorage() || {};
    writeStorage({ ...cur, token: v });
  };

  const setRefreshToken = (v) => {
    setRefreshTokenState(v);
    const cur = readStorage() || {};
    writeStorage({ ...cur, refreshToken: v });
  };

  const setName = (v) => {
    setNameState(v);
    const cur = readStorage() || {};
    writeStorage({ ...cur, name: v });
  };

  const setUserType = (v) => {
    setUserTypeState(v);
    const cur = readStorage() || {};
    writeStorage({ ...cur, userType: v });
  };

  const setCoop = (v) => {
    setCoopState(v);
    const cur = readStorage() || {};
    writeStorage({ ...cur, coop: v });
  };

  const logout = () => {
    setTokenState(null);
    setRefreshTokenState(null);
    setNameState("");
    setUserTypeState(null);
    setCoopState([]);
    clearStorage();
  };

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

export const useAuth = () => useContext(AuthContext);
