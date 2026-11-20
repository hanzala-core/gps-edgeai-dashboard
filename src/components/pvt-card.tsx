import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PvtStatusBadge } from "@/components/status-badge";
import { formatTime, formatValue } from "@/lib/format";
import type { Pvt } from "@/lib/types";

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm tabular-nums">{value}</dd>
    </div>
  );
}

export function PvtCard({
  pvt,
  observedAt,
}: {
  pvt: Pvt;
  observedAt: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Position, velocity, and time</CardTitle>
        <CardAction>
          <PvtStatusBadge status={pvt.status} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Field label="Time" value={formatTime(observedAt)} />
          <Field label="Latitude" value={formatValue(pvt.lat, 6, "°")} />
          <Field label="Longitude" value={formatValue(pvt.lon, 6, "°")} />
          <Field label="Altitude" value={formatValue(pvt.altitudeM, 1, "m")} />
          <Field label="Speed" value={formatValue(pvt.speedMps, 2, "m/s")} />
          <Field label="Course" value={formatValue(pvt.courseDeg, 1, "°")} />
        </dl>

        {pvt.status === "stale" ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Last known fix. Values are stale and should not be treated as
            current.
          </p>
        ) : null}
        {pvt.status === "unavailable" ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No position fix is available for this reading.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
