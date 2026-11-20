import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { SessionFilters } from "@/components/session-filters";
import { SessionsTable } from "@/components/sessions-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { listSessions, searchSessions } from "@/lib/db";
import {
  isScenario,
  type Scenario,
  type SessionState,
} from "@/lib/types";

export const metadata = { title: "Sessions" };

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export default function Page({ searchParams }: PageProps<"/sessions">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
            <Badge variant="outline">Simulation mode</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every recording you have made, kept on this device until you delete
            it.
          </p>
        </div>
        <Link
          href="/dashboard#start-session"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus aria-hidden="true" />
          New session
        </Link>
      </header>

      <Suspense fallback={<SessionsFallback />}>
        <SessionList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SessionList({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const user = await requireUser();
  const params = await searchParams;

  const query = first(params.q).trim();
  const rawScenario = first(params.scenario);
  const scenario: Scenario | null = isScenario(rawScenario)
    ? rawScenario
    : null;
  const state = parseState(first(params.state));
  const active = query.length > 0 || scenario !== null || state !== null;

  const sessions = searchSessions(user.id, { query, scenario, state });
  const hasAnySession = listSessions(user.id, 1).length > 0;

  if (!hasAnySession) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>No sessions yet</CardTitle>
          <CardDescription>
            Start a simulated receiver run to record your first session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/dashboard#start-session"
            className={buttonVariants({ size: "sm" })}
          >
            Start a session
          </Link>
          <Link
            href="/help"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Read the guide
          </Link>
        </CardContent>
      </Card>
    );
  }

  const running = sessions.filter((session) => session.state === "running");
  const summary = active
    ? `${sessions.length} matching session${sessions.length === 1 ? "" : "s"}`
    : `${sessions.length} session${sessions.length === 1 ? "" : "s"} stored`;

  return (
    <div className="space-y-4">
      <SessionFilters
        query={query}
        scenario={scenario}
        state={state}
        active={active}
      />

      {sessions.length === 0 ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>No matching sessions</CardTitle>
            <CardDescription>
              Try a different search, or clear the filters to see everything.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/sessions"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Clear filters
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Recorded sessions</CardTitle>
            <CardDescription>
              {summary}
              {running.length > 0 ? ` · ${running.length} running` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsTable sessions={sessions} showDelete />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function first(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

function parseState(value: string): SessionState | null {
  return value === "running" || value === "stopped" || value === "error"
    ? value
    : null;
}

function SessionsFallback() {
  return (
    <div className="h-64 rounded-xl border bg-muted/30" aria-hidden="true" />
  );
}
