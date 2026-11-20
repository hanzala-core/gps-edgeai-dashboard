import test from "node:test";
import assert from "node:assert/strict";
import { buildSessionReport } from "./report.ts";
import { generateReading } from "./simulator.ts";
import type { Reading, Scenario, SessionRow, SessionState } from "./types.ts";

const START = "2026-11-18T12:00:00.000Z";

function makeReadings(scenario: Scenario, count: number): Reading[] {
  return Array.from({ length: count }, (_, index) => {
    const tick = index + 1;
    return generateReading({
      sessionId: 1,
      tick,
      scenario,
      observedAt: new Date(Date.parse(START) + tick * 2000).toISOString(),
      state: "running",
    });
  });
}

function makeSession(
  scenario: Scenario,
  state: SessionState,
  count: number,
): SessionRow {
  return {
    id: 1,
    scenario,
    state,
    startedAt: START,
    stoppedAt:
      state === "stopped"
        ? new Date(Date.parse(START) + count * 2000).toISOString()
        : null,
    readingCount: count,
    title: null,
    note: null,
  };
}

test("a nominal session is reported as healthy", () => {
  const readings = makeReadings("nominal", 6);
  const report = buildSessionReport(makeSession("nominal", "stopped", 6), readings);

  assert.equal(report.verdict, "healthy");
  assert.equal(report.headline, "Healthy run");
  assert.equal(report.fixCount, 6);
  assert.equal(report.readingCount, 6);
  assert.deepEqual(report.lostPrns, []);
  assert.equal(report.anomalyCount, 0);
  assert.equal(report.durationMs, 12000);
  assert.ok(report.averageCn0 !== null && report.averageCn0 > 36);
  assert.ok(
    report.bestCn0 !== null &&
      report.worstCn0 !== null &&
      report.bestCn0.cn0 > report.worstCn0.cn0,
  );
  assert.match(report.summary, /all 6 readings/);
});

test("a weak-signal session names the lost satellites and the fix gap", () => {
  const readings = makeReadings("weak-signal", 4);
  const report = buildSessionReport(
    makeSession("weak-signal", "stopped", 4),
    readings,
  );

  assert.equal(report.verdict, "weak");
  assert.equal(report.headline, "Weak signal");
  assert.equal(report.fixCount, 0);
  assert.deepEqual(report.lostPrns, [27, 31]);
  assert.match(report.summary, /PRN 27, 31/);
  assert.match(report.summary, /0 of 4 readings/);
  assert.match(report.summary, /threshold/);
});

test("an anomaly session reports the window, satellite, and recovery", () => {
  const readings = makeReadings("anomaly", 7);
  const report = buildSessionReport(
    makeSession("anomaly", "stopped", 7),
    readings,
  );

  assert.equal(report.verdict, "anomaly");
  assert.equal(report.headline, "Anomaly detected");
  assert.equal(report.anomalyCount, 3);
  assert.deepEqual(report.anomalyWindow, { from: 4, to: 6 });
  assert.equal(report.recoveredAt, 7);
  assert.equal(report.fixCount, 4);
  assert.match(report.summary, /PRN 15 fell to 22 dB-Hz/);
  assert.match(report.summary, /readings 4–6/);
  assert.match(report.summary, /unavailable for 3 of them/);
  assert.match(report.summary, /recovered by reading 7/);
});

test("an anomaly that is still active when the session ends is reported as unresolved", () => {
  const readings = makeReadings("anomaly", 4);
  const report = buildSessionReport(
    makeSession("anomaly", "stopped", 4),
    readings,
  );

  assert.deepEqual(report.anomalyWindow, { from: 4, to: 4 });
  assert.equal(report.recoveredAt, null);
  assert.match(report.summary, /reading 4/);
  assert.match(report.summary, /still active/);
});

test("a running session is reported as recording, not finished", () => {
  const readings = makeReadings("nominal", 3);
  const report = buildSessionReport(
    makeSession("nominal", "running", 3),
    readings,
  );

  assert.equal(report.verdict, "recording");
  assert.equal(report.headline, "Recording in progress");
  assert.match(report.summary, /3 readings recorded so far/);
});

test("a session without readings gets an empty report", () => {
  const report = buildSessionReport(makeSession("nominal", "running", 0), []);

  assert.equal(report.verdict, "empty");
  assert.equal(report.readingCount, 0);
  assert.equal(report.averageCn0, null);
  assert.equal(report.durationMs, null);
});
