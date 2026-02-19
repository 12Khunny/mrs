import { useMemo, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { ToastContext } from "./toastContext";

export function ToastProvider({ children }) {
  const showToast = useCallback((message, variant = "default") => {
    switch (variant) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "warning":
        toast.warning(message);
        break;
      default:
        toast(message);
        break;
    }
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster richColors closeButton position="top-center" />
    </ToastContext.Provider>
  );
}
