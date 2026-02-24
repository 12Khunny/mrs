import { useEffect, useMemo, useState, useCallback } from "react";
import { AuthContext } from "./authContext";
import api from "@/services/api";

export default function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [authState, setAuthState] = useState({
    token: null,
    refreshToken: null,
    username: "",
    name: "",
    userType: null,
    coop: [],
  });

  useEffect(() => {
    const loadMe = async () => {
      try {
        const me = await api.get("/auth/me");
        if (typeof window !== "undefined" && me?.access_token) {
          window.__MRS_ACCESS_TOKEN = me.access_token;
        }
        setAuthState((prev) => ({
          ...prev,
          token: "cookie",
          username: me?.username ?? me?.user?.username ?? prev.username ?? "",
          name: me?.name ?? me?.user?.name ?? prev.name ?? "",
          userType: me?.user_type ?? me?.userType ?? prev.userType ?? null,
          coop: Array.isArray(me?.coop_list ?? me?.coop)
            ? (me?.coop_list ?? me?.coop)
            : prev.coop ?? [],
        }));
      } catch {
        setAuthState((prev) => ({ ...prev, token: null }));
      } finally {
        setIsReady(true);
      }
    };

    loadMe();
  }, []);

  const login = useCallback(({ token, refreshToken, username, name, userType, coop }) => {
    if (typeof window !== "undefined") {
      if (token && token !== "cookie") {
        window.__MRS_ACCESS_TOKEN = token;
      } else {
        delete window.__MRS_ACCESS_TOKEN;
      }
    }

    const nextState = {
      token: token ?? null,
      refreshToken: refreshToken ?? null,
      username: username ?? "",
      name: name ?? "",
      userType: userType ?? null,
      coop: Array.isArray(coop) ? coop : [],
    };

    setAuthState(nextState);
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      delete window.__MRS_ACCESS_TOKEN;
    }

    setAuthState({
      token: null,
      refreshToken: null,
      username: "",
      name: "",
      userType: null,
      coop: [],
    });
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      ...authState,
      login,
      logout,
    }),
    [isReady, authState, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
