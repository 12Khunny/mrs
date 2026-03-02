import { Button } from "@mrs/ui";

export default function PendingTransactionDialog({
  open,
  truckLicense,
  description = "ต้องการไปบันทึกชั่งรถเปล่าของรายการเดิมหรือไม่",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold">พบรายการค้าง</h3>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          ทะเบียน <b>{truckLicense || "-"}</b> มีรายการชั่งเข้าแล้ว {description}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="px-6 text-red-600 border-red-600 hover:bg-red-600/10 focus:bg-red-600/10"
          >
            ยกเลิก
          </Button>
          <Button
            variant="default"
            className="text-white transition-[filter] duration-200 hover:brightness-90 focus:brightness-90"
            onClick={onConfirm}
          >
            ตกลง
          </Button>
        </div>
      </div>
    </div>
  );
}
