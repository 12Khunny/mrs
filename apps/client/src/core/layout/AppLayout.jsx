import { useMemo, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/authContext";
import { useToast } from "@/providers/toastContext";
import { Button } from "@mrs/ui";
import { CircleUserRound, LogOut, User } from "lucide-react";

const routes = [
  { label: "บันทึกการชั่งน้ำหนัก", path: "/truckWeighing/Auto" },
  { label: "บันทึกการชั่งน้ำหนักแบบ Manual", path: "/truckWeighing/Manual" },
];

const pathToTab = [
  { prefix: "/truckWeighing/Auto", tab: 0 },
  { prefix: "/truckWeighing/Manual", tab: 1 },
  { prefix: "/truckWeighing/Loaded", tab: 1 },
  { prefix: "/truckWeighing/Unloaded", tab: 1 },
];

export default function AppLayout({ children }) {
  const { name, username, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentTab = useMemo(() => {
    const p = location.pathname;
    const best = pathToTab
      .filter((r) => p === r.prefix || p.startsWith(r.prefix + "/") || p.startsWith(r.prefix))
      .sort((a, b) => b.prefix.length - a.prefix.length)[0];
    return best ? best.tab : 0;
  }, [location.pathname]);

  const openLogoutDialog = () => {
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    setConfirmOpen(false);
    logout();
    showToast("ออกจากระบบแล้ว", "success");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 h-14 flex items-center gap-4">
        <span className="font-semibold text-[var(--color-foreground)] tracking-wide">MRS</span>

        <nav className="flex-1">
          <div className="flex items-center gap-1">
            {routes.map((route, index) => {
              const isActive = currentTab === index;
              return (
                <Button
                  key={route.path}
                  variant="ghost"
                  onClick={() => navigate(route.path)}
                  className={`h-9 px-3 text-sm ${
                    isActive
                      ? "text-[color:var(--color-primary)]"
                      : "text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
                  }`}
                >
                  {route.label}
                </Button>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-foreground)] hidden sm:inline-flex items-center gap-1">
            <User className="w-4 h-4" />
            {name || username || "-"}
          </span>

          <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="เปิดเมนูผู้ใช้งาน"
                className="rounded-full"
              >
                <CircleUserRound className="w-6 h-6" />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={12}
                className="z-40 min-w-[180px] rounded-md border border-[var(--color-border)] bg-[color:var(--color-card)] p-3 shadow-md"
              >
                <DropdownMenu.Item
                  disabled
                  className="select-none rounded-sm px-2 py-1.5 text-sm font-semibold text-[var(--color-foreground)] opacity-100"
                >
                  {username || "-"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border)]" />
                <DropdownMenu.Item
                  onSelect={openLogoutDialog}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[var(--color-foreground)] outline-none hover:bg-[var(--color-muted)] focus:bg-[var(--color-muted)]"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      <main>{children}</main>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-[2px] px-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-destructive)]/10 text-[var(--color-destructive)]">
                <LogOut className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)]">ยืนยันการออกจากระบบ</h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  คุณต้องการออกจากระบบใช่หรือไม่
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} className="px-6">
                ยกเลิก
              </Button>
              <Button
                variant="outline"
                onClick={handleConfirmLogout}
                className="px-6 text-[var(--color-destructive-foreground)]"
              >
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


