import type {
  Pvt,
  PvtStatus,
  Quality,
  Reading,
  Satellite,
  Scenario,
  SessionState,
  TrackingStatus,
} from "./types";

const PRNS = [3, 7, 11, 15, 19, 23, 27, 31] as const;

const BASE_CN0: Record<number, number> = {
  3: 47,
  7: 45,
  11: 43,
  15: 41,
  19: 39,
  23: 37,
  27: 34,
  31: 32,
};

const ORIGIN = { lat: 51.5074, lon: -0.1278 };

// One radian of the path is about 61 m at this latitude. Each tick advances a
// little under 3.5°, which reads as a slow, steady walk on the track plot.
const PATH_LAT_RADIUS = 0.00055;
const PATH_STEP = 0.06;
const METRES_PER_DEGREE = 111_320;

function seedFor(sessionId: number, tick: number, scenario: Scenario): number {
  const text = `${sessionId}:${tick}:${scenario}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function qualityFor(cn0: number | null): Quality {
  if (cn0 === null) return "unusable";
  if (cn0 >= 42) return "strong";
  if (cn0 >= 36) return "good";
  if (cn0 >= 30) return "weak";
  return "unusable";
}

export function anomalyWindow(tick: number): boolean {
  return tick >= 4 && tick <= 6;
}

export function generateReading(input: {
  sessionId: number;
  tick: number;
  scenario: Scenario;
  observedAt: string;
  state: SessionState;
}): Reading {
  const { sessionId, tick, scenario, observedAt, state } = input;
  const random = mulberry32(seedFor(sessionId, tick, scenario));
  const anomaly = scenario === "anomaly" && anomalyWindow(tick);

  const satellites: Satellite[] = PRNS.map((prn) => {
    const jitter = (random() - 0.5) * 4;
    let cn0: number | null = Math.round((BASE_CN0[prn] + jitter) * 10) / 10;
    let status: TrackingStatus = "tracked";

    if (scenario === "weak-signal") {
      cn0 = Math.round((cn0 - 8) * 10) / 10;
      if (prn === 27 || prn === 31) {
        cn0 = null;
        status = "lost";
      }
    }

    if (anomaly && prn === 15) {
      cn0 = 22;
      status = "tracked";
    }

    const doppler =
      cn0 === null
        ? null
        : Math.round(prn * 97 + tick * 13 + (random() - 0.5) * 60 - 1800);

    return {
      prn,
      status,
      cn0,
      dopplerHz: doppler,
      quality: qualityFor(cn0),
    };
  });

  let pvtStatus: PvtStatus = "valid";
  if (scenario === "weak-signal") pvtStatus = "stale";
  if (anomaly) pvtStatus = "unavailable";

  const hasFix = pvtStatus !== "unavailable";
  const pathStart =
    ((seedFor(sessionId, 0, scenario) % 360) / 360) * Math.PI * 2;
  const angle = pathStart + tick * PATH_STEP;
  const lonRadius =
    PATH_LAT_RADIUS / Math.cos((ORIGIN.lat * Math.PI) / 180);
  const course = ((360 - ((angle * 180) / Math.PI) % 360) % 360 + 360) % 360;
  const speed =
    (PATH_LAT_RADIUS * PATH_STEP * METRES_PER_DEGREE) / 2 +
    Math.sin(angle * 3) * 0.08;

  const pvt: Pvt = {
    status: pvtStatus,
    lat: hasFix ? round(ORIGIN.lat + Math.sin(angle) * PATH_LAT_RADIUS, 6) : null,
    lon: hasFix ? round(ORIGIN.lon + Math.cos(angle) * lonRadius, 6) : null,
    altitudeM: hasFix
      ? round(31 + Math.sin(angle * 2) * 2.4 + (random() - 0.5) * 0.4, 1)
      : null,
    speedMps: hasFix ? round(speed, 2) : null,
    courseDeg: hasFix ? round(course, 1) : null,
  };

  return {
    id: 0,
    sessionId,
    observedAt,
    source: "simulated",
    receiverState: state,
    pvt,
    satellites,
    anomaly,
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
