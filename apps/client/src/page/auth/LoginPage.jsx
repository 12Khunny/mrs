import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Milk } from "lucide-react";

import { login as loginApi } from "@/core/api/authApi";
import { ApiError } from "@mrs/shared-api";
import { useAuth } from "@/providers/authContext";
import { useToast } from "@/providers/toastContext";
import { Button, Input, Label, Card, CardContent } from "@mrs/ui";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!navigator.onLine) {
      showToast("ไม่มีอินเทอร์เน็ต: ต้องเชื่อมต่อเพื่อเข้าสู่ระบบ", "warning");
      return;
    }

    if (!username.trim() || !password.trim()) {
      showToast("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi({ username, password });

      const userObj = data.user || {};

      login({
        token: data.access_token ?? data.token ?? null,
        refreshToken: data.refresh_token ?? data.refreshToken ?? null,
        username: data.username ?? userObj.username ?? username ?? "",
        name: data.name ?? userObj.name ?? "",
        userType: data.user_type ?? data.userType ?? userObj.userType ?? null,
        coop: data.coop_list ?? data.coop ?? userObj.coop ?? [],
      });

      showToast("เข้าสู่ระบบสำเร็จ", "success");
      navigate("/truckWeighing/Auto", { replace: true });
    } catch (err) {
      if (!navigator.onLine) {
        showToast("เชื่อมต่อไม่ได้: กรุณาตรวจสอบอินเทอร์เน็ต", "warning");
        return;
      }

      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 401) {
          showToast("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", "error");
          return;
        }
      }

      showToast("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-muted] px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Card */}
        <Card className="shadow-md">
          <CardContent className="pt-10 px-10 pb-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Logo + Title */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[--color-primary] shadow-lg">
                  <Milk className="w-8 h-8 text-black" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-[--color-foreground]">
                    MRS
                  </h1>
                  <h3 className="text-lg font-bold tracking-tight text-[--color-foreground]">
                    RFID&Milk Receiving System
                  </h3>
                  <p className="text-sm text-[--color-muted-foreground] mt-1.5">
                    ระบบรับน้ำนมและระบุตัวตนรถบรรทุกด้วย RFID สำหรับ MSC
                  </p>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username">ชื่อผู้ใช้งาน</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="px-4 pr-10"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่าน"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="px-4 pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[--color-muted-foreground] hover:text-[--color-foreground] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                variant="outline"
                type="submit"
                className="w-full mt-2"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[--color-muted-foreground]">
          MILK SUPPLY CHAIN · MRS v1.0
        </p>
      </div>
    </div>
  );
}

