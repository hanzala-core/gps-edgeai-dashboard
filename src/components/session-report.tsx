import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionReport, SessionVerdict } from "@/lib/report";

const verdictLabels: Record<SessionVerdict, string> = {
  healthy: "Healthy",
  weak: "Weak signal",
  anomaly: "Anomaly",
  recording: "Recording",
  empty: "No data",
};

function verdictVariant(
  verdict: SessionVerdict,
): "default" | "secondary" | "destructive" | "outline" {
  if (verdict === "anomaly") return "destructive";
  if (verdict === "weak") return "outline";
  if (verdict === "recording") return "default";
  return "secondary";
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return "—";

  const totalSeconds = Math.round(durationMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds} s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min${seconds === 0 ? "" : ` ${seconds} s`}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm tabular-nums">{value}</dd>
    </div>
  );
}

export function SessionReportCard({ report }: { report: SessionReport }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Session report</CardTitle>
        <CardDescription>
          A plain summary of what the receiver recorded. No external analysis.
        </CardDescription>
        <CardAction>
          <Badge variant={verdictVariant(report.verdict)}>
            {verdictLabels[report.verdict]}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{report.headline}</p>
          <p
            className={
              report.verdict === "anomaly"
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {report.summary}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
          <Metric label="Readings" value={String(report.readingCount)} />
          <Metric label="Duration" value={formatDuration(report.durationMs)} />
          <Metric
            label="Valid fixes"
            value={`${report.fixCount} of ${report.readingCount}`}
          />
          <Metric
            label="Average C/N₀"
            value={
              report.averageCn0 === null
                ? "—"
                : `${report.averageCn0.toFixed(1)} dB-Hz`
            }
          />
          <Metric
            label="Best satellite"
            value={
              report.bestCn0 === null
                ? "—"
                : `PRN ${report.bestCn0.prn} · ${report.bestCn0.cn0.toFixed(1)}`
            }
          />
          <Metric
            label="Weakest satellite"
            value={
              report.worstCn0 === null
                ? "—"
                : `PRN ${report.worstCn0.prn} · ${report.worstCn0.cn0.toFixed(1)}`
            }
          />
          <Metric
            label="Lost satellites"
            value={
              report.lostPrns.length === 0
                ? "None"
                : `PRN ${report.lostPrns.join(", ")}`
            }
          />
          <Metric
            label="Anomaly readings"
            value={report.anomalyCount === 0 ? "None" : String(report.anomalyCount)}
          />
        </dl>
      </CardContent>
    </Card>
  );
}
