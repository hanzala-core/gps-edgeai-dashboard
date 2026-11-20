import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  EventKind,
  Reading,
  Satellite,
  Scenario,
  SessionEvent,
  SessionRow,
  SessionState,
  User,
  UserStats,
} from "./types";

type SessionDbRow = {
  id: number;
  user_id: number | null;
  scenario: Scenario;
  state: SessionState;
  started_at: string;
  stopped_at: string | null;
  reading_count: number;
  title: string | null;
  note: string | null;
};

type ReadingDbRow = {
  id: number;
  session_id: number;
  observed_at: string;
  source: "simulated";
  receiver_state: SessionState;
  pvt_status: Reading["pvt"]["status"];
  pvt_lat: number | null;
  pvt_lon: number | null;
  pvt_altitude_m: number | null;
  pvt_speed_mps: number | null;
  pvt_course_deg: number | null;
  satellites: string;
  anomaly: number;
};

type EventDbRow = {
  id: number;
  observed_at: string;
  kind: EventKind;
  message: string;
};

type UserDbRow = {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

const globalForDb = globalThis as typeof globalThis & {
  __gpsEdgeAiDb?: DatabaseSync;
};

const SCHEMA_VERSION = 3;

function ensureSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx
      ON users (email COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS auth_sessions_user_idx
      ON auth_sessions(user_id);

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      scenario TEXT NOT NULL CHECK (scenario IN ('nominal', 'weak-signal', 'anomaly')),
      state TEXT NOT NULL CHECK (state IN ('running', 'stopped', 'error')),
      started_at TEXT NOT NULL,
      stopped_at TEXT,
      reading_count INTEGER NOT NULL DEFAULT 0,
      title TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      observed_at TEXT NOT NULL,
      source TEXT NOT NULL,
      receiver_state TEXT NOT NULL,
      pvt_status TEXT NOT NULL,
      pvt_lat REAL,
      pvt_lon REAL,
      pvt_altitude_m REAL,
      pvt_speed_mps REAL,
      pvt_course_deg REAL,
      satellites TEXT NOT NULL,
      anomaly INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS readings_session_idx
      ON readings(session_id, id);

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      observed_at TEXT NOT NULL,
      kind TEXT NOT NULL,
      message TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS events_session_idx
      ON events(session_id, id);
  `);

  if (!hasColumn(database, "sessions", "user_id")) {
    database.exec(
      "ALTER TABLE sessions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;",
    );
  }

  if (!hasColumn(database, "sessions", "title")) {
    database.exec("ALTER TABLE sessions ADD COLUMN title TEXT;");
  }

  if (!hasColumn(database, "sessions", "note")) {
    database.exec("ALTER TABLE sessions ADD COLUMN note TEXT;");
  }

  database.exec(
    "CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id, id);",
  );

  database.exec(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

function openDatabase(): DatabaseSync {
  const file =
    process.env.GPS_DB_PATH ?? join(process.cwd(), "data", "gps-edgeai.db");

  if (file !== ":memory:") {
    mkdirSync(dirname(file), { recursive: true });
  }

  const database = new DatabaseSync(file);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  return database;
}

function hasColumn(
  database: DatabaseSync,
  table: string,
  column: string,
): boolean {
  const rows = database
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
}

const verifiedDatabases = new WeakSet<DatabaseSync>();

function db(): DatabaseSync {
  if (!globalForDb.__gpsEdgeAiDb) {
    globalForDb.__gpsEdgeAiDb = openDatabase();
  }

  // Re-check the schema once per loaded copy of this module. The global handle
  // survives hot reloads, so this also repairs a database that was opened by an
  // older build before the current migration ran.
  if (!verifiedDatabases.has(globalForDb.__gpsEdgeAiDb)) {
    ensureSchema(globalForDb.__gpsEdgeAiDb);
    verifiedDatabases.add(globalForDb.__gpsEdgeAiDb);
  }

  return globalForDb.__gpsEdgeAiDb;
}

export function closeDatabase(): void {
  if (globalForDb.__gpsEdgeAiDb) {
    globalForDb.__gpsEdgeAiDb.close();
    delete globalForDb.__gpsEdgeAiDb;
  }
}

function toUser(row: UserDbRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

function toSession(row: SessionDbRow): SessionRow {
  return {
    id: row.id,
    scenario: row.scenario,
    state: row.state,
    startedAt: row.started_at,
    stoppedAt: row.stopped_at,
    readingCount: row.reading_count,
    title: row.title ?? null,
    note: row.note ?? null,
  };
}

function toReading(row: ReadingDbRow): Reading {
  return {
    id: row.id,
    sessionId: row.session_id,
    observedAt: row.observed_at,
    source: row.source,
    receiverState: row.receiver_state,
    pvt: {
      status: row.pvt_status,
      lat: row.pvt_lat,
      lon: row.pvt_lon,
      altitudeM: row.pvt_altitude_m,
      speedMps: row.pvt_speed_mps,
      courseDeg: row.pvt_course_deg,
    },
    satellites: parseSatellites(row.satellites),
    anomaly: row.anomaly === 1,
  };
}

function parseSatellites(value: string): Satellite[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Satellite[]) : [];
  } catch {
    return [];
  }
}

/* Users */

export function getUserById(id: number): User | null {
  const row = db()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as UserDbRow | undefined;
  return row ? toUser(row) : null;
}

export function getUserByEmail(
  email: string,
): { user: User; passwordHash: string } | null {
  const row = db()
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.trim()) as UserDbRow | undefined;
  return row ? { user: toUser(row), passwordHash: row.password_hash } : null;
}

export function isEmailTaken(email: string, excludeUserId?: number): boolean {
  const row = db()
    .prepare(
      "SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ? LIMIT 1",
    )
    .get(email.trim(), excludeUserId ?? -1) as { id: number } | undefined;
  return row !== undefined;
}

export function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  createdAt?: string;
}): User {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const info = db()
    .prepare(
      "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(input.name, input.email.trim(), input.passwordHash, createdAt);

  return {
    id: Number(info.lastInsertRowid),
    name: input.name,
    email: input.email.trim(),
    createdAt,
  };
}

export function updateUserProfile(
  id: number,
  input: { name: string; email: string },
): User | null {
  db()
    .prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")
    .run(input.name, input.email.trim(), id);
  return getUserById(id);
}

export function updateUserPassword(id: number, passwordHash: string): void {
  db()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(passwordHash, id);
}

export function getUserPasswordHash(id: number): string | null {
  const row = db()
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(id) as { password_hash: string } | undefined;
  return row?.password_hash ?? null;
}

/* Authentication sessions */

export function createAuthSession(input: {
  tokenHash: string;
  userId: number;
  createdAt: string;
  expiresAt: string;
}): void {
  db()
    .prepare(
      "INSERT INTO auth_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    )
    .run(input.tokenHash, input.userId, input.createdAt, input.expiresAt);
}

export function getAuthSessionUser(
  tokenHash: string,
  now = new Date().toISOString(),
): User | null {
  const row = db()
    .prepare(
      `SELECT users.* FROM auth_sessions
       JOIN users ON users.id = auth_sessions.user_id
       WHERE auth_sessions.token_hash = ? AND auth_sessions.expires_at > ?`,
    )
    .get(tokenHash, now) as UserDbRow | undefined;
  return row ? toUser(row) : null;
}

export function deleteAuthSession(tokenHash: string): void {
  db()
    .prepare("DELETE FROM auth_sessions WHERE token_hash = ?")
    .run(tokenHash);
}

export function deleteExpiredAuthSessions(
  now = new Date().toISOString(),
): void {
  db()
    .prepare("DELETE FROM auth_sessions WHERE expires_at <= ?")
    .run(now);
}

export function deleteUserAuthSessions(userId: number): void {
  db()
    .prepare("DELETE FROM auth_sessions WHERE user_id = ?")
    .run(userId);
}

/* Sessions */

export function getRunningSession(userId: number): SessionRow | null {
  const row = db()
    .prepare(
      "SELECT * FROM sessions WHERE user_id = ? AND state = 'running' ORDER BY id DESC LIMIT 1",
    )
    .get(userId) as SessionDbRow | undefined;
  return row ? toSession(row) : null;
}

export function getLatestSession(userId: number): SessionRow | null {
  const row = db()
    .prepare(
      "SELECT * FROM sessions WHERE user_id = ? ORDER BY id DESC LIMIT 1",
    )
    .get(userId) as SessionDbRow | undefined;
  return row ? toSession(row) : null;
}

export function getSession(id: number, userId: number): SessionRow | null {
  const row = db()
    .prepare("SELECT * FROM sessions WHERE id = ? AND user_id = ?")
    .get(id, userId) as SessionDbRow | undefined;
  return row ? toSession(row) : null;
}

export function listSessions(userId: number, limit = 100): SessionRow[] {
  const rows = db()
    .prepare(
      "SELECT * FROM sessions WHERE user_id = ? ORDER BY id DESC LIMIT ?",
    )
    .all(userId, limit) as SessionDbRow[];
  return rows.map(toSession);
}

export type SessionSearch = {
  query?: string;
  scenario?: Scenario | null;
  state?: SessionState | null;
  limit?: number;
};

export function searchSessions(
  userId: number,
  filters: SessionSearch = {},
): SessionRow[] {
  const clauses = ["user_id = ?"];
  const params: Array<string | number> = [userId];

  if (filters.scenario) {
    clauses.push("scenario = ?");
    params.push(filters.scenario);
  }

  if (filters.state) {
    clauses.push("state = ?");
    params.push(filters.state);
  }

  const query = filters.query?.trim().toLowerCase();
  if (query) {
    clauses.push(`(
      instr(lower(COALESCE(title, '')), ?) > 0
      OR instr(lower(COALESCE(note, '')), ?) > 0
      OR instr(lower(scenario), ?) > 0
      OR CAST(id AS TEXT) = ?
    )`);
    params.push(query, query, query, query);
  }

  params.push(filters.limit ?? 100);

  const rows = db()
    .prepare(
      `SELECT * FROM sessions WHERE ${clauses.join(" AND ")} ORDER BY id DESC LIMIT ?`,
    )
    .all(...params) as SessionDbRow[];
  return rows.map(toSession);
}

export function insertSession(
  scenario: Scenario,
  state: SessionState,
  startedAt: string,
  userId: number,
  stoppedAt: string | null = null,
  title: string | null = null,
  note: string | null = null,
): SessionRow {
  const info = db()
    .prepare(
      `INSERT INTO sessions (
        scenario, state, started_at, user_id, stopped_at, title, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(scenario, state, startedAt, userId, stoppedAt, title, note);
  return {
    id: Number(info.lastInsertRowid),
    scenario,
    state,
    startedAt,
    stoppedAt,
    readingCount: 0,
    title,
    note,
  };
}

export function updateSessionMeta(
  id: number,
  userId: number,
  input: { title: string | null; note: string | null },
): SessionRow | null {
  const info = db()
    .prepare(
      "UPDATE sessions SET title = ?, note = ? WHERE id = ? AND user_id = ?",
    )
    .run(trimToNull(input.title), trimToNull(input.note), id, userId);
  return Number(info.changes) > 0 ? getSession(id, userId) : null;
}

function trimToNull(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function stopSession(
  id: number,
  userId: number,
  stoppedAt = new Date().toISOString(),
): SessionRow | null {
  const session = getSession(id, userId);
  if (!session || session.state !== "running") return session;

  const count = getReadingCount(id);
  db()
    .prepare(
      "UPDATE sessions SET state = 'stopped', stopped_at = ? WHERE id = ? AND user_id = ?",
    )
    .run(stoppedAt, id, userId);

  db()
    .prepare(
      `UPDATE readings SET receiver_state = 'stopped'
       WHERE id = (SELECT id FROM readings WHERE session_id = ? ORDER BY id DESC LIMIT 1)`,
    )
    .run(id);

  addEvent(
    id,
    "session",
    `Session stopped after ${count} reading${count === 1 ? "" : "s"}.`,
    stoppedAt,
  );

  return getSession(id, userId);
}

export function deleteSession(id: number, userId: number): boolean {
  const info = db()
    .prepare("DELETE FROM sessions WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return Number(info.changes) > 0;
}

export function deleteAllSessions(userId: number): number {
  const info = db()
    .prepare("DELETE FROM sessions WHERE user_id = ?")
    .run(userId);
  return Number(info.changes);
}

export function getUserStats(userId: number): UserStats {
  const row = db()
    .prepare(
      `SELECT
         COUNT(*) AS session_count,
         COALESCE(SUM(reading_count), 0) AS reading_count,
         COALESCE(SUM(CASE WHEN state = 'running' THEN 1 ELSE 0 END), 0) AS running_count,
         MAX(started_at) AS last_session_at
       FROM sessions WHERE user_id = ?`,
    )
    .get(userId) as {
    session_count: number;
    reading_count: number;
    running_count: number;
    last_session_at: string | null;
  };

  return {
    sessionCount: row.session_count,
    readingCount: row.reading_count,
    runningCount: row.running_count,
    lastSessionAt: row.last_session_at,
  };
}

/* Readings and events */

export function saveReading(reading: Reading): Reading {
  const info = db()
    .prepare(
      `INSERT INTO readings (
        session_id, observed_at, source, receiver_state, pvt_status,
        pvt_lat, pvt_lon, pvt_altitude_m, pvt_speed_mps, pvt_course_deg,
        satellites, anomaly
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      reading.sessionId,
      reading.observedAt,
      reading.source,
      reading.receiverState,
      reading.pvt.status,
      reading.pvt.lat,
      reading.pvt.lon,
      reading.pvt.altitudeM,
      reading.pvt.speedMps,
      reading.pvt.courseDeg,
      JSON.stringify(reading.satellites),
      reading.anomaly ? 1 : 0,
    );

  db()
    .prepare("UPDATE sessions SET reading_count = reading_count + 1 WHERE id = ?")
    .run(reading.sessionId);

  return { ...reading, id: Number(info.lastInsertRowid) };
}

export function getReadingCount(sessionId: number): number {
  const row = db()
    .prepare("SELECT reading_count FROM sessions WHERE id = ?")
    .get(sessionId) as { reading_count: number } | undefined;
  return row?.reading_count ?? 0;
}

export function getLatestReading(sessionId: number): Reading | null {
  const row = db()
    .prepare(
      "SELECT * FROM readings WHERE session_id = ? ORDER BY id DESC LIMIT 1",
    )
    .get(sessionId) as ReadingDbRow | undefined;
  return row ? toReading(row) : null;
}

export function getReadings(sessionId: number, limit = 50): Reading[] {
  const rows = db()
    .prepare(
      "SELECT * FROM readings WHERE session_id = ? ORDER BY id DESC LIMIT ?",
    )
    .all(sessionId, limit) as ReadingDbRow[];
  return rows.map(toReading);
}

export function getChartReadings(sessionId: number, limit = 40): Reading[] {
  return getReadings(sessionId, limit).reverse();
}

export function getSessionReadings(
  sessionId: number,
  limit = 500,
): Reading[] {
  const rows = db()
    .prepare(
      `SELECT * FROM (
         SELECT * FROM readings WHERE session_id = ? ORDER BY id DESC LIMIT ?
       ) ORDER BY id ASC`,
    )
    .all(sessionId, limit) as ReadingDbRow[];
  return rows.map(toReading);
}

export function addEvent(
  sessionId: number,
  kind: EventKind,
  message: string,
  observedAt = new Date().toISOString(),
): void {
  db()
    .prepare(
      "INSERT INTO events (session_id, observed_at, kind, message) VALUES (?, ?, ?, ?)",
    )
    .run(sessionId, observedAt, kind, message);
}

export function getEvents(sessionId: number, limit = 100): SessionEvent[] {
  const rows = db()
    .prepare(
      "SELECT * FROM events WHERE session_id = ? ORDER BY id ASC LIMIT ?",
    )
    .all(sessionId, limit) as EventDbRow[];
  return rows.map((row) => ({
    id: row.id,
    observedAt: row.observed_at,
    kind: row.kind,
    message: row.message,
  }));
}
