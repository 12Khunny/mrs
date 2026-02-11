import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  // State to hold the authentication token
  const [token, setToken_] = useState(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken_] = useState(localStorage.getItem("refreshToken"));
  const [name, setName_] = useState(localStorage.getItem("name"));
  const [userType, setUserType_] = useState(localStorage.getItem("userType"));
  const [coop, setCoop_] = useState(localStorage.getItem("coop-msc-milk-supply-chain"))
  // Function to set the authentication token
  const setToken = (newToken) => {
    setToken_(newToken);
  };

  const setRefreshToken = (newRefreshToken) => {
    setRefreshToken_(newRefreshToken);
  };

  const setName = (newname) => {
    setName_(newname);
  };

  const setUserType = (newUserType) => {
    setUserType_(newUserType);
  };

  const setCoop = (newCoop) => {
    const coopToString = JSON.stringify(newCoop);
    setCoop_(coopToString);
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('name', name);
      localStorage.setItem('userType', userType);
      localStorage.setItem('coop-msc-milk-supply-chain', coop);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("name");
      localStorage.removeItem("userType");
      localStorage.removeItem("coop-msc-milk-supply-chain");
    }
  }, [refreshToken, token, name, userType, coop]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      setToken,
      setRefreshToken,
      setName,
      setUserType,
      setCoop,
      userType,
      name,
      coop,
    }),
    [name, token, userType, coop]
  );

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};

export default AuthProvider;