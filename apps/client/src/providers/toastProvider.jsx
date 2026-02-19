import { createContext, useContext, useState, useCallback } from "react";
import {
  ToastProvider as RadixToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastClose,
} from "@mrs/ui";


const ToastContext = createContext(null);

const variantStyles = {
  default: "border-l-3 border-primary bg-background",
  success: "border-l-3 border-green-500 bg-green-50 text-green-800",
  error: "border-l-3 border-red-500 bg-red-50 text-red-800",
  warning: "border-l-3 border-yellow-500 bg-yellow-50 text-yellow-800",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, variant = "default") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <RadixToastProvider swipeDirection="up" duration={3000}>
        {children}

        {toasts.map((t) => (
          <Toast
            key={t.id}
            open={true}
            className={`
              relative w-[350px] rounded-md px-4 py-3 shadow-lg
              ${variantStyles[t.variant] || variantStyles.default}
            `}
          >
            <div className="flex justify-between items-start gap-4">
              <ToastTitle className="text-sm font-medium">
                {t.message}
              </ToastTitle>
              <ToastClose className="opacity-70 hover:opacity-100" />
            </div>
          </Toast>
        ))}

        <ToastViewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-50" />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
