import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { useToast } from "@/providers/toastContext";
import { Button, Card, CardContent, Input, Label } from "@mrs/ui";

function toISODate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toCurrentTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalDateTime(dateValue, timeValue) {
  return `${dateValue}T${timeValue}:00`;
}

function stripThousands(value) {
  return String(value ?? "").replace(/,/g, "");
}

function formatThousandsInput(value) {
  const raw = stripThousands(value);
  if (raw === "") return "";
  const hasDot = raw.includes(".");
  const [intPart, decPart = ""] = raw.split(".");
  const intFormatted = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (hasDot) return `${intFormatted}.${decPart}`;
  return intFormatted;
}

function isValidWeightInput(value) {
  return /^\d*\.?\d{0,2}$/.test(value);
}

function extractDate(value) {
  if (!value || typeof value !== "string") return "";
  const idx = value.indexOf("T");
  return idx > 0 ? value.slice(0, idx) : value.slice(0, 10);
}

function extractTime(value) {
  if (!value || typeof value !== "string") return "";
  const idx = value.indexOf("T");
  const part = idx >= 0 ? value.slice(idx + 1) : value;
  return part.slice(0, 5);
}

function formatDisplayDate(dateTimeText, dateTimeRaw) {
  if (dateTimeText) return dateTimeText;
  const datePart = extractDate(dateTimeRaw);
  if (!datePart) return "-";
  const dt = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return datePart;
  return dt.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDisplayTime(dateTimeRaw) {
  const timePart = extractTime(dateTimeRaw);
  return timePart || "-";
}

function formatWeight(value) {
  if (value == null || value === "") return "-";
  const parsed = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(parsed)) return String(value);
  return parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function UnloadedPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const truck = location.state?.truck;

  const [loadingTransaction, setLoadingTransaction] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [unloadedDate, setUnloadedDate] = useState(toISODate());
  const [unloadedTime, setUnloadedTime] = useState(toCurrentTime());
  const [unloadedWeight, setUnloadedWeight] = useState("");
  const [driverName, setDriverName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchTransaction = async () => {
      if (!id) {
        setLoadingTransaction(false);
        return;
      }
      setLoadingTransaction(true);
      try {
        const data = await api.get(`/unloadedTruck/unloadedTruckDetail/${id}`);
        if (cancelled) return;
        const content = data?.content ?? data?.detail ?? data ?? null;
        setTransaction(content);
        if (content?.driver_name) {
          setDriverName(content.driver_name);
        }
      } catch {
        if (cancelled) return;
        showToast("โหลดข้อมูล Transaction ไม่สำเร็จ", "error");
      } finally {
        if (!cancelled) {
          setLoadingTransaction(false);
        }
      }
    };

    fetchTransaction();
    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  const validate = useMemo(
    () => () => {
      if (!unloadedDate || !unloadedTime) {
        showToast("กรุณาระบุวันที่และเวลา", "warning");
        return false;
      }
      if (!unloadedWeight || Number.isNaN(parseFloat(stripThousands(unloadedWeight)))) {
        showToast("กรุณาระบุน้ำหนัก", "warning");
        return false;
      }
      return true;
    },
    [unloadedDate, unloadedTime, unloadedWeight, showToast]
  );

  const onSubmit = () => {
    if (validate()) setConfirmOpen(true);
  };

  const onConfirmSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const payload = {
        id: Number(id),
        driver_name: driverName,
        truck_unloaded_date_time: toLocalDateTime(unloadedDate, unloadedTime),
        truck_unloaded_weight: parseFloat(stripThousands(unloadedWeight)).toFixed(2),
      };

      await api.post("/unloadedTruck/save", payload);
      showToast("บันทึกชั่งออกสำเร็จ", "success");
      navigate("/truckWeighing/Manual", { replace: true });
    } catch {
      showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-6">
      <Card className="shadow-sm">
        <CardContent className="py-6 space-y-6">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">บันทึกการชั่งน้ำหนักรถเปล่า</h2>

          <div className="rounded-md border border-[var(--color-border)] bg-[color:var(--color-muted)]/40 p-3 text-sm">
            Transaction ID: <b>{id}</b>
            {transaction?.truck_license || truck?.truck_license ? (
              <>
                {" "}| ทะเบียน: <b>{transaction?.truck_license ?? truck?.truck_license}</b>
              </>
            ) : null}
          </div>

          {loadingTransaction ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">กำลังโหลดข้อมูล Transaction...</p>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>ทะเบียนรถ :</Label>
                  <Input
                    value={transaction?.truck_license ?? truck?.truck_license ?? "-"}
                    disabled
                    className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)] disabled:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>วันที่ชั่งน้ำหนัก :</Label>
                  <Input
                    value={formatDisplayDate(transaction?.truck_loaded_date_time_text, transaction?.truck_loaded_date_time)}
                    disabled
                    className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)] disabled:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>น้ำหนักรถพร้อมน้ำนม (กก.) :</Label>
                  <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-6 text-right text-4xl font-semibold text-[var(--color-foreground)]">
                    {formatWeight(transaction?.truck_loaded_weight)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>เจ้าของรถ :</Label>
                  <Input
                    value={transaction?.truck_owner_nickname ?? transaction?.truck_owner ?? truck?.owner ?? "-"}
                    disabled
                    className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)] disabled:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>เวลาที่ชั่งน้ำหนัก :</Label>
                  <Input
                    value={formatDisplayTime(transaction?.truck_loaded_date_time)}
                    disabled
                    className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)] disabled:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ชื่อ-นามสกุลคนขับรถ :</Label>
                  <Input
                    value={driverName} onChange={(e) => setDriverName(e.target.value)} 
                    placeholder="ชื่อ-นามสกุลคนขับรถ" disabled
                    className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)] disabled:opacity-100"/>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>วันที่ชั่งน้ำหนักรถเปล่า <span className="text-[var(--color-destructive)]">*</span></Label>
                  <Input type="date" value={unloadedDate} onChange={(e) => setUnloadedDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>เวลาที่ชั่งน้ำหนักรถเปล่า <span className="text-[var(--color-destructive)]">*</span></Label>
                  <Input type="time" value={unloadedTime} onChange={(e) => setUnloadedTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>น้ำหนักรถเปล่า (กก.) <span className="text-[var(--color-destructive)]">*</span></Label>
                  <Input
                    type="text"
                    value={unloadedWeight}
                    inputMode="decimal"
                    onChange={(e) => {
                      const raw = stripThousands(e.target.value);
                      if (raw === "" || isValidWeightInput(raw)) {
                        setUnloadedWeight(formatThousandsInput(raw));
                      }
                    }}
                    onFocus={() => {
                      setUnloadedWeight((prev) => stripThousands(prev));
                    }}
                    onBlur={() => {
                      if (unloadedWeight === "") return;
                      const num = Number(stripThousands(unloadedWeight));
                      if (!Number.isNaN(num)) {
                        setUnloadedWeight(formatWeight(num));
                      }
                    }}
                    placeholder="น้ำหนักรถเปล่า"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                  ยกเลิก
                </Button>
                <Button variant="default" className="text-white" onClick={onSubmit} disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold">ยืนยันการบันทึก</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">ต้องการบันทึกข้อมูลชั่งรถเปล่าหรือไม่</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
                ยกเลิก
              </Button>
              <Button variant="default" className="text-white" onClick={onConfirmSave} disabled={saving}>
                {saving ? "กำลังบันทึก..." : "ตกลง"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
