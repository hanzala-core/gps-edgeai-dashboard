import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, FilePlus2 } from "lucide-react";
import { saveDemoReadingAction } from "@/app/actions";
import { LatestSessionCard } from "@/components/latest-session-card";
import { SessionsTable } from "@/components/sessions-table";
import { StartSessionForm } from "@/components/start-session-form";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import {
  getLatestReading,
  getLatestSession,
  getRunningSession,
  getUserStats,
  listSessions,
} from "@/lib/db";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Overview" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Suspense fallback={<DashboardFallback />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  await connection();
  const user = await requireUser();
  const stats = getUserStats(user.id);
  const session = getRunningSession(user.id) ?? getLatestSession(user.id);
  const latest = session ? getLatestReading(session.id) : null;
  const recent = listSessions(user.id, 5);
  const firstName = user.name.split(" ")[0] || user.name;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
            <Badge variant="outline">Simulation mode</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Welcome back, {firstName}. Here is what your receiver has been
            doing.
          </p>
        </div>
        <Link
          href="/sessions"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          View all sessions
        </Link>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Sessions"
          value={String(stats.sessionCount)}
          hint="saved in this workspace"
        />
        <Stat
          label="Readings"
          value={String(stats.readingCount)}
          hint="simulated measurements"
        />
        <Stat
          label="Receiver"
          value={stats.runningCount > 0 ? "Running" : "Idle"}
          hint={
            stats.runningCount > 0
              ? "recording every 2 seconds"
              : "ready when you are"
          }
        />
        <Stat
          label="Last activity"
          value={
            stats.lastSessionAt ? formatRelative(stats.lastSessionAt) : "None yet"
          }
          hint="most recent session start"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2" id="start-session">
          <CardHeader>
            <CardTitle>Start a session</CardTitle>
            <CardDescription>
              Pick a signal scenario and watch readings arrive. Every session is
              saved to this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StartSessionForm />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              A single reading is a good way to see the layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={saveDemoReadingAction}>
              <Button
                type="submit"
                variant="outline"
                className="h-9 w-full justify-start px-3"
              >
                <FilePlus2 aria-hidden="true" />
                Save one demo reading
              </Button>
            </form>
            <div className="border-t pt-4">
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                How to read this dashboard
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                Short explanations of position, signal strength, and session
                states.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Latest session
          </h2>
          {session ? (
            <Link
              href={`/sessions/${session.id}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Full details
            </Link>
          ) : null}
        </div>
        {session ? (
          <LatestSessionCard session={session} latest={latest} />
        ) : (
          <Card size="sm">
            <CardContent className="flex flex-wrap items-center gap-3 py-6 text-sm text-muted-foreground">
              <Badge variant="secondary">Idle</Badge>
              <span>
                No session has been recorded yet. Choose a scenario above to
                record your first one.
              </span>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mt-8">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
            <CardDescription>
              Your last {recent.length} session{recent.length === 1 ? "" : "s"}
            </CardDescription>
            {recent.length > 0 ? (
              <CardAction>
                <Link
                  href="/sessions"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  All sessions
                </Link>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing here yet. Your recorded sessions will appear in this
                list.
              </p>
            ) : (
              <SessionsTable sessions={recent} />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function DashboardFallback() {
  return (
    <>
      <div className="h-8 w-44 rounded bg-muted" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-muted/70" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-24 rounded-xl border bg-muted/30" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-xl border bg-muted/30 lg:col-span-2" />
        <div className="h-72 rounded-xl border bg-muted/30" />
      </div>
    </>
  );
}
