import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "gps-edgeai-demo-test-"));
process.env.GPS_DB_PATH = join(directory, "demo.db");

const db = await import("./db.ts");
const demo = await import("./demo.ts");
const { verifyPassword } = await import("./password.ts");

after(() => {
  db.closeDatabase();
  rmSync(directory, { recursive: true, force: true });
});

test("the demo account is created with sample sessions exactly once", async () => {
  const user = await demo.ensureDemoUser();
  assert.equal(user.email, demo.DEMO_EMAIL);
  assert.equal(user.name, "Demo Operator");

  const credentials = db.getUserByEmail(demo.DEMO_EMAIL);
  assert.ok(credentials);
  assert.equal(
    await verifyPassword(demo.DEMO_PASSWORD, credentials.passwordHash),
    true,
  );

  const sessions = db.listSessions(user.id);
  assert.equal(sessions.length, 3);
  assert.ok(sessions.every((session) => session.state === "stopped"));
  assert.ok(sessions.every((session) => session.title && session.note));
  assert.deepEqual(
    sessions.map((session) => session.scenario).sort(),
    ["anomaly", "nominal", "weak-signal"],
  );

  const stats = db.getUserStats(user.id);
  assert.equal(stats.readingCount, 30);

  const again = await demo.ensureDemoUser();
  assert.equal(again.id, user.id);
  assert.equal(db.listSessions(user.id).length, 3);
});

test("the anomaly sample includes its alert event", () => {
  const credentials = db.getUserByEmail(demo.DEMO_EMAIL);
  assert.ok(credentials);

  const anomaly = db
    .listSessions(credentials.user.id)
    .find((session) => session.scenario === "anomaly");
  assert.ok(anomaly);

  const events = db.getEvents(anomaly.id);
  assert.ok(events.some((event) => event.kind === "alert"));
});
