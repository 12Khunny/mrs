import { useEffect, useMemo, useRef, useState } from "react";
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

function formatWeight(value) {
  if (value == null || value === "") return "";
  const parsed = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(parsed)) return String(value);
  return parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LoadedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const lockedTruck = location.state?.truck ?? null;
  const flowSource = location.state?.flowSource === "auto" ? "auto" : "manual";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [truckList, setTruckList] = useState([]);
  const [coopList, setCoopList] = useState([]);
  const [checked, setChecked] = useState(false);

  const [selectedTruckId] = useState(lockedTruck?.truck_id ? String(lockedTruck.truck_id) : "");
  const selectedTruck = useMemo(
    () => truckList.find((t) => String(t?.truck_id) === String(selectedTruckId)) || lockedTruck || null,
    [truckList, selectedTruckId, lockedTruck]
  );

  const [driverName, setDriverName] = useState("");
  const [loadedDate, setLoadedDate] = useState(toISODate());
  const [loadedTime, setLoadedTime] = useState(toCurrentTime());
  const [loadedWeight, setLoadedWeight] = useState("");
  const [errors, setErrors] = useState({
    truck: false,
    driverName: false,
    loadedDate: false,
    loadedTime: false,
    loadedWeight: false,
    coop: false,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  const channelNumber = selectedTruck?.number_channel ?? 0;
  const ownerName = selectedTruck?.owner ?? "";

  const [milkCompartmentList, setMilkCompartmentList] = useState([]);
  const [coopSearchByRow, setCoopSearchByRow] = useState({});
  const [coopOpenByRow, setCoopOpenByRow] = useState({});
  const coopPickerRefs = useRef({});

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
      setCoopSearchByRow({});
      setCoopOpenByRow({});
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

    setCoopSearchByRow({});
    setCoopOpenByRow({});
  }, [channelNumber, checked]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const isInsideAnyPicker = Object.values(coopPickerRefs.current).some((el) => el && el.contains(event.target));
      if (!isInsideAnyPicker) {
        setCoopOpenByRow({});
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleCoopChange = (rowIndex, selectedIds) => {
    setMilkCompartmentList((prev) => {
      const next = [...prev];
      const ids = Array.isArray(selectedIds) ? selectedIds : [];
      const selected = coopList.filter((c) => ids.includes(String(c.coop_id)));
      next[rowIndex] = { ...next[rowIndex], coop: selected };
      return next;
    });

    setErrors((prev) => ({ ...prev, coop: false }));
  };

  const removeCoopInRow = (rowIndex, coopId) => {
    const current = milkCompartmentList[rowIndex]?.coop ?? [];
    const nextIds = current.filter((c) => String(c.coop_id) !== String(coopId)).map((c) => String(c.coop_id));
    handleCoopChange(rowIndex, nextIds);
  };

  const validate = () => {
    const nextErrors = {
      truck: !selectedTruck,
      driverName: !driverName.trim(),
      loadedDate: !loadedDate,
      loadedTime: !loadedTime,
      loadedWeight: !loadedWeight || Number.isNaN(parseFloat(stripThousands(loadedWeight))),
      coop: milkCompartmentList.every((item) => item.coop.length === 0),
    };

    setErrors(nextErrors);

    if (nextErrors.truck) {
      showToast("กรุณาเลือกรถ", "warning");
      return false;
    }
    if (nextErrors.driverName) {
      showToast("กรุณาระบุชื่อ-นามสกุลคนขับรถ", "warning");
      return false;
    }
    if (nextErrors.loadedDate || nextErrors.loadedTime) {
      showToast("กรุณาระบุวันที่และเวลา", "warning");
      return false;
    }
    if (nextErrors.loadedWeight) {
      showToast("กรุณาระบุน้ำหนัก", "warning");
      return false;
    }
    if (nextErrors.coop) {
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

      const payload = {
        truck_id: selectedTruck.truck_id,
        driver_name: driverName,
        truck_loaded_date_time: toLocalDateTime(loadedDate, loadedTime),
        truck_loaded_weight: parseFloat(stripThousands(loadedWeight)).toFixed(2),
        truck_milk_channel_coop: finalList.map((item) => ({
          channel: item.channel,
          coop: item.coop.map((c) => ({ coop_id: c.coop_id })),
        })),
        calulate_type: checked ? 2 : 1,
      };

      await api.post("/loadedTruck/save", payload);
      showToast("บันทึกสำเร็จ", "success");
      navigate(flowSource === "auto" ? "/truckWeighing/Auto" : "/truckWeighing/Manual", { replace: true });
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
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">บันทึกการชั่งน้ำหนักรถพร้อมน้ำนม</h2>

          {loading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">กำลังโหลดข้อมูล...</p>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>ทะเบียนรถ : <span className="text-[var(--color-destructive)]">*</span></Label>
                      <Input
                        value={selectedTruck?.truck_license ?? ""}
                        disabled
                        aria-invalid={errors.truck}
                        className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)] disabled:opacity-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>เจ้าของรถ :</Label>
                      <Input
                        value={ownerName}
                        disabled
                        className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)] disabled:opacity-100"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>ชื่อ-นามสกุลคนขับรถ : <span className="text-[var(--color-destructive)]">*</span></Label>
                      <Input
                        value={driverName}
                        aria-invalid={errors.driverName}
                        onChange={(e) => {
                          setDriverName(e.target.value);
                          if (errors.driverName) {
                            setErrors((prev) => ({ ...prev, driverName: false }));
                          }
                        }}
                        placeholder="ชื่อ-นามสกุลคนขับรถ"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>วันที่ชั่งน้ำหนัก : <span className="text-[var(--color-destructive)]">*</span></Label>
                      <Input
                        type="date"
                        value={loadedDate}
                        aria-invalid={errors.loadedDate}
                        onChange={(e) => {
                          setLoadedDate(e.target.value);
                          setErrors((prev) => ({ ...prev, loadedDate: false }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>เวลาที่ชั่งน้ำหนัก : <span className="text-[var(--color-destructive)]">*</span></Label>
                      <Input
                        type="time"
                        value={loadedTime}
                        aria-invalid={errors.loadedTime}
                        onChange={(e) => {
                          setLoadedTime(e.target.value);
                          setErrors((prev) => ({ ...prev, loadedTime: false }));
                        }}
                      />
                    </div>
                  </div>

                  {selectedTruck && milkCompartmentList.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">บันทึกข้อมูลช่องน้ำนม</h3>
                        <label className="inline-flex items-center gap-2 text-sm font-medium">
                          <input
                            id="whole-truck"
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span>บันทึกช่องนมลงทั้งคัน</span>
                        </label>
                      </div>
                      <div className="overflow-x rounded-md border border-[var(--color-border)]">
                        <table className="w-full border-collapse text-sm">
                          <thead className="bg-[color:var(--color-muted)]/40">
                            <tr>
                              <th className="w-[100px] border-b border-[var(--color-border)] px-4 py-3 text-center font-semibold">ช่อง</th>
                              <th className="border-b border-[var(--color-border)] px-4 py-3 text-left font-semibold">ศูนย์ ฯ / สหกรณ์ที่ส่งน้ำนม</th>
                            </tr>
                          </thead>
                          <tbody>
                            {milkCompartmentList.map((row, idx) => {
                              const query = (coopSearchByRow[idx] ?? "").trim().toLowerCase();
                              const isOpen = Boolean(coopOpenByRow[idx]);
                              const selectedIdSet = new Set(row.coop.map((x) => String(x.coop_id)));
                              const filteredCoops = coopList.filter((c) => {
                                if (selectedIdSet.has(String(c?.coop_id))) return false;
                                if (!query) return true;
                                const name = (c?.coop_name ?? "").toLowerCase();
                                const id = String(c?.coop_id ?? "");
                                return name.includes(query) || id.includes(query);
                              });

                              return (
                                <tr key={idx} className="align-top hover:bg-[color:var(--color-muted)]/20">
                                  <td className="border-b border-[var(--color-border)] px-4 py-3 text-center font-semibold">
                                    {Array.isArray(row.channel) ? row.channel.join(",") : row.channel}
                                  </td>
                                  <td className="border-b border-[var(--color-border)] px-4 py-3">
                                    <div role="group" aria-label={`milk-coop-selection-${idx + 1}`} aria-invalid={errors.coop} className="space-y-2">
                                      <div className="flex flex-wrap gap-1">
                                        {row.coop.map((c) => (
                                          <span
                                            key={c.coop_id}
                                            className="inline-flex items-center gap-1 rounded-md bg-[color:var(--color-muted)] px-2 py-1 text-md text-[color:var(--color-foreground)]"
                                          >
                                            {c.coop_name}
                                            <button
                                              type="button"
                                              className="rounded px-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                                              onClick={() => removeCoopInRow(idx, c.coop_id)}
                                              aria-label={`remove-coop-${c.coop_id}`}
                                            >
                                              x
                                            </button>
                                          </span>
                                        ))}
                                      </div>

                                      <div
                                        ref={(el) => {
                                          if (el) coopPickerRefs.current[idx] = el;
                                          else delete coopPickerRefs.current[idx];
                                        }}
                                        className="relative"
                                      >
                                        <Input
                                          value={coopSearchByRow[idx] ?? ""}
                                          onFocus={() => setCoopOpenByRow((prev) => ({ ...prev, [idx]: true }))}
                                          onKeyDown={(e) => {
                                            if (e.key === "Escape") {
                                              setCoopOpenByRow((prev) => ({ ...prev, [idx]: false }));
                                            }
                                          }}
                                          onChange={(e) => {
                                            setCoopSearchByRow((prev) => ({ ...prev, [idx]: e.target.value }));
                                            setCoopOpenByRow((prev) => ({ ...prev, [idx]: true }));
                                          }}
                                          aria-expanded={isOpen}
                                          aria-controls={`coop-dropdown-${idx}`}
                                          className="pr-10"
                                          placeholder={row.coop.length === 0 ? "ค้นหาสหกรณ์..." : "ค้นหาเพิ่ม..."}
                                        />
                                        <button
                                          type="button"
                                          aria-label={`toggle-coop-dropdown-${idx}`}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                                          onClick={() => setCoopOpenByRow((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                        >
                                          {isOpen ? "^" : "v"}
                                        </button>

                                        {isOpen && (
                                          <div
                                            id={`coop-dropdown-${idx}`}
                                            className="absolute z-30 mt-1 w-full rounded-md border border-[color:var(--color-input)] bg-[var(--color-card)] p-2 shadow-lg"
                                          >
                                            <div className="max-h-44 overflow-auto">
                                              {filteredCoops.length === 0 ? (
                                                <p className="py-2 text-xs text-[var(--color-muted-foreground)]">ไม่พบสหกรณ์</p>
                                              ) : (
                                                filteredCoops.map((c) => {
                                                  const isSelected = row.coop.some((x) => String(x.coop_id) === String(c.coop_id));
                                                  return (
                                                    <label key={c.coop_id} className="flex items-center gap-2 py-1">
                                                      <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                          const current = row.coop.map((x) => String(x.coop_id));
                                                          const nextIds = e.target.checked
                                                            ? [...current, String(c.coop_id)]
                                                            : current.filter((coopId) => coopId !== String(c.coop_id));
                                                          handleCoopChange(idx, nextIds);
                                                        }}
                                                      />
                                                      <span>{c.coop_name}</span>
                                                    </label>
                                                  );
                                                })
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    !selectedTruck && <p className="text-sm text-[var(--color-muted-foreground)]">กรุณาเลือกรถก่อน</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>น้ำหนักรถพร้อมน้ำนม (กก.) : <span className="text-[var(--color-destructive)]">*</span></Label>
                    <Input
                      type="text"
                      value={loadedWeight}
                      aria-invalid={errors.loadedWeight}
                      inputMode="decimal"
                      onChange={(e) => {
                        const raw = stripThousands(e.target.value);
                        if (raw === "" || isValidWeightInput(raw)) {
                          setLoadedWeight(formatThousandsInput(raw));
                          setErrors((prev) => ({ ...prev, loadedWeight: false }));
                        }
                      }}
                      onFocus={() => {
                        setLoadedWeight((prev) => stripThousands(prev));
                      }}
                      onBlur={() => {
                        if (loadedWeight === "") return;
                        const num = Number(stripThousands(loadedWeight));
                        if (!Number.isNaN(num)) {
                          setLoadedWeight(formatWeight(num));
                        }
                      }}
                      placeholder="น้ำหนักรถพร้อมน้ำนม"
                      className="h-28 text-center text-4xl font-semibold"
                    />
                    {loadedWeight ? (
                      <p className="text-right text-md text-[var(--color-muted-foreground)]">{formatWeight(loadedWeight)} กก.</p>
                    ) : null}
                  </div>

                  <Button variant="default" onClick={onSubmit} disabled={saving} className="h-12 w-full text-white">
                    {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </Button>
                  <Button variant="outline" onClick={() => navigate(-1)} disabled={saving} className="h-12 w-full text-red-600 border-red-600 hover:bg-red-600/10 focus:bg-red-600/10">
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold">ยืนยันการบันทึก</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">ต้องการบันทึกข้อมูลทั้งหมดหรือไม่</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} className="px-6 text-red-600 border-red-600 hover:bg-red-600/10 focus:bg-red-600/10">
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
