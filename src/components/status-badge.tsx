import { Badge } from "@/components/ui/badge";
import type { PvtStatus, Quality, SessionState } from "@/lib/types";

const sessionLabels: Record<SessionState, string> = {
  running: "Running",
  stopped: "Stopped",
  error: "Error",
};

const pvtLabels: Record<PvtStatus, string> = {
  valid: "Valid",
  stale: "Stale",
  unavailable: "Unavailable",
};

const qualityLabels: Record<Quality, string> = {
  strong: "Strong",
  good: "Good",
  weak: "Weak",
  unusable: "Unusable",
};

export function SessionStateBadge({ state }: { state: SessionState }) {
  const variant =
    state === "running"
      ? "default"
      : state === "error"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{sessionLabels[state]}</Badge>;
}

export function PvtStatusBadge({ status }: { status: PvtStatus }) {
  const variant =
    status === "unavailable"
      ? "destructive"
      : status === "stale"
        ? "outline"
        : "secondary";

  return <Badge variant={variant}>{pvtLabels[status]}</Badge>;
}

export function QualityBadge({ quality }: { quality: Quality }) {
  const variant =
    quality === "unusable"
      ? "destructive"
      : quality === "good"
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{qualityLabels[quality]}</Badge>;
}

export { qualityLabels };
