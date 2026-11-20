import {
  addEvent,
  createUser,
  getUserByEmail,
  getUserStats,
  insertSession,
  saveReading,
  stopSession,
} from "./db.ts";
import { hashPassword } from "./password.ts";
import { generateReading } from "./simulator.ts";
import type { Scenario, User } from "./types";

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "demo1234";

type SeedSpec = {
  scenario: Scenario;
  readings: number;
  hoursAgo: number;
  title: string;
  note: string;
};

const SEED_SPECS: SeedSpec[] = [
  {
    scenario: "nominal",
    readings: 14,
    hoursAgo: 28,
    title: "Rooftop check",
    note: "Clear morning with a steady position fix throughout.",
  },
  {
    scenario: "weak-signal",
    readings: 9,
    hoursAgo: 21,
    title: "Car park test",
    note: "Two satellites dropped out. The position fix was stale, so treat it as a rough estimate.",
  },
  {
    scenario: "anomaly",
    readings: 7,
    hoursAgo: 3,
    title: "Evening run",
    note: "PRN 15 collapsed mid-run and the receiver lost its fix for three readings.",
  },
];

function seedDemoSessions(userId: number): void {
  const now = Date.now();

  for (const spec of SEED_SPECS) {
    const startedAt = new Date(
      now - spec.hoursAgo * 60 * 60 * 1000,
    ).toISOString();
    const session = insertSession(
      spec.scenario,
      "running",
      startedAt,
      userId,
      null,
      spec.title,
      spec.note,
    );

    addEvent(
      session.id,
      "session",
      `Session started with the ${spec.scenario} scenario.`,
      startedAt,
    );

    for (let tick = 1; tick <= spec.readings; tick += 1) {
      const observedAt = new Date(
        Date.parse(startedAt) + tick * 2000,
      ).toISOString();
      const reading = generateReading({
        sessionId: session.id,
        tick,
        scenario: spec.scenario,
        observedAt,
        state: "running",
      });

      saveReading(reading);

      if (reading.anomaly && tick === 4) {
        addEvent(
          session.id,
          "alert",
          "Anomaly detected: PRN 15 C/N0 dropped to 22 dB-Hz.",
          observedAt,
        );
      }
    }

    stopSession(
      session.id,
      userId,
      new Date(Date.parse(startedAt) + spec.readings * 2000).toISOString(),
    );
  }
}

export async function ensureDemoUser(): Promise<User> {
  const existing = getUserByEmail(DEMO_EMAIL);

  if (existing) {
    if (getUserStats(existing.user.id).sessionCount === 0) {
      seedDemoSessions(existing.user.id);
    }
    return existing.user;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  try {
    const user = createUser({
      name: "Demo Operator",
      email: DEMO_EMAIL,
      passwordHash,
    });
    seedDemoSessions(user.id);
    return user;
  } catch {
    const fallback = getUserByEmail(DEMO_EMAIL);
    if (!fallback) throw new Error("Could not create the demo account.");
    return fallback.user;
  }
}
