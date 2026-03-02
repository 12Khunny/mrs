import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@mrs/ui";
import api from "@/services/api";
import { useToast } from "@/providers/toastContext";
import PendingTransactionDialog from "@/features/truckWeighing/components/PendingTransactionDialog";
import AutoStatusHeader from "@/features/truckWeighing/components/AutoStatusHeader";
import AutoStatusBody from "@/features/truckWeighing/components/AutoStatusBody";

const STATUS_CONNECTED = "connected";
const STATUS_DISCONNECTED = "disconnected";

const normalizePlate = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const toNumberSafe = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getTransactionId = (row) =>
  toNumberSafe(row?.id ?? row?.truck_milk_to_factory_id ?? row?.truckMilkToFactoryId ?? 0);

const hasLoadedWeight = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "" && String(value).trim() !== "0";

const hasUnloadedWeight = hasLoadedWeight;

export default function AutoPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [rfidStatus, setRfidStatus] = useState(STATUS_DISCONNECTED);
  const [readerName, setReaderName] = useState("RFID Reader");
  const [latestTag, setLatestTag] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const lastProcessedSequenceRef = useRef(0);
  const busyRef = useRef(false);

  const isConnected = rfidStatus === STATUS_CONNECTED;
  const openRfidMonitorPage = () => {
    const defaultMonitorUrl =
      typeof __MRS_DEFAULT_RFID_MONITOR_URL__ !== "undefined"
        ? __MRS_DEFAULT_RFID_MONITOR_URL__
        : "http://localhost:5261/api/rfid-monitor.html";
    const baseMonitorUrl = import.meta.env.VITE_RFID_MONITOR_URL ?? defaultMonitorUrl;
    const isElectronRuntime =
      typeof window !== "undefined" &&
      typeof window?.mrsRuntimeConfig?.apiUrl === "string" &&
      window.mrsRuntimeConfig.apiUrl.includes("://localhost:5000/");

    const target = isElectronRuntime ? "electron" : "client";
    const separator = baseMonitorUrl.includes("?") ? "&" : "?";
    const monitorUrl = `${baseMonitorUrl}${separator}target=${target}`;
    window.open(monitorUrl, "_blank", "noopener,noreferrer");
  };

  const statusLabel = useMemo(() => {
    if (isConnected) return "Connected";
    return "Disconnected";
  }, [isConnected]);

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

    const syncLastSequenceOnEnter = async () => {
      try {
        const data = await api.get("/rfid/detection");
        if (cancelled) return;
        const seq = Number(data?.latest_event?.sequence ?? data?.sequence ?? 0);
        if (seq > 0) {
          lastProcessedSequenceRef.current = seq;
        }
      } catch {
        // Ignore sync errors; polling loop below will retry.
      }
    };

    const processDetectedTruck = async (truck, tagId) => {
      const listRes = await api.get("/loadedTruck/loadedTruckList");
      const list = Array.isArray(listRes)
        ? listRes
        : Array.isArray(listRes?.list)
          ? listRes.list
          : Array.isArray(listRes?.content)
            ? listRes.content
            : [];

      const targetTruckId = Number(truck?.truck_id ?? truck?.truckId ?? 0);
      const targetLicense = normalizePlate(truck?.truck_license);

      const sameTruck = list.filter((x) => {
        const rowTruckId = Number(x?.truck_id ?? x?.truckId ?? 0);
        if (targetTruckId > 0 && rowTruckId > 0) {
          return rowTruckId === targetTruckId;
        }
        const rowLicense = normalizePlate(x?.truck_license);
        return (
          rowLicense === targetLicense ||
          rowLicense.includes(targetLicense) ||
          targetLicense.includes(rowLicense)
        );
      });

      if (sameTruck.length === 0) {
        navigate("/truckWeighing/Loaded", { state: { truck, flowSource: "auto" } });
        return;
      }

      const latest = sameTruck.reduce(
        (best, cur) => (getTransactionId(cur) > getTransactionId(best) ? cur : best),
        sameTruck[0]
      );

      let detail = null;
      try {
        const detailRes = await api.get(`/unloadedTruck/unloadedTruckDetail/${latest.id}`);
        detail = detailRes?.content ?? detailRes?.detail ?? detailRes;
      } catch {
        detail = null;
      }

      const hasLoaded = hasLoadedWeight(
        latest?.truck_loaded_weight ??
          latest?.truckLoadedWeight ??
          latest?.loaded_weight ??
          detail?.truck_loaded_weight ??
          detail?.truckLoadedWeight ??
          detail?.loaded_weight
      );

      const hasUnloaded = hasUnloadedWeight(
        detail?.truck_unloaded_weight ??
          detail?.truckUnloadedWeight ??
          detail?.unloaded_weight
      );

      if (hasLoaded && !hasUnloaded) {
        const latestId = getTransactionId(latest);
        if (!latestId) {
          navigate("/truckWeighing/Loaded", { state: { truck, sourceTag: tagId, flowSource: "auto" } });
          return;
        }
        setPendingPayload({ latestId, truck, tagId });
        setPendingOpen(true);
        return;
      }

      navigate("/truckWeighing/Loaded", { state: { truck, sourceTag: tagId, flowSource: "auto" } });
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
        } catch (error) {
          const detail = error?.message ? ` (${error.message})` : "";
          showToast(`พบแท็ก RFID แต่ไม่สามารถค้นหาข้อมูลรถได้${detail}`, "warning");
          lastProcessedSequenceRef.current = event.sequence;
        }
      } catch {
        // Ignore polling errors; status polling will show disconnected if needed.
      } finally {
        busyRef.current = false;
        setResolving(false);
      }
    };

    syncLastSequenceOnEnter().finally(() => {
      if (!cancelled) {
        pollDetection();
      }
    });

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
          <AutoStatusHeader
            title="บันทึกการชั่งน้ำหนัก"
            isConnected={isConnected}
            statusLabel={statusLabel}
            onStatusClick={openRfidMonitorPage}
          />
          <AutoStatusBody
            isConnected={isConnected}
            readerName={readerName}
            resolving={resolving}
            latestTag={latestTag}
            onManualEntry={() => navigate("/truckWeighing/Manual")}
          />
        </CardContent>
      </Card>

      <PendingTransactionDialog
        open={pendingOpen}
        truckLicense={pendingPayload?.truck?.truck_license}
        description="ต้องการไปบันทึกชั่งรถเปล่าของรายการเดิมหรือไม่"
        onCancel={() => setPendingOpen(false)}
        onConfirm={() => {
          const id = pendingPayload?.latestId;
          const truck = pendingPayload?.truck;
          const tagId = pendingPayload?.tagId;
          setPendingOpen(false);
          if (id) {
            navigate(`/truckWeighing/Unloaded/${id}`, {
              state: { truck, sourceTag: tagId, flowSource: "auto" },
            });
          }
        }}
      />
    </div>
  );
}
