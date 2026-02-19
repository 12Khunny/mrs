import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/authProvider";

export default function RequireAuth({ children }) {
  const { isReady, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !token) {
      navigate("/login", { replace: true });
    }
  }, [isReady, token, navigate]);

  if (!isReady || !token) return null;

  return children;
}
