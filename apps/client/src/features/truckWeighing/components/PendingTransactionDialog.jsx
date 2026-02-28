import { Button } from "@mrs/ui";

export default function PendingTransactionDialog({
  open,
  truckLicense,
  description,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
        <h3 className="text-lg font-semibold">Found pending transaction</h3>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Plate <b>{truckLicense || "-"}</b> already has a loaded weighing entry. {description}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="default" className="text-white" onClick={onConfirm}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
