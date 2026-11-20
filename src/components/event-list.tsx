import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import type { SessionEvent } from "@/lib/types";

export function EventList({ events }: { events: SessionEvent[] }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Events</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3">
                <time className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                  {formatTime(event.observedAt)}
                </time>
                <span
                  className={
                    event.kind === "alert"
                      ? "text-destructive"
                      : event.kind === "error"
                        ? "text-destructive"
                        : undefined
                  }
                >
                  {event.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
