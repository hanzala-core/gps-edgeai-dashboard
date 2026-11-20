import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { SessionPanel } from "@/components/session-panel";
import { requireUser } from "@/lib/auth";
import { getEvents, getSession, getSessionReadings } from "@/lib/db";
import { buildSessionReport } from "@/lib/report";

export const metadata = { title: "Session details" };

export default function Page({ params }: PageProps<"/sessions/[id]">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/sessions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All sessions
        </Link>
        <Link
          href="/dashboard#start-session"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Start another session
        </Link>
      </div>

      <Suspense fallback={<SessionFallback />}>
        <SessionDetail params={params} />
      </Suspense>
    </div>
  );
}

async function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requireUser();

  const { id } = await params;
  const sessionId = Number(id);

  if (!Number.isInteger(sessionId) || sessionId <= 0) notFound();

  const session = getSession(sessionId, user.id);
  if (!session) notFound();

  const timeline = getSessionReadings(session.id);
  const latest = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  return (
    <SessionPanel
      session={session}
      latest={latest}
      chart={timeline.slice(-40)}
      history={timeline.slice(-50).reverse()}
      timeline={timeline}
      events={getEvents(session.id)}
      report={buildSessionReport(session, timeline)}
    />
  );
}

function SessionFallback() {
  return (
    <div className="space-y-4">
      <div className="h-32 rounded-xl border bg-muted/30" aria-hidden="true" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-40 rounded-xl border bg-muted/30" aria-hidden="true" />
        <div className="h-40 rounded-xl border bg-muted/30" aria-hidden="true" />
      </div>
    </div>
  );
}
