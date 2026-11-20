# GPS-EdgeAI Dashboard

A local-first dashboard for simulated GPS receiver sessions. It gives a
non-technical operator a clear view of receiver state, position, satellite
health, and history, with a small account layer so the app feels like a complete
product.

Everything is simulated. No GPS receiver, radio hardware, FPGA, or external
model is connected.

## What is included

- **Accounts** — register, sign in, sign out, edit your profile, and change your
  password.
- **Demo workspace** — one click opens a prepared account with three sample
  sessions and an anomaly alert.
- **Sessions** — start a live run, stop it, review it later, delete one session,
  or clear the whole workspace.
- **Replay** — step or play through a finished session, with the track, position,
  satellites, and signal chart following the selected reading.
- **Session report** — a rule-based summary with a verdict, fix availability,
  signal extremes, lost satellites, and anomaly readings.
- **Names and notes** — give each session a human name and a short note.
- **Search and filters** — find sessions by name, note, scenario, or number, and
  narrow the list by scenario and state.
- **Live readings** — a new simulated reading every two seconds.
- **Receiver view** — PVT values, per-satellite C/N₀ and Doppler, quality
  classes, an average C/N₀ chart, reading history, and event log.
- **Persistence** — accounts, sessions, readings, and events are stored in a
  local SQLite file and survive restarts.
- **Plain-language help** — an in-app guide that explains fixes, signal
  strength, session states, replay, and reports.

The **Simulation mode** label appears on public and signed-in screens so the
source of the data is never ambiguous.

## Stack

- Next.js 16 with the App Router and Cache Components
- React 19 and TypeScript
- Tailwind CSS 4 with shadcn/ui (neutral theme)
- SQLite through Node's built-in `node:sqlite` module

All data access runs on the server. Server Components read the database directly
and mutations are Server Actions in `"use server"` files. There are no API
routes and no client-side fetch layer.

## Run

Requires Node.js 24 or newer (for `node:sqlite`) and pnpm.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The database is created on first use at
`data/gps-edgeai.db` and is ignored by git.

Other commands:

```bash
pnpm build   # production build
pnpm start   # production server
pnpm lint    # eslint
pnpm test    # 27 unit and integration tests
```

Set `GPS_DB_PATH` to use a different database file, for example:

```bash
GPS_DB_PATH=/tmp/gps-demo.db pnpm dev
```

## Demo account

| Email | Password |
| --- | --- |
| `demo@example.com` | `demo1234` |

Use **Open the demo** on the landing page or sign-in page for a one-click login.
The demo account is created on first use and starts with three finished
sessions: nominal, weak signal, and satellite anomaly. It is safe to delete the
sample sessions; the next demo login restores them if the workspace is empty.

You can also create a fresh account from `/register`. New accounts start empty.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Product landing page and one-click demo |
| `/login` | Public | Sign in or open the demo |
| `/register` | Public | Create an account |
| `/help` | Public | Guide to the dashboard and terminology |
| `/dashboard` | Signed in | Overview, stats, start a session, latest run |
| `/sessions` | Signed in | All sessions with search, filters, and delete controls |
| `/sessions/[id]` | Signed in, owner | Report, replay, track, readings, and editable name/note |
| `/settings` | Signed in | Profile, password, account, stored data |

Protected routes live in the `(app)` route group. The layout and every Server
Action check the signed-in user; session reads and mutations are scoped by user
id, so one account cannot open or change another account's session.

## Demo walkthrough

1. Open **Open the demo** and confirm the **Simulation mode** label and receiver
   state are visible.
2. On **Overview**, choose a scenario and select **Start session**. The app opens
   the live session and records a reading every two seconds.
3. Watch the PVT card, satellite table, C/N₀ chart, reading history, and events.
4. Select **Stop session**. The stop time is recorded and the reading count
   stays fixed.
5. Open **Sessions** and select **Evening run**. The report card says **Anomaly
   detected** and names PRN 15 and readings 4–6.
6. Use **Replay** to step to reading 4. The position card shows **Unavailable**,
   the satellite table shows PRN 15 at 22 dB-Hz, and the track draws a dashed
   **no fix** line across the missing positions.
7. Choose **Edit name and note** on the session, save a new name, then return to
   **Sessions** and search for it. Try the scenario and state filters too.
8. Run the anomaly scenario and stop at 4–6 readings. PRN 15 drops to 22 dB-Hz,
   the reading is marked as an anomaly, and the alert appears in the session
   events.
9. Restart the server and reopen the saved session. The same readings, name, and
   note are still present.
10. In **Settings**, delete all sessions and confirm the overview returns to the
    idle state with zero readings.

**Save one demo reading** on the overview records a single finished session
without starting a live run.

## Scenarios

| Scenario | What it shows |
| --- | --- |
| Nominal | Eight tracked satellites, valid PVT |
| Weak signal | Lower C/N₀, two lost satellites, stale PVT |
| Satellite anomaly | PRN 15 collapses during readings 4–6, PVT unavailable, alert event |

Readings are deterministic for a given session, scenario, and reading number, so
the same acceptance checks can be repeated.

## Storage

| Table | Contents |
| --- | --- |
| `users` | Name, unique email, scrypt password hash, creation time |
| `auth_sessions` | Hashed sign-in tokens, user id, creation and expiry time |
| `sessions` | Owner, scenario, state, start and stop times, reading count, name, note |
| `readings` | PVT fields and the satellite array as JSON |
| `events` | Session changes and alerts |

Schema initialization and the `sessions.user_id`, `title`, and `note` migrations
live in `src/lib/db.ts`. Each connection checks for missing columns and applies
them before the schema version is recorded, so long-running development servers
and databases created by older builds are upgraded automatically.

Records are kept until you delete them. Individual sessions can be deleted from
**Sessions**; everything can be cleared from **Settings**. To reset the whole app
including accounts, stop the app and remove `data/gps-edgeai.db` (or the whole
`data/` directory).

Legacy databases created before the account layer are migrated automatically.
Sessions without an owner stay in the file but are not shown to any account.

## Authentication notes

- Passwords are hashed with Node's `scrypt` and a random per-password salt.
- Sign-in tokens are random 32-byte values. Only their SHA-256 hash is stored.
- The browser receives an HTTP-only, SameSite=Lax cookie with a 30-day expiry.
- Expired sessions are cleaned up when a new sign-in is created.
- There is no middleware. Guards run in the protected layout and in every
  mutating Server Action.
- Cookies are not marked `Secure` by default so the demo also works on a LAN
  address over HTTP. Set `GPS_SECURE_COOKIES=1` when serving the app over HTTPS.

This is a local demo, not an internet-facing production auth system. It has no
email verification, password reset, rate limiting, or account lockout. Do not
expose it publicly without adding those controls and HTTPS.

## Tests

```bash
pnpm test
```

Coverage:

- `simulator.test.ts` — deterministic readings, anomaly behavior, weak-signal
  behavior, and quality thresholds.
- `db.test.ts` — persistence across a database close/reopen, idempotent stop,
  per-user isolation, and bulk delete.
- `password.test.ts` — scrypt round trip, wrong passwords, fresh salts, and
  malformed hashes.
- `demo.test.ts` — demo user creation, sample session seeding, idempotency, and
  the anomaly alert.
- `migration.test.ts` — upgrading a database created before the account layer
  existed.
