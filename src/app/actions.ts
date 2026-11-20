"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  addEvent,
  deleteAllSessions,
  deleteSession,
  getLatestReading,
  getRunningSession,
  getSession,
  insertSession,
  saveReading,
  stopSession,
  updateSessionMeta,
} from "@/lib/db";
import { generateReading } from "@/lib/simulator";
import {
  isScenario,
  SCENARIO_LABELS,
  type FormState,
} from "@/lib/types";

export type ActionState = { message: string };

export async function startSessionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const raw = formData.get("scenario");
  if (typeof raw !== "string" || !isScenario(raw)) {
    return { message: "Choose a scenario before starting." };
  }

  if (getRunningSession(user.id)) {
    return {
      message: "A session is already running. Stop it before starting another.",
    };
  }

  const startedAt = new Date().toISOString();
  const session = insertSession(raw, "running", startedAt, user.id);
  addEvent(
    session.id,
    "session",
    `Session started with the ${SCENARIO_LABELS[raw]} scenario.`,
    startedAt,
  );

  redirect(`/sessions/${session.id}`);
}

export async function stopSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("sessionId"));
  if (!Number.isInteger(id) || id <= 0) return;

  stopSession(id, user.id);
  refresh();
}

export async function tickSessionAction(
  sessionId: number,
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser();
  const session = getSession(sessionId, user.id);
  if (!session || session.state !== "running") {
    return { ok: false, message: "Session is not running." };
  }

  const latest = getLatestReading(sessionId);
  if (latest && Date.now() - Date.parse(latest.observedAt) < 1000) {
    return { ok: true };
  }

  const tick = session.readingCount + 1;
  const observedAt = new Date().toISOString();
  const reading = generateReading({
    sessionId,
    tick,
    scenario: session.scenario,
    observedAt,
    state: "running",
  });

  saveReading(reading);

  if (reading.anomaly && tick === 4) {
    addEvent(
      sessionId,
      "alert",
      "Anomaly detected: PRN 15 C/N0 dropped to 22 dB-Hz.",
      observedAt,
    );
  }

  refresh();
  return { ok: true };
}

export async function saveDemoReadingAction(): Promise<void> {
  const user = await requireUser();
  const now = new Date().toISOString();
  const session = insertSession("nominal", "stopped", now, user.id, now);
  const reading = generateReading({
    sessionId: session.id,
    tick: 1,
    scenario: "nominal",
    observedAt: now,
    state: "stopped",
  });

  saveReading(reading);
  addEvent(session.id, "session", "Demo reading saved.", now);

  redirect(`/sessions/${session.id}`);
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("sessionId"));
  if (!Number.isInteger(id) || id <= 0) return;

  deleteSession(id, user.id);
  redirect("/sessions");
}

const TITLE_LIMIT = 80;
const NOTE_LIMIT = 280;

export async function updateSessionMetaAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const id = Number(formData.get("sessionId"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Session not found." };
  }

  const rawTitle = formData.get("title");
  const rawNote = formData.get("note");
  if (typeof rawTitle !== "string" || typeof rawNote !== "string") {
    return { error: "Could not read the name or note." };
  }

  const title = rawTitle.trim();
  const note = rawNote.trim();
  if (title.length > TITLE_LIMIT) {
    return { error: `Keep the name under ${TITLE_LIMIT} characters.` };
  }
  if (note.length > NOTE_LIMIT) {
    return { error: `Keep the note under ${NOTE_LIMIT} characters.` };
  }

  const session = updateSessionMeta(id, user.id, {
    title: title.length === 0 ? null : title,
    note: note.length === 0 ? null : note,
  });
  if (!session) return { error: "Session not found." };

  refresh();
  return { success: "Name and note saved." };
}

export async function deleteAllSessionsAction(): Promise<void> {
  const user = await requireUser();
  deleteAllSessions(user.id);
  refresh();
}
