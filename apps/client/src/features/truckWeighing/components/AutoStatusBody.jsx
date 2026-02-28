import { Button } from "@mrs/ui";
import { CarFront, Radio, Search } from "lucide-react";
import AnimatedDots from "@/features/truckWeighing/components/AnimatedDots";

export default function AutoStatusBody({
  isConnected,
  readerName,
  resolving,
  latestTag,
  onManualEntry,
}) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
      <div className="text-[140px] text-[var(--color-muted-foreground)]">
        {isConnected ? <Search className="h-36 w-36" /> : <CarFront className="h-36 w-36" />}
      </div>

      {isConnected ? (
        <>
          <div className="mt-6">
            <AnimatedDots text="กำลังตรวจหารถบรรทุก" />
          </div>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{readerName}</p>
          {resolving && latestTag ? (
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--color-primary)]">
              <Radio className="h-4 w-4 animate-pulse" />
              Tag {latestTag} กำลังตรวจสอบ...
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="mt-6 text-5xl font-semibold text-[var(--color-foreground)]">
            ไม่มีการเชื่อมต่อเครื่องอ่าน
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            ระบบจะดำเนินการตรวจหารถบรรทุกอัตโนมัติเมื่อเครื่องอ่านกลับมาเชื่อมต่อ
          </p>
          <Button className="mt-6 text-white" variant="default" onClick={onManualEntry}>
            บันทึกการชั่งน้ำหนักแบบ Manual
          </Button>
        </>
      )}
    </div>
  );
}

