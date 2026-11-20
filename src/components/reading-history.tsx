import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PvtStatusBadge, QualityBadge } from "@/components/status-badge";
import { formatTime } from "@/lib/format";
import type { Reading } from "@/lib/types";

function trackedCount(reading: Reading): number {
  return reading.satellites.filter(
    (satellite) => satellite.status === "tracked",
  ).length;
}

function averageCn0(reading: Reading): string {
  const values = reading.satellites
    .map((satellite) => satellite.cn0)
    .filter((value): value is number => value !== null);

  if (values.length === 0) return "—";
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1);
}

function worstQuality(reading: Reading) {
  if (reading.satellites.some((satellite) => satellite.quality === "unusable")) {
    return "unusable" as const;
  }
  if (reading.satellites.some((satellite) => satellite.quality === "weak")) {
    return "weak" as const;
  }
  return null;
}

export function ReadingHistory({ readings }: { readings: Reading[] }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Reading history</CardTitle>
        <CardDescription>
          {readings.length} recent reading{readings.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {readings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No readings yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>State</TableHead>
                <TableHead>PVT</TableHead>
                <TableHead className="text-right">Tracked</TableHead>
                <TableHead className="text-right">Avg C/N₀</TableHead>
                <TableHead>Quality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((reading) => {
                const quality = worstQuality(reading);

                return (
                  <TableRow
                    key={reading.id}
                    className={reading.anomaly ? "bg-destructive/5" : undefined}
                  >
                    <TableCell className="font-mono text-xs tabular-nums">
                      {formatTime(reading.observedAt)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {reading.receiverState}
                    </TableCell>
                    <TableCell>
                      <PvtStatusBadge status={reading.pvt.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {trackedCount(reading)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {averageCn0(reading)}
                    </TableCell>
                    <TableCell>
                      {reading.anomaly ? (
                        <span className="text-xs font-medium text-destructive">
                          Anomaly
                        </span>
                      ) : quality ? (
                        <QualityBadge quality={quality} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
