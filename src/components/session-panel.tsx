import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { deleteSessionAction, stopSessionAction } from "@/app/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { Cn0Chart } from "@/components/cn0-chart";
import { EventList } from "@/components/event-list";
import { PvtCard } from "@/components/pvt-card";
import { ReadingHistory } from "@/components/reading-history";
import { ReceiverStatusCard } from "@/components/receiver-status";
import { SatelliteTable } from "@/components/satellite-table";
import { LiveSession } from "@/components/live-session";
import { SessionMetaForm } from "@/components/session-meta-form";
import { SessionReplay } from "@/components/session-replay";
import { SessionReportCard } from "@/components/session-report";
import { SessionStateBadge } from "@/components/status-badge";
import { formatDateTime, formatCount } from "@/lib/format";
import type { SessionReport } from "@/lib/report";
import {
  SCENARIO_LABELS,
  type Reading,
  type SessionEvent,
  type SessionRow,
} from "@/lib/types";

type SessionPanelProps = {
  session: SessionRow;
  latest: Reading | null;
  chart: Reading[];
  history: Reading[];
  timeline: Reading[];
  events: SessionEvent[];
  report: SessionReport;
  showStop?: boolean;
  showDelete?: boolean;
};

function StopForm({ sessionId }: { sessionId: number }) {
  return (
    <form action={stopSessionAction}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button type="submit" variant="outline" size="sm">
        Stop session
      </Button>
    </form>
  );
}

export function SessionPanel({
  session,
  latest,
  chart,
  history,
  timeline,
  events,
  report,
  showStop = true,
  showDelete = true,
}: SessionPanelProps) {
  const running = session.state === "running";
  const canReplay = !running && timeline.length > 1;

  return (
    <div className="space-y-4">
      <Card size="sm">
        <div className="flex flex-wrap items-start justify-between gap-3 px-(--card-spacing)">
          <div className="min-w-56 flex-1">
            <CardTitle>{session.title ?? `Session #${session.id}`}</CardTitle>
            <CardDescription className="mt-1">
              {session.title ? `Session #${session.id} · ` : ""}
              {SCENARIO_LABELS[session.scenario]} · started{" "}
              {formatDateTime(session.startedAt)}
              {session.stoppedAt
                ? ` · stopped ${formatDateTime(session.stoppedAt)}`
                : ""}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Simulation mode</Badge>
            <SessionStateBadge state={session.state} />
            {running && showStop ? (
              <StopForm sessionId={session.id} />
            ) : null}
            {showDelete ? (
              <form action={deleteSessionAction}>
                <input type="hidden" name="sessionId" value={session.id} />
                <ConfirmButton
                  confirmMessage={`Delete ${session.title ? `“${session.title}”` : `session #${session.id}`}? Its readings and events will be removed.`}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" />
                  Delete
                </ConfirmButton>
              </form>
            ) : null}
          </div>
        </div>
        <CardContent className="space-y-3">
          {session.note ? (
            <p className="text-sm text-muted-foreground">{session.note}</p>
          ) : null}
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Scenario</dt>
              <dd>{SCENARIO_LABELS[session.scenario]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Source</dt>
              <dd>Simulated</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Readings</dt>
              <dd className="font-mono tabular-nums">
                {formatCount(session.readingCount, "reading")}
              </dd>
            </div>
          </dl>
          {running ? <LiveSession sessionId={session.id} /> : null}
          <div className="border-t pt-3">
            <SessionMetaForm session={session} />
          </div>
        </CardContent>
      </Card>

      {timeline.length > 0 ? <SessionReportCard report={report} /> : null}

      {canReplay ? <SessionReplay readings={timeline} /> : null}

      {latest && !canReplay ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <PvtCard pvt={latest.pvt} observedAt={latest.observedAt} />
            <ReceiverStatusCard reading={latest} />
          </div>
          <SatelliteTable satellites={latest.satellites} />
          <Cn0Chart readings={chart} />
        </>
      ) : null}

      {!latest ? (
        <Card size="sm">
          <CardContent className="py-6 text-sm text-muted-foreground">
            No readings yet. Start the session to record simulated data.
          </CardContent>
        </Card>
      ) : null}

      <ReadingHistory readings={history} />
      <EventList events={events} />
    </div>
  );
}
