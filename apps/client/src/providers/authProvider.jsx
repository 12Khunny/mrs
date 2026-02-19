import { useMemo, useState, useCallback } from "react";
import { AuthContext } from "./authContext";

const STORAGE_KEY = "mrs_auth_v1";

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    // Ignore malformed local storage data.
    return null;
  }
}

function writeStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota/privacy-mode errors.
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage removal errors.
  }
}

function getInitialAuthState() {
  const saved = readStorage() || {};
  return {
    token: saved.token ?? null,
    refreshToken: saved.refreshToken ?? null,
    username: saved.username ?? "",
    name: saved.name ?? "",
    userType: saved.userType ?? null,
    coop: Array.isArray(saved.coop) ? saved.coop : [],
  };
}

export default function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState);

  const patchStorage = useCallback((patch) => {
    const current = readStorage() || {};
    writeStorage({ ...current, ...patch });
  }, []);

  const setToken = useCallback((value) => {
    setAuthState((prev) => ({ ...prev, token: value }));
    patchStorage({ token: value });
  }, [patchStorage]);

  const setRefreshToken = useCallback((value) => {
    setAuthState((prev) => ({ ...prev, refreshToken: value }));
    patchStorage({ refreshToken: value });
  }, [patchStorage]);

  const setUsername = useCallback((value) => {
    setAuthState((prev) => ({ ...prev, username: value }));
    patchStorage({ username: value });
  }, [patchStorage]);

  const setName = useCallback((value) => {
    setAuthState((prev) => ({ ...prev, name: value }));
    patchStorage({ name: value });
  }, [patchStorage]);

  const setUserType = useCallback((value) => {
    setAuthState((prev) => ({ ...prev, userType: value }));
    patchStorage({ userType: value });
  }, [patchStorage]);

  const setCoop = useCallback((value) => {
    const nextCoop = Array.isArray(value) ? value : [];
    setAuthState((prev) => ({ ...prev, coop: nextCoop }));
    patchStorage({ coop: nextCoop });
  }, [patchStorage]);

  const login = useCallback(({ token, refreshToken, username, name, userType, coop }) => {
    const nextState = {
      token: token ?? null,
      refreshToken: refreshToken ?? null,
      username: username ?? "",
      name: name ?? "",
      userType: userType ?? null,
      coop: Array.isArray(coop) ? coop : [],
    };

    setAuthState(nextState);
    writeStorage(nextState);
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      token: null,
      refreshToken: null,
      username: "",
      name: "",
      userType: null,
      coop: [],
    });
    clearStorage();
  }, []);

  const value = useMemo(
    () => ({
      isReady: true,
      ...authState,
      setToken,
      setRefreshToken,
      setUsername,
      setName,
      setUserType,
      setCoop,
      login,
      logout,
    }),
    [authState, setToken, setRefreshToken, setUsername, setName, setUserType, setCoop, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
