export type Scenario = "nominal" | "weak-signal" | "anomaly";

export const SCENARIOS: ReadonlyArray<{ value: Scenario; label: string }> = [
  { value: "nominal", label: "Nominal" },
  { value: "weak-signal", label: "Weak signal" },
  { value: "anomaly", label: "Satellite anomaly" },
];

export const SCENARIO_LABELS: Record<Scenario, string> = {
  nominal: "Nominal",
  "weak-signal": "Weak signal",
  anomaly: "Satellite anomaly",
};

export const SCENARIO_DESCRIPTIONS: Record<Scenario, string> = {
  nominal: "Healthy signal and a reliable position fix.",
  "weak-signal": "Lower signal strength and an outdated fix.",
  anomaly: "A satellite fails mid-session and raises an alert.",
};

export function isScenario(value: string): value is Scenario {
  return value === "nominal" || value === "weak-signal" || value === "anomaly";
}

export type SessionState = "running" | "stopped" | "error";

export type PvtStatus = "valid" | "stale" | "unavailable";

export type TrackingStatus = "tracked" | "searching" | "lost";

export type Quality = "strong" | "good" | "weak" | "unusable";

export type Satellite = {
  prn: number;
  status: TrackingStatus;
  cn0: number | null;
  dopplerHz: number | null;
  quality: Quality;
};

export type Pvt = {
  status: PvtStatus;
  lat: number | null;
  lon: number | null;
  altitudeM: number | null;
  speedMps: number | null;
  courseDeg: number | null;
};

export type Reading = {
  id: number;
  sessionId: number;
  observedAt: string;
  source: "simulated";
  receiverState: SessionState;
  pvt: Pvt;
  satellites: Satellite[];
  anomaly: boolean;
};

export type SessionRow = {
  id: number;
  scenario: Scenario;
  state: SessionState;
  startedAt: string;
  stoppedAt: string | null;
  readingCount: number;
  title: string | null;
  note: string | null;
};

export type EventKind = "session" | "alert" | "error";

export type SessionEvent = {
  id: number;
  observedAt: string;
  kind: EventKind;
  message: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export type UserStats = {
  sessionCount: number;
  readingCount: number;
  runningCount: number;
  lastSessionAt: string | null;
};

export type FormState = {
  error?: string;
  success?: string;
};
