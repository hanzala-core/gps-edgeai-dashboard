import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const directory = mkdtempSync(join(tmpdir(), "gps-edgeai-migration-test-"));
const file = join(directory, "legacy.db");

// A database from before the account layer existed: no users table and no
// sessions.user_id column.
const legacy = new DatabaseSync(file);
legacy.exec(`
  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario TEXT NOT NULL,
    state TEXT NOT NULL,
    started_at TEXT NOT NULL,
    stopped_at TEXT,
    reading_count INTEGER NOT NULL DEFAULT 0
  );

  INSERT INTO sessions (scenario, state, started_at, reading_count)
    VALUES ('nominal', 'stopped', '2026-01-01T00:00:00.000Z', 0);
`);
legacy.close();

process.env.GPS_DB_PATH = file;

const db = await import("./db.ts");

after(() => {
  db.closeDatabase();
  rmSync(directory, { recursive: true, force: true });
});

test("a database created before accounts is migrated on first use", () => {
  const user = db.createUser({
    name: "Migrated Operator",
    email: "migrated@example.com",
    passwordHash: "scrypt$test$test",
    createdAt: "2026-11-18T09:00:00.000Z",
  });

  assert.equal(db.getUserByEmail("migrated@example.com")?.user.id, user.id);

  const session = db.insertSession(
    "nominal",
    "running",
    "2026-11-18T10:00:00.000Z",
    user.id,
  );
  assert.ok(db.getSession(session.id, user.id));
  assert.deepEqual(
    db.listSessions(user.id).map((row) => row.id),
    [session.id],
  );

  // The legacy row has no owner, so it stays invisible to the new account.
  assert.equal(db.listSessions(user.id).length, 1);
});

test("migration records the schema version and adds the owner and note columns", () => {
  const check = new DatabaseSync(file);
  const columns = check
    .prepare("PRAGMA table_info(sessions)")
    .all() as Array<{ name: string }>;
  const version = check.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };

  assert.ok(columns.some((column) => column.name === "user_id"));
  assert.ok(columns.some((column) => column.name === "title"));
  assert.ok(columns.some((column) => column.name === "note"));
  assert.equal(version.user_version, 3);
  check.close();
});
