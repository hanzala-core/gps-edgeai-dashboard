import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteSessionAction } from "@/app/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { SessionStateBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { SCENARIO_LABELS, type SessionRow } from "@/lib/types";

export function SessionsTable({
  sessions,
  showDelete = false,
}: {
  sessions: SessionRow[];
  showDelete?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead className="hidden md:table-cell">Scenario</TableHead>
          <TableHead>State</TableHead>
          <TableHead className="hidden lg:table-cell">Started</TableHead>
          <TableHead className="hidden lg:table-cell">Stopped</TableHead>
          <TableHead className="text-right">Readings</TableHead>
          {showDelete ? (
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell>
              <Link
                href={`/sessions/${session.id}`}
                className="block underline-offset-4 hover:underline"
              >
                <span className={session.title ? "text-sm font-medium" : "font-mono text-sm"}>
                  {session.title ?? `#${session.id}`}
                </span>
                {session.title ? (
                  <span className="block font-mono text-xs text-muted-foreground">
                    #{session.id}
                    <span className="md:hidden">
                      {" "}
                      · {SCENARIO_LABELS[session.scenario]}
                    </span>
                  </span>
                ) : null}
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {SCENARIO_LABELS[session.scenario]}
            </TableCell>
            <TableCell>
              <SessionStateBadge state={session.state} />
            </TableCell>
            <TableCell className="hidden whitespace-nowrap font-mono text-xs tabular-nums lg:table-cell">
              {formatDateTime(session.startedAt)}
            </TableCell>
            <TableCell className="hidden whitespace-nowrap font-mono text-xs tabular-nums lg:table-cell">
              {session.stoppedAt ? formatDateTime(session.stoppedAt) : "—"}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {session.readingCount}
            </TableCell>
            {showDelete ? (
              <TableCell className="text-right">
                <form action={deleteSessionAction}>
                  <input
                    type="hidden"
                    name="sessionId"
                    value={session.id}
                  />
                  <ConfirmButton
                    confirmMessage={`Delete ${session.title ? `“${session.title}”` : `session #${session.id}`}? Its readings and events will be removed.`}
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Delete</span>
                  </ConfirmButton>
                </form>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
