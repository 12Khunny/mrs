import { Card, CardContent } from "@mrs/ui";

export default function AutoPage() {
  return (
    <div className="px-6 py-6">
      <Card className="shadow-sm">
        <CardContent className="py-6">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            บันทึกการชั่งน้ำหนัก
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            เลือกรถเพื่อเริ่มบันทึกการชั่งน้ำหนัก
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


