import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QualityBadge } from "@/components/status-badge";
import type { Quality, Reading } from "@/lib/types";

const qualityOrder: Quality[] = ["strong", "good", "weak", "unusable"];

function qualityCounts(reading: Reading): Record<Quality, number> {
  const counts: Record<Quality, number> = {
    strong: 0,
    good: 0,
    weak: 0,
    unusable: 0,
  };

  for (const satellite of reading.satellites) {
    counts[satellite.quality] += 1;
  }

  return counts;
}

export function ReceiverStatusCard({ reading }: { reading: Reading }) {
  const counts = qualityCounts(reading);
  const tracked = reading.satellites.filter(
    (satellite) => satellite.status === "tracked",
  ).length;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Receiver status</CardTitle>
        <CardDescription>
          {tracked} of {reading.satellites.length} satellites tracked
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {qualityOrder.map((quality) => (
            <span key={quality} className="inline-flex items-center gap-1.5">
              <QualityBadge quality={quality} />
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {counts[quality]}
              </span>
            </span>
          ))}
        </div>
        {reading.anomaly ? (
          <p className="text-sm font-medium text-destructive">
            Anomaly active in this reading.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No active anomaly.</p>
        )}
      </CardContent>
    </Card>
  );
}
