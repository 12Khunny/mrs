import React, { createContext, useContext, useMemo, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  const showToast = (message, severity = "success") => {
    setState({ open: true, message, severity });
  };

  const close = () => setState((s) => ({ ...s, open: false }));

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <Snackbar
        open={state.open}
        autoHideDuration={1500}
        onClose={close}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={close} severity={state.severity} variant="filled" sx={{ width: "100%" }}>
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
