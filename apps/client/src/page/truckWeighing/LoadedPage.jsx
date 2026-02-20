import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

export default function LoadedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const lockedTruck = location.state?.truck ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [truckList, setTruckList] = useState([]);
  const [coopList, setCoopList] = useState([]);
  const [checked, setChecked] = useState(false);

  const [selectedTruckId, setSelectedTruckId] = useState(
    lockedTruck?.truck_id ? String(lockedTruck.truck_id) : ""
  );
  const selectedTruck = useMemo(
    () =>
      truckList.find((t) => String(t?.truck_id) === String(selectedTruckId)) ||
      lockedTruck ||
      null,
    [truckList, selectedTruckId, lockedTruck]
  );

  const [driverName, setDriverName] = useState("");
  const [loadedDate, setLoadedDate] = useState(toISODate());
  const [loadedTime, setLoadedTime] = useState(toCurrentTime());
  const [loadedWeight, setLoadedWeight] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  const channelNumber = selectedTruck?.number_channel ?? 0;
  const ownerName = selectedTruck?.owner ?? "";

  const [milkCompartmentList, setMilkCompartmentList] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await api.get("/loadedTruck/loadedTruckDetail");
        setTruckList(data?.truck_list ?? []);
        setCoopList(data?.coop_list ?? []);
        if (data?.default_payment_calculate_type === 2) setChecked(true);
      } catch {
        showToast("โหลดข้อมูลไม่สำเร็จ", "error");
      } finally {
        setLoading(false);
      }
    };
    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    run();
  }, [showToast]);

  useEffect(() => {
    if (!channelNumber) {
      setMilkCompartmentList([]);
      return;
    }
    if (checked) {
      const channels = Array.from({ length: channelNumber }, (_, i) => i + 1);
      setMilkCompartmentList([{ channel: channels, coop: [] }]);
    } else {
      setMilkCompartmentList(
        Array.from({ length: channelNumber }, (_, i) => ({
          channel: i + 1,
          coop: [],
        }))
      );
    }
  }, [channelNumber, checked]);

  const handleCoopChange = (rowIndex, selectedIds) => {
    setMilkCompartmentList((prev) => {
      const next = [...prev];
      const ids = Array.isArray(selectedIds) ? selectedIds : [];
      const selected = coopList.filter((c) => ids.includes(String(c.coop_id)));
      next[rowIndex] = { ...next[rowIndex], coop: selected };
      return next;
    });
  };

  const validate = () => {
    if (!selectedTruck) {
      showToast("กรุณาเลือกทะเบียนรถ", "warning");
      return false;
    }
    if (!loadedDate || !loadedTime) {
      showToast("กรุณาระบุวันที่และเวลา", "warning");
      return false;
    }
    if (!loadedWeight || isNaN(parseFloat(loadedWeight))) {
      showToast("กรุณาระบุน้ำหนัก", "warning");
      return false;
    }
    const isCoopNull = milkCompartmentList.every((item) => item.coop.length === 0);
    if (isCoopNull) {
      showToast("กรุณาเลือกศูนย์/สหกรณ์ที่ส่งน้ำนม", "warning");
      return false;
    }
    return true;
  };

  const onSubmit = () => {
    if (validate()) setConfirmOpen(true);
  };

  const onConfirmSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      let finalList = milkCompartmentList;
      if (checked) {
        finalList = milkCompartmentList[0].channel.map((_, i) => ({
          channel: i + 1,
          coop: milkCompartmentList[0].coop,
        }));
      }

      const [y, m, d] = loadedDate.split("-");
      const [hh, mm] = loadedTime.split(":");
      const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm));

      const payload = {
        truck_id: selectedTruck.truck_id,
        driver_name: driverName,
        truck_loaded_date_time: dt.toISOString().slice(0, -5),
        truck_loaded_weight: parseFloat(loadedWeight).toFixed(2),
        truck_milk_channel_coop: finalList.map((item) => ({
          channel: item.channel,
          coop: item.coop.map((c) => ({ coop_id: c.coop_id })),
        })),
        calulate_type: checked ? 2 : 1,
      };

      await api.post("/loadedTruck/save", payload);
      showToast("บันทึกสำเร็จ", "success");
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
            บันทึกการชั่งน้ำหนักรถพร้อมน้ำนม
          </h2>

          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">กำลังโหลดข้อมูล...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>ทะเบียนรถ *</Label>
                  <Input value={selectedTruck?.truck_license ?? ""} disabled placeholder="ทะเบียนรถ" />
                </div>

                <div className="space-y-2">
                  <Label>เจ้าของรถ</Label>
                  <Input value={ownerName} disabled placeholder="เจ้าของรถ" />
                </div>

                <div className="space-y-2">
                  <Label>ชื่อ-นามสกุลคนขับรถ</Label>
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="ชื่อ-นามสกุลคนขับรถ"
                  />
                </div>

                <div className="space-y-2">
                  <Label>วันที่ชั่งน้ำหนัก *</Label>
                  <Input type="date" value={loadedDate} onChange={(e) => setLoadedDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>เวลาชั่งน้ำหนัก *</Label>
                  <Input type="time" value={loadedTime} onChange={(e) => setLoadedTime(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>น้ำหนักรถพร้อมน้ำนม (กก.) *</Label>
                  <Input
                    type="number"
                    value={loadedWeight}
                    inputMode="decimal"
                    step="0.01"
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === "" || /^\d*\.?\d{0,2}$/.test(next)) {
                        setLoadedWeight(next);
                      }
                    }}
                    onBlur={() => {
                      if (loadedWeight === "") return;
                      const num = Number(loadedWeight);
                      if (!Number.isNaN(num)) {
                        setLoadedWeight(num.toFixed(2));
                      }
                    }}
                    placeholder="น้ำหนักรถพร้อมน้ำนม"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="whole-truck"
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="whole-truck">ลงทั้งคัน</Label>
                </div>
              </div>

              {selectedTruck && milkCompartmentList.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                    บันทึกข้อมูลช่องน้ำนม
                  </h3>
                  {milkCompartmentList.map((row, idx) => (
                    <div key={idx} className="grid gap-3 md:grid-cols-2">
                      <div className="text-sm font-medium">
                        ช่อง: {Array.isArray(row.channel) ? row.channel.join(",") : row.channel}
                      </div>
                      <div className="space-y-2">
                        {row.coop.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.coop.map((c) => (
                              <span
                                key={c.coop_id}
                                className="rounded-md bg-[color:var(--color-muted)] px-2 py-1 text-xs text-[color:var(--color-foreground)]"
                              >
                                {c.coop_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-[color:var(--color-muted-foreground)]">
                            เลือกศูนย์/สหกรณ์
                          </div>
                        )}
                        <div className="max-h-40 overflow-auto rounded-md border border-[color:var(--color-input)] bg-transparent p-2 text-sm">
                          {coopList.map((c) => {
                            const isChecked = row.coop.some(
                              (x) => String(x.coop_id) === String(c.coop_id)
                            );
                            return (
                              <label key={c.coop_id} className="flex items-center gap-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const current = row.coop.map((x) => String(x.coop_id));
                                    const nextIds = e.target.checked
                                      ? [...current, String(c.coop_id)]
                                      : current.filter((id) => id !== String(c.coop_id));
                                    handleCoopChange(idx, nextIds);
                                  }}
                                />
                                <span>{c.coop_name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                  ยกเลิก
                </Button>
                <Button variant="default" onClick={onSubmit} disabled={saving}>
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
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              ต้องการบันทึกข้อมูลทั้งหมดหรือไม่
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
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


