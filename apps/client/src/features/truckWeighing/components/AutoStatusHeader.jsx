export default function AutoStatusHeader({ title, isConnected, statusLabel, onStatusClick }) {
  const statusColor = isConnected ? "text-green-600" : "text-red-600";

  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h2>
      <div className="text-base font-semibold">
        <span>สถานะระบบ RFID : </span>
        <button
          type="button"
          onClick={onStatusClick}
          className={`inline-flex items-center gap-1 ${statusColor} transition-opacity hover:opacity-80`}
          title="เปิดหน้า RFID Monitor"
        >
          <span>{isConnected ? "●" : "●"}</span>
          <span>{statusLabel}</span>
        </button>
      </div>
    </div>
  );
}
