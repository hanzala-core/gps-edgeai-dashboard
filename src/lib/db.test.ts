import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "gps-edgeai-test-"));
process.env.GPS_DB_PATH = join(directory, "test.db");

const db = await import("./db.ts");
const sim = await import("./simulator.ts");

after(() => {
  db.closeDatabase();
  rmSync(directory, { recursive: true, force: true });
});

function createUser(email: string) {
  return db.createUser({
    name: "Test Operator",
    email,
    passwordHash: "scrypt$test$test",
    createdAt: "2026-11-18T09:00:00.000Z",
  });
}

test("sessions and readings survive closing and reopening the database", () => {
  const user = createUser("persistence@example.com");
  const startedAt = "2026-11-18T10:00:00.000Z";
  const session = db.insertSession("nominal", "running", startedAt, user.id);
  db.addEvent(session.id, "session", "start", startedAt);

  const first = sim.generateReading({
    sessionId: session.id,
    tick: 1,
    scenario: "nominal",
    observedAt: "2026-11-18T10:00:01.000Z",
    state: "running",
  });
  const savedFirst = db.saveReading(first);

  const second = sim.generateReading({
    sessionId: session.id,
    tick: 2,
    scenario: "nominal",
    observedAt: "2026-11-18T10:00:03.000Z",
    state: "running",
  });
  db.saveReading(second);

  const stopped = db.stopSession(session.id, user.id);
  assert.equal(stopped?.state, "stopped");
  assert.ok(stopped?.stoppedAt);

  db.closeDatabase();

  const reopened = db.getSession(session.id, user.id);
  assert.equal(reopened?.state, "stopped");
  assert.equal(reopened?.readingCount, 2);
  assert.equal(reopened?.stoppedAt, stopped?.stoppedAt);

  const latest = db.getLatestReading(session.id);
  assert.equal(latest?.id, savedFirst.id + 1);
  assert.equal(latest?.receiverState, "stopped");
  assert.deepEqual(latest?.satellites, second.satellites);
  assert.deepEqual(latest?.pvt, second.pvt);

  const readings = db.getReadings(session.id);
  assert.equal(readings.length, 2);
  assert.equal(readings[1].id, savedFirst.id);

  const ordered = db.getSessionReadings(session.id);
  assert.equal(ordered[0].id, savedFirst.id);
  assert.equal(ordered[1].id, savedFirst.id + 1);

  const events = db.getEvents(session.id);
  assert.equal(events[0]?.message, "start");
  assert.match(
    events.at(-1)?.message ?? "",
    /Session stopped after 2 readings\./,
  );
});

test("stopping an already stopped session keeps the reading count fixed", () => {
  const user = createUser("stop@example.com");
  const startedAt = "2026-11-18T11:00:00.000Z";
  const session = db.insertSession(
    "weak-signal",
    "running",
    startedAt,
    user.id,
  );
  const reading = sim.generateReading({
    sessionId: session.id,
    tick: 1,
    scenario: "weak-signal",
    observedAt: "2026-11-18T11:00:02.000Z",
    state: "running",
  });
  db.saveReading(reading);
  db.stopSession(session.id, user.id);

  const before = db.getReadingCount(session.id);
  const result = db.stopSession(session.id, user.id);
  const after = db.getReadingCount(session.id);

  assert.equal(result?.state, "stopped");
  assert.equal(after, before);
  assert.equal(db.getSession(session.id, user.id)?.state, "stopped");
});

test("one user cannot read, stop, or delete another user's session", () => {
  const owner = createUser("owner@example.com");
  const other = createUser("other@example.com");
  const session = db.insertSession(
    "nominal",
    "running",
    "2026-11-18T12:00:00.000Z",
    owner.id,
  );

  assert.ok(db.getSession(session.id, owner.id));
  assert.equal(db.getSession(session.id, other.id), null);
  assert.equal(db.stopSession(session.id, other.id), null);
  assert.equal(db.getSession(session.id, owner.id)?.state, "running");

  assert.equal(db.deleteSession(session.id, other.id), false);
  assert.deepEqual(db.listSessions(other.id), []);
  assert.equal(db.listSessions(owner.id).length, 1);

  assert.equal(db.deleteSession(session.id, owner.id), true);
  assert.equal(db.getSession(session.id, owner.id), null);
});

test("deleting all sessions keeps other users' data", () => {
  const first = createUser("first@example.com");
  const second = createUser("second@example.com");

  db.insertSession("nominal", "stopped", "2026-11-18T13:00:00.000Z", first.id);
  db.insertSession("nominal", "stopped", "2026-11-18T13:01:00.000Z", first.id);
  db.insertSession("nominal", "stopped", "2026-11-18T13:02:00.000Z", second.id);

  assert.equal(db.deleteAllSessions(first.id), 2);
  assert.deepEqual(db.listSessions(first.id), []);
  assert.equal(db.listSessions(second.id).length, 1);

  const stats = db.getUserStats(second.id);
  assert.equal(stats.sessionCount, 1);
  assert.equal(stats.readingCount, 0);
});

test("session names and notes can be edited by their owner", () => {
  const owner = createUser("labels@example.com");
  const other = createUser("labels-other@example.com");

  const session = db.insertSession(
    "nominal",
    "stopped",
    "2026-11-18T14:00:00.000Z",
    owner.id,
    "2026-11-18T14:00:30.000Z",
  );
  assert.equal(session.title, null);
  assert.equal(session.note, null);

  const updated = db.updateSessionMeta(session.id, owner.id, {
    title: "  Rooftop check  ",
    note: "  Clear sky, steady fix.  ",
  });
  assert.equal(updated?.title, "Rooftop check");
  assert.equal(updated?.note, "Clear sky, steady fix.");

  const cleared = db.updateSessionMeta(session.id, owner.id, {
    title: "",
    note: "   ",
  });
  assert.equal(cleared?.title, null);
  assert.equal(cleared?.note, null);

  assert.equal(
    db.updateSessionMeta(session.id, other.id, {
      title: "Not mine",
      note: null,
    }),
    null,
  );
});

test("sessions can be searched by name, note, scenario, and number", () => {
  const user = createUser("search@example.com");
  const nominal = db.insertSession(
    "nominal",
    "stopped",
    "2026-11-18T15:00:00.000Z",
    user.id,
    null,
    "Rooftop check",
    "Steady all morning.",
  );
  const weak = db.insertSession(
    "weak-signal",
    "stopped",
    "2026-11-18T15:05:00.000Z",
    user.id,
    null,
    "Car park",
    "Two satellites dropped out.",
  );

  assert.deepEqual(
    db.searchSessions(user.id, { query: "rooftop" }).map((row) => row.id),
    [nominal.id],
  );
  assert.deepEqual(
    db.searchSessions(user.id, { query: "DROPPED" }).map((row) => row.id),
    [weak.id],
  );
  assert.deepEqual(
    db.searchSessions(user.id, { query: "weak" }).map((row) => row.id),
    [weak.id],
  );
  assert.deepEqual(
    db.searchSessions(user.id, { query: String(weak.id) }).map((row) => row.id),
    [weak.id],
  );
  assert.deepEqual(
    db
      .searchSessions(user.id, { scenario: "nominal", state: "stopped" })
      .map((row) => row.id),
    [nominal.id],
  );
  assert.equal(db.searchSessions(user.id, { query: "nothing here" }).length, 0);
});
