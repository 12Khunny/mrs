import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useToast } from "@/providers/toastContext";
import { Button, Card, CardContent, Input, Label } from "@mrs/ui";

export default function ManualPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [truckList, setTruckList] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [search, setSearch] = useState("");
  const [comboOpen, setComboOpen] = useState(false);

  const [pendingOpen, setPendingOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    const fetchInit = async () => {
      setLoading(true);
      try {
        const res = await api.get("/loadedTruck/loadedTruckDetail");
        setTruckList(res?.truck_list ?? []);
      } catch {
        showToast("โหลดทะเบียนรถไม่สำเร็จ", "error");
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    fetchInit();
  }, [showToast]);

  const filteredTrucks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return truckList;
    return truckList.filter((t) => {
      const lic = (t?.truck_license || "").toLowerCase();
      const owner = (t?.owner || "").toLowerCase();
      return lic.includes(q) || owner.includes(q);
    });
  }, [search, truckList]);

  const selectedTruck = useMemo(
    () => truckList.find((t) => String(t?.truck_id) === String(selectedTruckId)) || null,
    [truckList, selectedTruckId]
  );

  const onConfirm = async () => {
    if (!selectedTruck) return;

    try {
      const listRes = await api.get("/loadedTruck/loadedTruckList");
      const list = Array.isArray(listRes)
        ? listRes
        : Array.isArray(listRes?.list)
          ? listRes.list
          : Array.isArray(listRes?.content)
            ? listRes.content
            : [];

      const sameTruck = list.filter(
        (x) => x?.truck_license === selectedTruck?.truck_license
      );

      if (sameTruck.length === 0) {
        navigate("/truckWeighing/Loaded", { state: { truck: selectedTruck } });
        return;
      }

      const latest = sameTruck.reduce(
        (best, cur) => ((cur?.id || 0) > (best?.id || 0) ? cur : best),
        sameTruck[0]
      );

      let detail = null;
      try {
        const detailRes = await api.get(
          `/unloadedTruck/unloadedTruckDetail/${latest.id}`
        );
        detail = detailRes?.content ?? detailRes?.detail ?? detailRes;
      } catch {
        detail = null;
      }

      const hasLoaded = !!(latest?.truck_loaded_weight || detail?.truck_loaded_weight);
      const hasUnloaded = !!detail?.truck_unloaded_weight;

      if (hasLoaded && !hasUnloaded) {
        setPendingPayload({ latestId: latest.id, truck: selectedTruck });
        setPendingOpen(true);
        return;
      }

      navigate("/truckWeighing/Loaded", { state: { truck: selectedTruck } });
    } catch {
      showToast("ตรวจสอบรายการล่าสุดไม่สำเร็จ", "error");
    }
  };

  return (
    <div className="px-6 py-6">
      <Card className="shadow-sm">
        <CardContent className="py-6">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            บันทึกการชั่งน้ำหนักแบบ Manual
          </h2>

          {loading ? (
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
              กำลังโหลดทะเบียนรถ...
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>เลือกทะเบียนรถ</Label>
                <div className="relative">
                  <Input
                    placeholder="ค้นหาทะเบียนรถ / เจ้าของรถ"
                    value={search}
                    onFocus={() => setComboOpen(true)}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setComboOpen(true);
                      setSelectedTruckId("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setComboOpen(false);
                    }}
                    className="pr-10"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setSelectedTruckId("");
                        setComboOpen(false);
                      }}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                      aria-label="ล้างข้อความค้นหา"
                    >
                      ×
                    </button>
                  ) : null}
                  {comboOpen && (
                    <div className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-md border border-[var(--color-border)] bg-[color:var(--color-card)] shadow-lg">
                      {filteredTrucks.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                          ไม่พบข้อมูล
                        </div>
                      ) : (
                        filteredTrucks.map((t) => (
                          <button
                            key={t.truck_id}
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
                            onClick={() => {
                              setSelectedTruckId(String(t.truck_id));
                              setSearch(`${t.truck_license}${t.owner ? ` - ${t.owner}` : ""}`);
                              setComboOpen(false);
                            }}
                          >
                            <div className="font-medium">{t.truck_license}</div>
                            <div className="text-xs text-[var(--color-muted-foreground)]">
                              {t.owner || "-"}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {comboOpen && (
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setComboOpen(false)}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-white">
                <Button
                  variant="default"
                  onClick={onConfirm}
                  disabled={!selectedTruck}
                >
                  ตกลง
                </Button>
              </div>

              {selectedTruck && (
                <div className="rounded-md border border-[var(--color-border)] bg-[color:var(--color-muted)]/40 p-3 text-sm">
                  เลือก: <b>{selectedTruck.truck_license}</b> | เจ้าของ:{" "}
                  <b>{selectedTruck.owner || "-"}</b> | จำนวนช่อง:{" "}
                  <b>{selectedTruck.number_channel || 0}</b>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold">พบรายการค้าง</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              ทะเบียน <b>{pendingPayload?.truck?.truck_license}</b> มีการชั่งเข้าแล้ว
              ต้องการไปบันทึกชั่งรถเปล่าของรายการเดิมหรือไม่
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  const id = pendingPayload?.latestId;
                  const truck = pendingPayload?.truck;
                  setPendingOpen(false);
                  if (id) {
                    navigate(`/truckWeighing/Unloaded/${id}`, {
                      state: { truck },
                    });
                  }
                }}
              >
                ตกลง
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


