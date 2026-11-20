import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createAuthSession,
  deleteAuthSession,
  deleteExpiredAuthSessions,
  getAuthSessionUser,
} from "./db";
import type { User } from "./types";

const COOKIE_NAME = "gps_session";
const SESSION_DAYS = 30;
const MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function secureCookies(): boolean {
  return process.env.GPS_SECURE_COOKIES === "1";
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getAuthSessionUser(hashToken(token));
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function startUserSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAX_AGE_SECONDS * 1000);

  deleteExpiredAuthSessions(now.toISOString());
  createAuthSession({
    tokenHash: hashToken(token),
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endUserSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) deleteAuthSession(hashToken(token));
  store.delete(COOKIE_NAME);
}
