import { useMemo, useState } from "react";
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

export default function UnloadedPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const truck = location.state?.truck;

  const [unloadedDate, setUnloadedDate] = useState(toISODate());
  const [unloadedTime, setUnloadedTime] = useState(toCurrentTime());
  const [unloadedWeight, setUnloadedWeight] = useState("");
  const [driverName, setDriverName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const validate = useMemo(
    () => () => {
      if (!unloadedDate || !unloadedTime) {
        showToast("กรุณาระบุวันที่และเวลา", "warning");
        return false;
      }
      if (!unloadedWeight || isNaN(parseFloat(unloadedWeight))) {
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
      const [y, m, d] = unloadedDate.split("-");
      const [hh, mm] = unloadedTime.split(":");
      const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm));

      const payload = {
        id: Number(id),
        driver_name: driverName,
        truck_unloaded_date_time: dt.toISOString().slice(0, -5),
        truck_unloaded_weight: parseFloat(unloadedWeight).toFixed(2),
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
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            บันทึกการชั่งน้ำหนักรถเปล่า
          </h2>

          <div className="rounded-md border border-[var(--color-border)] bg-[color:var(--color-muted)]/40 p-3 text-sm">
            Transaction ID: <b>{id}</b>
            {truck?.truck_license && (
              <>
                {" "}
                | ทะเบียน: <b>{truck.truck_license}</b>
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>วันที่ชั่งน้ำหนัก *</Label>
              <Input type="date" value={unloadedDate} onChange={(e) => setUnloadedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>เวลาชั่งน้ำหนัก *</Label>
              <Input type="time" value={unloadedTime} onChange={(e) => setUnloadedTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>ชื่อ-นามสกุลคนขับรถ</Label>
              <Input
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="ชื่อ-นามสกุลคนขับรถ"
              />
            </div>
          </div>

          <div className="max-w-sm space-y-2">
            <Label>น้ำหนักรถเปล่า (กก.) *</Label>
            <Input
              type="number"
              value={unloadedWeight}
              onChange={(e) => setUnloadedWeight(e.target.value)}
              placeholder="น้ำหนักรถเปล่า"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
              ยกเลิก
            </Button>
            <Button variant="default" onClick={onSubmit} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold">ยืนยันการบันทึก</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              ต้องการบันทึกข้อมูลชั่งรถเปล่าหรือไม่
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
                ยกเลิก
              </Button>
              <Button variant="default" onClick={onConfirmSave} disabled={saving}>
                {saving ? "กำลังบันทึก..." : "ตกลง"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


