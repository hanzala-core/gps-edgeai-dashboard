import type { Reading, SessionRow } from "./types";

export type SessionVerdict =
  | "healthy"
  | "weak"
  | "anomaly"
  | "recording"
  | "empty";

export type Cn0Extreme = {
  prn: number;
  cn0: number;
};

export type SessionReport = {
  verdict: SessionVerdict;
  headline: string;
  summary: string;
  durationMs: number | null;
  readingCount: number;
  fixCount: number;
  averageCn0: number | null;
  bestCn0: Cn0Extreme | null;
  worstCn0: Cn0Extreme | null;
  lostPrns: number[];
  anomalyCount: number;
  anomalyWindow: { from: number; to: number } | null;
  recoveredAt: number | null;
};

const WEAK_AVERAGE_CN0 = 36;

export function buildSessionReport(
  session: SessionRow,
  readings: Reading[],
): SessionReport {
  if (readings.length === 0) {
    return {
      verdict: "empty",
      headline: "No readings recorded",
      summary:
        "Start a session and wait for the first reading to get a report.",
      durationMs: null,
      readingCount: 0,
      fixCount: 0,
      averageCn0: null,
      bestCn0: null,
      worstCn0: null,
      lostPrns: [],
      anomalyCount: 0,
      anomalyWindow: null,
      recoveredAt: null,
    };
  }

  const fixCount = readings.filter(
    (reading) => reading.pvt.status === "valid",
  ).length;

  const samples = readings.flatMap((reading) =>
    reading.satellites.flatMap((satellite) =>
      satellite.cn0 === null ? [] : [{ prn: satellite.prn, cn0: satellite.cn0 }],
    ),
  );

  const averageCn0 =
    samples.length === 0
      ? null
      : round(
          samples.reduce((sum, sample) => sum + sample.cn0, 0) / samples.length,
          1,
        );

  const bestCn0 =
    samples.length === 0
      ? null
      : samples.reduce((best, sample) => (sample.cn0 > best.cn0 ? sample : best));
  const worstCn0 =
    samples.length === 0
      ? null
      : samples.reduce((worst, sample) =>
          sample.cn0 < worst.cn0 ? sample : worst,
        );

  const lostPrns = [
    ...new Set(
      readings.flatMap((reading) =>
        reading.satellites
          .filter((satellite) => satellite.status === "lost")
          .map((satellite) => satellite.prn),
      ),
    ),
  ].sort((a, b) => a - b);

  const anomalyIndexes = readings.flatMap((reading, index) =>
    reading.anomaly ? [index] : [],
  );
  const anomalyWindow =
    anomalyIndexes.length === 0
      ? null
      : {
          from: anomalyIndexes[0] + 1,
          to: anomalyIndexes[anomalyIndexes.length - 1] + 1,
        };

  const recoveredAt =
    anomalyIndexes.length > 0 &&
    anomalyIndexes[anomalyIndexes.length - 1] + 1 < readings.length
      ? anomalyIndexes[anomalyIndexes.length - 1] + 2
      : null;

  const durationMs = sessionDuration(session, readings);

  if (anomalyWindow) {
    const weakest = weakestSatelliteInAnomaly(readings);
    const summary: string[] = [];

    if (weakest) {
      summary.push(
        `PRN ${weakest.prn} fell to ${formatCn0(weakest.cn0)} dB-Hz in ${describeWindow(anomalyWindow)}.`,
      );
    } else {
      summary.push(`An anomaly was recorded in ${describeWindow(anomalyWindow)}.`);
    }

    const unavailable = readings.filter(
      (reading) => reading.pvt.status === "unavailable",
    ).length;
    if (unavailable > 0) {
      summary.push(
        `The position fix was unavailable for ${unavailable} of them.`,
      );
    }

    summary.push(
      recoveredAt
        ? `The signal recovered by reading ${recoveredAt}.`
        : "The session ended while the anomaly was still active.",
    );

    return {
      verdict: "anomaly",
      headline: "Anomaly detected",
      summary: summary.join(" "),
      durationMs,
      readingCount: readings.length,
      fixCount,
      averageCn0,
      bestCn0,
      worstCn0,
      lostPrns,
      anomalyCount: anomalyIndexes.length,
      anomalyWindow,
      recoveredAt,
    };
  }

  if (session.state === "running") {
    return {
      verdict: "recording",
      headline: "Recording in progress",
      summary: `${readings.length} reading${readings.length === 1 ? "" : "s"} recorded so far. The final report appears once the session stops.`,
      durationMs,
      readingCount: readings.length,
      fixCount,
      averageCn0,
      bestCn0,
      worstCn0,
      lostPrns,
      anomalyCount: 0,
      anomalyWindow: null,
      recoveredAt: null,
    };
  }

  const averageIsWeak = averageCn0 !== null && averageCn0 < WEAK_AVERAGE_CN0;
  const fixIsIncomplete = fixCount < readings.length;

  if (lostPrns.length > 0 || averageIsWeak || fixIsIncomplete) {
    const details: string[] = [];

    if (lostPrns.length > 0) {
      details.push(
        `${lostPrns.length === 1 ? "One satellite" : `${lostPrns.length} satellites`} dropped out (PRN ${lostPrns.join(", ")}).`,
      );
    }

    if (fixIsIncomplete) {
      details.push(
        `A valid position fix was available in ${fixCount} of ${readings.length} readings.`,
      );
    }

    if (averageIsWeak) {
      details.push(
        `Average signal strength was ${formatCn0(averageCn0)} dB-Hz, below the ${WEAK_AVERAGE_CN0} dB-Hz threshold.`,
      );
    }

    return {
      verdict: "weak",
      headline: "Weak signal",
      summary: details.join(" "),
      durationMs,
      readingCount: readings.length,
      fixCount,
      averageCn0,
      bestCn0,
      worstCn0,
      lostPrns,
      anomalyCount: 0,
      anomalyWindow: null,
      recoveredAt: null,
    };
  }

  return {
    verdict: "healthy",
    headline: "Healthy run",
    summary: `A valid position fix was available in all ${readings.length} readings and no satellite dropped out.`,
    durationMs,
    readingCount: readings.length,
    fixCount,
    averageCn0,
    bestCn0,
    worstCn0,
    lostPrns,
    anomalyCount: 0,
    anomalyWindow: null,
    recoveredAt: null,
  };
}

function sessionDuration(
  session: SessionRow,
  readings: Reading[],
): number | null {
  const start = Date.parse(session.startedAt);
  const end = session.stoppedAt
    ? Date.parse(session.stoppedAt)
    : Date.parse(readings[readings.length - 1].observedAt);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }
  return end - start;
}

function weakestSatelliteInAnomaly(readings: Reading[]): Cn0Extreme | null {
  const samples = readings
    .filter((reading) => reading.anomaly)
    .flatMap((reading) =>
      reading.satellites.flatMap((satellite) =>
        satellite.cn0 === null
          ? []
          : [{ prn: satellite.prn, cn0: satellite.cn0 }],
      ),
    );

  if (samples.length === 0) return null;
  return samples.reduce((worst, sample) =>
    sample.cn0 < worst.cn0 ? sample : worst,
  );
}

function describeWindow(window: { from: number; to: number }): string {
  return window.from === window.to
    ? `reading ${window.from}`
    : `readings ${window.from}–${window.to}`;
}

function formatCn0(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
