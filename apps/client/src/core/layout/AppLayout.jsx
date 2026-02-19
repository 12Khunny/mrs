import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/authContext";
import { useToast } from "@/providers/toastContext";
import { Button } from "@mrs/ui";
import { CircleUserRound, LogOut, User } from "lucide-react";

export default function AppLayout({ children }) {
  const { name, username, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    <div className="min-h-screen bg-[--color-background]">
      <header className="border-b border-[--color-border] bg-[--color-card] px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-[--color-foreground]">MRS</span>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[--color-foreground] hidden sm:inline-flex items-center gap-1">
            {/* <User className="w-4 h-4" /> */}
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
                sideOffset={15}
                className="z-40 min-w-[180px] rounded-md border border-[--color-border] bg-[--color-card] p-3 shadow-md"
              >
                <DropdownMenu.Item
                  disabled
                  className="select-none rounded-sm px-2 py-1.5 text-sm font-semibold text-[--color-muted-foreground] opacity-100"
                >
                  {username || "-"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-[--color-border]" />
                <DropdownMenu.Item
                  onSelect={openLogoutDialog}
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-[--color-foreground] outline-none hover:bg-[--color-muted] focus:bg-[--color-muted]"
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
          <div className="relative w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-card] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[--color-destructive]/10 text-[--color-destructive]">
                <LogOut className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[--color-foreground]">ยืนยันการออกจากระบบ</h2>
                <p className="text-sm text-[--color-muted-foreground]">
                  คุณต้องการออกจากระบบใช่หรือไม่
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} className="px-6">
                ยกเลิก
              </Button>
              <Button variant="outline" onClick={handleConfirmLogout} className="px-6">
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
