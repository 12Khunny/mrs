import { useAuth } from "@/providers/authProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@mrs/ui";
import { LogOut, User } from "lucide-react";

export default function AppLayout({ children }) {
  const { name, username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[--color-background]">
      <header className="border-b border-[--color-border] bg-[--color-card] px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-[--color-foreground]">MRS</span>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[--color-muted-foreground] flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {name || username}
          </span>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
