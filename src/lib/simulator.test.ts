import test from "node:test";
import assert from "node:assert/strict";
import { generateReading, qualityFor } from "./simulator.ts";

const base = {
  sessionId: 1,
  observedAt: "2026-11-18T12:00:00.000Z",
  state: "running" as const,
};

test("the same session, scenario, and tick produce the same reading", () => {
  const first = generateReading({ ...base, tick: 5, scenario: "nominal" });
  const second = generateReading({ ...base, tick: 5, scenario: "nominal" });

  assert.deepEqual(first, second);
});

test("a different tick produces different measurements", () => {
  const first = generateReading({ ...base, tick: 2, scenario: "nominal" });
  const second = generateReading({ ...base, tick: 3, scenario: "nominal" });

  assert.notDeepEqual(first.satellites, second.satellites);
});

test("the anomaly scenario degrades PRN 15 for ticks 4 to 6", () => {
  const reading = generateReading({ ...base, tick: 4, scenario: "anomaly" });
  const prn15 = reading.satellites.find((satellite) => satellite.prn === 15);

  assert.equal(reading.anomaly, true);
  assert.equal(prn15?.cn0, 22);
  assert.equal(prn15?.quality, "unusable");
  assert.equal(reading.pvt.status, "unavailable");

  const later = generateReading({ ...base, tick: 7, scenario: "anomaly" });
  assert.equal(later.anomaly, false);
  assert.equal(later.pvt.status, "valid");
});

test("the weak-signal scenario loses two satellites and reports a stale fix", () => {
  const reading = generateReading({ ...base, tick: 2, scenario: "weak-signal" });
  const lost = reading.satellites.filter(
    (satellite) => satellite.status === "lost",
  );

  assert.equal(reading.pvt.status, "stale");
  assert.equal(lost.length, 2);
  assert.ok(lost.every((satellite) => satellite.cn0 === null));
});

test("quality classes follow the documented thresholds", () => {
  assert.equal(qualityFor(null), "unusable");
  assert.equal(qualityFor(45), "strong");
  assert.equal(qualityFor(40), "good");
  assert.equal(qualityFor(33), "weak");
  assert.equal(qualityFor(29), "unusable");
});

function distanceMetres(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const meanLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const north = (b.lat - a.lat) * 111_320;
  const east = (b.lon - a.lon) * 111_320 * Math.cos(meanLat);
  return Math.hypot(north, east);
}

test("a nominal session walks a smooth track instead of jittering", () => {
  const readings = [1, 2, 3, 4, 5].map((tick) =>
    generateReading({ ...base, tick, scenario: "nominal" }),
  );

  for (const reading of readings) {
    assert.equal(reading.pvt.status, "valid");
    assert.ok(reading.pvt.lat !== null && reading.pvt.lon !== null);
    assert.ok((reading.pvt.speedMps ?? 0) > 0.5);
    assert.ok((reading.pvt.speedMps ?? 0) < 3);
  }

  for (let index = 1; index < readings.length; index += 1) {
    const previous = readings[index - 1].pvt;
    const current = readings[index].pvt;
    assert.ok(previous.lat !== null && previous.lon !== null);
    assert.ok(current.lat !== null && current.lon !== null);

    const moved = distanceMetres(
      { lat: previous.lat, lon: previous.lon },
      { lat: current.lat, lon: current.lon },
    );
    assert.ok(moved > 0.5 && moved < 10, `moved ${moved.toFixed(2)} m`);

    const turn = Math.abs(
      ((current.courseDeg ?? 0) - (previous.courseDeg ?? 0) + 540) % 360 - 180,
    );
    assert.ok(turn < 20, `turned ${turn.toFixed(1)}°`);
  }
});
