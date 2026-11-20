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
import { QualityBadge } from "@/components/status-badge";
import { formatValue } from "@/lib/format";
import type { Satellite } from "@/lib/types";

function statusLabel(status: Satellite["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function SatelliteTable({ satellites }: { satellites: Satellite[] }) {
  const tracked = satellites.filter(
    (satellite) => satellite.status === "tracked",
  ).length;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Satellites</CardTitle>
        <CardDescription>
          {tracked} tracked of {satellites.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PRN</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">C/N₀ (dB-Hz)</TableHead>
              <TableHead className="text-right">Doppler (Hz)</TableHead>
              <TableHead>Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {satellites.map((satellite) => (
              <TableRow key={satellite.prn}>
                <TableCell className="font-mono tabular-nums">
                  {satellite.prn}
                </TableCell>
                <TableCell>{statusLabel(satellite.status)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatValue(satellite.cn0, 1)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {satellite.dopplerHz === null
                    ? "—"
                    : satellite.dopplerHz.toFixed(0)}
                </TableCell>
                <TableCell>
                  <QualityBadge quality={satellite.quality} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
