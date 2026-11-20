import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const directory = mkdtempSync(join(tmpdir(), "gps-edgeai-partial-test-"));
const file = join(directory, "partial.db");

// A database that claims to be on the current schema version but is missing the
// session name and note columns. This can happen when a development server
// keeps a connection open across a schema change.
const partial = new DatabaseSync(file);
partial.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scenario TEXT NOT NULL,
    state TEXT NOT NULL,
    started_at TEXT NOT NULL,
    stopped_at TEXT,
    reading_count INTEGER NOT NULL DEFAULT 0
  );

  INSERT INTO users (id, email, name, password_hash, created_at)
    VALUES (1, 'partial@example.com', 'Partial Operator', 'scrypt$test$test',
            '2026-11-18T09:00:00.000Z');

  INSERT INTO sessions (id, user_id, scenario, state, started_at, reading_count)
    VALUES (1, 1, 'nominal', 'stopped', '2026-11-18T10:00:00.000Z', 0);

  PRAGMA user_version = 3;
`);
partial.close();

process.env.GPS_DB_PATH = file;

const db = await import("./db.ts");

after(() => {
  db.closeDatabase();
  rmSync(directory, { recursive: true, force: true });
});

test("a database marked current but missing columns repairs itself", () => {
  const updated = db.updateSessionMeta(1, 1, {
    title: "Recovered session",
    note: "The missing columns were added on open.",
  });

  assert.equal(updated?.title, "Recovered session");
  assert.equal(updated?.note, "The missing columns were added on open.");

  assert.deepEqual(
    db.searchSessions(1, { query: "recovered" }).map((row) => row.id),
    [1],
  );

  const check = new DatabaseSync(file);
  const columns = check
    .prepare("PRAGMA table_info(sessions)")
    .all() as Array<{ name: string }>;
  const version = check.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };

  assert.ok(columns.some((column) => column.name === "title"));
  assert.ok(columns.some((column) => column.name === "note"));
  assert.equal(version.user_version, 3);
  check.close();
});
