"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { endUserSession, requireUser, startUserSession } from "@/lib/auth";
import {
  createUser,
  getUserByEmail,
  getUserPasswordHash,
  isEmailTaken,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/db";
import { ensureDemoUser } from "@/lib/demo";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { FormState } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = field(formData, "name");
  const email = normalizeEmail(field(formData, "email"));
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirmPassword");

  if (name.length < 2) {
    return { error: "Enter your name so your workspace feels personal." };
  }
  if (!validEmail(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Choose a password with at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "The two passwords do not match." };
  }
  if (isEmailTaken(email)) {
    return { error: "An account with this email already exists." };
  }

  let userId: number;
  try {
    const passwordHash = await hashPassword(password);
    const user = createUser({ name, email, passwordHash });
    userId = user.id;
  } catch {
    return { error: "We could not create the account. Please try again." };
  }

  await startUserSession(userId);
  redirect("/dashboard");
}

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = normalizeEmail(field(formData, "email"));
  const password = field(formData, "password");

  if (!validEmail(email) || !password) {
    return { error: "Enter your email and password." };
  }

  const record = getUserByEmail(email);
  const valid =
    record !== null && (await verifyPassword(password, record.passwordHash));

  if (!record || !valid) {
    return { error: "Email or password is incorrect." };
  }

  await startUserSession(record.user.id);
  redirect("/dashboard");
}

export async function demoLoginAction(): Promise<void> {
  const user = await ensureDemoUser();
  await startUserSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await endUserSession();
  redirect("/");
}

export async function updateProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const name = field(formData, "name");
  const email = normalizeEmail(field(formData, "email"));

  if (name.length < 2) {
    return { error: "Enter your name." };
  }
  if (!validEmail(email)) {
    return { error: "Enter a valid email address." };
  }
  if (isEmailTaken(email, user.id)) {
    return { error: "Another account already uses this email." };
  }

  updateUserProfile(user.id, { name, email });
  refresh();
  return { success: "Profile updated." };
}

export async function changePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const currentPassword = field(formData, "currentPassword");
  const newPassword = field(formData, "newPassword");
  const confirmPassword = field(formData, "confirmPassword");

  if (!currentPassword || !newPassword) {
    return { error: "Fill in both password fields." };
  }
  if (newPassword.length < 8) {
    return { error: "The new password needs at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "The two new passwords do not match." };
  }

  const stored = getUserPasswordHash(user.id);
  if (!stored || !(await verifyPassword(currentPassword, stored))) {
    return { error: "Your current password is incorrect." };
  }

  const passwordHash = await hashPassword(newPassword);
  updateUserPassword(user.id, passwordHash);
  return { success: "Password changed." };
}
