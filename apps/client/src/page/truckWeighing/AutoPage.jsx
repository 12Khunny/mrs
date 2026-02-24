import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent } from "@mrs/ui";
import { CarFront, Radio, Search } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/providers/toastContext";

const STATUS_CONNECTED = "connected";
const STATUS_DISCONNECTED = "disconnected";

export default function AutoPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [rfidStatus, setRfidStatus] = useState(STATUS_DISCONNECTED);
  const [readerName, setReaderName] = useState("RFID Reader");
  const [latestTag, setLatestTag] = useState(null);
  const [resolving, setResolving] = useState(false);

  const lastProcessedSequenceRef = useRef(0);
  const busyRef = useRef(false);

  const isConnected = rfidStatus === STATUS_CONNECTED;

  const statusLabel = useMemo(() => {
    if (isConnected) return "Connected";
    return "Reader Disconnected";
  }, [isConnected]);

  const statusColor = isConnected ? "text-green-600" : "text-red-600";

  useEffect(() => {
    let cancelled = false;

    const pollStatus = async () => {
      try {
        const status = await api.get("/rfid/status");
        if (cancelled) return;
        setRfidStatus(status?.connected ? STATUS_CONNECTED : STATUS_DISCONNECTED);
        setReaderName(status?.reader_name ?? "RFID Reader");
      } catch {
        if (cancelled) return;
        setRfidStatus(STATUS_DISCONNECTED);
      }
    };

    pollStatus();
    const timer = setInterval(pollStatus, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    let cancelled = false;

    const processDetectedTruck = async (truck, tagId) => {
      const listRes = await api.get("/loadedTruck/loadedTruckList");
      const list = Array.isArray(listRes)
        ? listRes
        : Array.isArray(listRes?.list)
          ? listRes.list
          : Array.isArray(listRes?.content)
            ? listRes.content
            : [];

      const sameTruck = list.filter(
        (x) => x?.truck_license === truck?.truck_license
      );

      if (sameTruck.length === 0) {
        navigate("/truckWeighing/Loaded", { state: { truck } });
        return;
      }

      const latest = sameTruck.reduce(
        (best, cur) => ((cur?.id || 0) > (best?.id || 0) ? cur : best),
        sameTruck[0]
      );

      let detail = null;
      try {
        const detailRes = await api.get(`/unloadedTruck/unloadedTruckDetail/${latest.id}`);
        detail = detailRes?.content ?? detailRes?.detail ?? detailRes;
      } catch {
        detail = null;
      }

      const hasLoaded = !!(latest?.truck_loaded_weight || detail?.truck_loaded_weight);
      const hasUnloaded = !!detail?.truck_unloaded_weight;

      if (hasLoaded && !hasUnloaded) {
        navigate(`/truckWeighing/Unloaded/${latest.id}`, {
          state: { truck, sourceTag: tagId },
        });
        return;
      }

      navigate("/truckWeighing/Loaded", { state: { truck, sourceTag: tagId } });
    };

    const pollDetection = async () => {
      if (busyRef.current) return;
      try {
        const data = await api.get("/rfid/detection");
        if (cancelled) return;

        const event = data?.latest_event;
        if (!event?.sequence || !event?.tag_id) return;
        if (event.sequence <= lastProcessedSequenceRef.current) return;

        busyRef.current = true;
        setResolving(true);
        setLatestTag(event.tag_id);

        try {
          const resolve = await api.get(`/rfid/resolve?tag_id=${encodeURIComponent(event.tag_id)}`);
          const truck = resolve?.truck ?? null;
          if (!truck) {
            showToast("พบแท็ก RFID แต่ไม่พบรถที่ผูกไว้", "warning");
            lastProcessedSequenceRef.current = event.sequence;
            return;
          }

          showToast(`ตรวจพบรถ ${truck.truck_license}`, "success");
          lastProcessedSequenceRef.current = event.sequence;
          await processDetectedTruck(truck, event.tag_id);
        } catch {
          showToast("พบแท็ก RFID แต่ไม่สามารถ resolve รถได้", "warning");
          lastProcessedSequenceRef.current = event.sequence;
        }
      } catch {
        // Ignore polling errors; status polling will show disconnected if needed.
      } finally {
        busyRef.current = false;
        setResolving(false);
      }
    };

    pollDetection();
    const timer = setInterval(pollDetection, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isConnected, navigate, showToast]);

  return (
    <div className="px-6 py-6">
      <Card className="shadow-sm">
        <CardContent className="py-6">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              บันทึกการชั่งน้ำหนัก
            </h2>
            <div className="text-base font-semibold">
              <span>สถานะระบบ RFID : </span>
              <span className={statusColor}>
                {isConnected ? "●" : "●"} {statusLabel}
              </span>
            </div>
          </div>

          <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
            <div className="text-[140px] text-[var(--color-muted-foreground)]">
              {isConnected ? <Search className="h-36 w-36" /> : <CarFront className="h-36 w-36" />}
            </div>

            {isConnected ? (
              <>
                <p className="mt-6 text-5xl font-semibold text-[var(--color-foreground)]">กำลังตรวจหารถบรรทุก</p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  {readerName}
                </p>
                {resolving && latestTag ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--color-primary)]">
                    <Radio className="h-4 w-4 animate-pulse" />
                    ตรวจพบแท็ก {latestTag} กำลังตรวจสอบรายการ...
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="mt-6 text-5xl font-semibold text-[var(--color-foreground)]">ไม่มีการเชื่อมต่อเครื่องอ่าน</p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  ระบบจะกลับมาตรวจจับอัตโนมัติเมื่อเครื่องอ่านเชื่อมต่อ
                </p>
                <Button
                  className="mt-6 text-white"
                  variant="default"
                  onClick={() => navigate("/truckWeighing/Manual")}
                >
                  บันทึก Manual
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
