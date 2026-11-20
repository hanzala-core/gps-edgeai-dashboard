import { Suspense } from "react";
import { connection } from "next/server";
import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { deleteAllSessionsAction } from "@/app/actions";
import { logoutAction } from "@/app/auth-actions";
import { ConfirmButton } from "@/components/confirm-button";
import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getUserStats } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage your account and the data stored on this device.
        </p>
      </header>

      <Suspense fallback={<SettingsFallback />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  await connection();
  const user = await requireUser();
  const stats = getUserStats(user.id);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is how your name appears in the app header.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Use at least 8 characters. You will stay signed in on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Stored data</CardTitle>
            <CardDescription>
              Sessions, readings, and events live in a local SQLite file. Nothing
              is sent to a server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Sessions</dt>
                <dd className="font-mono tabular-nums">
                  {stats.sessionCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Readings</dt>
                <dd className="font-mono tabular-nums">
                  {stats.readingCount}
                </dd>
              </div>
            </dl>

            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Delete all sessions</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Removes every session, reading, and event in your workspace.
                    This cannot be undone.
                  </p>
                </div>
                <form action={deleteAllSessionsAction}>
                  <ConfirmButton
                    confirmMessage="Delete all sessions and readings? This cannot be undone."
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 aria-hidden="true" />
                    Delete all
                  </ConfirmButton>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed in on this device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="mt-0.5">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="mt-0.5 break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="mt-0.5">{formatDate(user.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 border-t pt-4">
              <ShieldCheck
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-xs text-muted-foreground">
                Password protected with a salted hash
              </span>
            </div>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                className="w-full justify-start"
              >
                <LogOut aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>About this workspace</CardTitle>
            <CardDescription>
              A local demo environment for GPS session monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span>Mode</span>
              <Badge variant="outline">Simulation</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Storage</span>
              <span className="text-foreground">SQLite on this device</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Hardware</span>
              <span className="text-foreground">Not required</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsFallback() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="h-52 rounded-xl border bg-muted/30" aria-hidden="true" />
        <div className="h-56 rounded-xl border bg-muted/30" aria-hidden="true" />
      </div>
      <div className="h-80 rounded-xl border bg-muted/30" aria-hidden="true" />
    </div>
  );
}
