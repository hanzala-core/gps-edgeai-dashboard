import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { stopSessionAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PvtStatusBadge, SessionStateBadge } from "@/components/status-badge";
import { formatRelative, formatTime, formatValue } from "@/lib/format";
import {
  SCENARIO_LABELS,
  type Reading,
  type SessionRow,
} from "@/lib/types";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums">{value}</p>
    </div>
  );
}

export function LatestSessionCard({
  session,
  latest,
}: {
  session: SessionRow;
  latest: Reading | null;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{session.title ?? `Session #${session.id}`}</CardTitle>
        <CardDescription>
          {session.title ? `#${session.id} · ` : ""}
          {SCENARIO_LABELS[session.scenario]} · started{" "}
          {formatRelative(session.startedAt)}
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="outline">Simulation mode</Badge>
            <SessionStateBadge state={session.state} />
            {latest ? <PvtStatusBadge status={latest.pvt.status} /> : null}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Latitude" value={formatValue(latest.pvt.lat, 5, "°")} />
            <Metric
              label="Longitude"
              value={formatValue(latest.pvt.lon, 5, "°")}
            />
            <Metric
              label="Altitude"
              value={formatValue(latest.pvt.altitudeM, 1, "m")}
            />
            <Metric
              label="Speed"
              value={formatValue(latest.pvt.speedMps, 2, "m/s")}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Waiting for the first reading.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {session.readingCount} reading
            {session.readingCount === 1 ? "" : "s"}
            {latest ? ` · last at ${formatTime(latest.observedAt)}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {session.state === "running" ? (
              <form action={stopSessionAction}>
                <input type="hidden" name="sessionId" value={session.id} />
                <Button type="submit" variant="outline" size="sm">
                  Stop session
                </Button>
              </form>
            ) : null}
            <Link
              href={`/sessions/${session.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open session
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
