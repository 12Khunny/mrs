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
  } catch {}
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

  const [token, setTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);

  const [username, setUsernameState] = useState("");
  const [name, setNameState] = useState("");

  const [userType, setUserTypeState] = useState(null);
  const [coop, setCoopState] = useState([]);

  useEffect(() => {
    const saved = readStorage();
    if (saved?.token) setTokenState(saved.token);
    if (saved?.refreshToken) setRefreshTokenState(saved.refreshToken);

    if (saved?.username) setUsernameState(saved.username);
    if (saved?.name) setNameState(saved.name);

    if (saved?.userType != null) setUserTypeState(saved.userType);
    if (Array.isArray(saved?.coop)) setCoopState(saved.coop);

    setIsReady(true);
  }, []);

  const patchStorage = (patch) => {
    const cur = readStorage() || {};
    writeStorage({ ...cur, ...patch });
  };

  const setToken = (v) => {
    setTokenState(v);
    patchStorage({ token: v });
  };

  const setRefreshToken = (v) => {
    setRefreshTokenState(v);
    patchStorage({ refreshToken: v });
  };

  const setUsername = (v) => {
    setUsernameState(v);
    patchStorage({ username: v });
  };

  const setName = (v) => {
    setNameState(v);
    patchStorage({ name: v });
  };

  const setUserType = (v) => {
    setUserTypeState(v);
    patchStorage({ userType: v });
  };

  const setCoop = (v) => {
    setCoopState(v);
    patchStorage({ coop: v });
  };

  const login = ({ token, refreshToken, username, name, userType, coop }) => {
    setTokenState(token ?? null);
    setRefreshTokenState(refreshToken ?? null);
    setUsernameState(username ?? "");
    setNameState(name ?? "");
    setUserTypeState(userType ?? null);
    setCoopState(Array.isArray(coop) ? coop : []);

    writeStorage({
      token: token ?? null,
      refreshToken: refreshToken ?? null,
      username: username ?? "",
      name: name ?? "",
      userType: userType ?? null,
      coop: Array.isArray(coop) ? coop : [],
    });
  };

  const logout = () => {
    setTokenState(null);
    setRefreshTokenState(null);
    setUsernameState("");
    setNameState("");
    setUserTypeState(null);
    setCoopState([]);
    clearStorage();
  };

  const value = useMemo(
    () => ({
      isReady,
      token,
      refreshToken,
      username,
      name,
      userType,
      coop,
      setToken,
      setRefreshToken,
      setUsername,
      setName,
      setUserType,
      setCoop,
      login,
      logout,
    }),
    [isReady, token, refreshToken, username, name, userType, coop]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
