import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

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

    if (saved?.username) setUsernameState(saved.username);
    if (saved?.name) setNameState(saved.name);

    if (saved?.userType != null) setUserTypeState(saved.userType);
    if (Array.isArray(saved?.coop)) setCoopState(saved.coop);

    setIsReady(true);
  }, []);

  const patchStorage = useCallback((patch) => {
    const cur = readStorage() || {};
    writeStorage({ ...cur, ...patch });
  }, []);

  const setToken = useCallback((v) => {
    setTokenState(v);
    patchStorage({ token: v });
  }, [patchStorage]);

  const setRefreshToken = useCallback((v) => {
    setRefreshTokenState(v);
  }, []);

  const setUsername = useCallback((v) => {
    setUsernameState(v);
    patchStorage({ username: v });
  }, [patchStorage]);

  const setName = useCallback((v) => {
    setNameState(v);
    patchStorage({ name: v });
  }, [patchStorage]);

  const setUserType = useCallback((v) => {
    setUserTypeState(v);
    patchStorage({ userType: v });
  }, [patchStorage]);

  const setCoop = useCallback((v) => {
    setCoopState(v);
    patchStorage({ coop: v });
  }, [patchStorage]);

  const login = useCallback(({ token, refreshToken, username, name, userType, coop }) => {
    setTokenState(token ?? null);
    setRefreshTokenState(refreshToken ?? null);
    setUsernameState(username ?? "");
    setNameState(name ?? "");
    setUserTypeState(userType ?? null);
    setCoopState(Array.isArray(coop) ? coop : []);

    writeStorage({
      token: token ?? null,
      username: username ?? "",
      name: name ?? "",
      userType: userType ?? null,
      coop: Array.isArray(coop) ? coop : [],
    });
  }, []);

  const logout = useCallback(() => {
    setTokenState(null);
    setRefreshTokenState(null);
    setUsernameState("");
    setNameState("");
    setUserTypeState(null);
    setCoopState([]);
    clearStorage();
  }, []);

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
    [isReady, token, refreshToken, username, name, userType, coop, setToken, setRefreshToken, setUsername, setName, setUserType, setCoop, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);