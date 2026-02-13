import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [token, setToken_] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken_] = useState(localStorage.getItem("refreshToken"));
  const [name, setName_] = useState(localStorage.getItem("name"));
  const [userType, setUserType_] = useState(localStorage.getItem("userType"));
  const [coop, setCoop_] = useState(localStorage.getItem("coop-msc-milk-supply-chain"));

  const setToken = (v) => setToken_(v);
  const setRefreshToken = (v) => setRefreshToken_(v);
  const setName = (v) => setName_(v);
  const setUserType = (v) => setUserType_(v);

  const setCoop = (coopList) => {
    setCoop_(JSON.stringify(coopList ?? []));
  };

  const logout = () => {
    setToken_(null);
    setRefreshToken_(null);
    setName_(null);
    setUserType_(null);
    setCoop_(null);

    localStorage.clear();
  };

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
