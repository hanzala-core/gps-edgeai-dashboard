"use client";

import { useEffect, useRef, useTransition } from "react";
import { tickSessionAction } from "@/app/actions";

export function LiveSession({ sessionId }: { sessionId: number }) {
  const [, startTransition] = useTransition();
  const busy = useRef(false);

  useEffect(() => {
    const tick = () => {
      if (busy.current) return;
      busy.current = true;

      startTransition(async () => {
        try {
          await tickSessionAction(sessionId);
        } finally {
          busy.current = false;
        }
      });
    };

    const first = setTimeout(tick, 400);
    const timer = setInterval(tick, 2000);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [sessionId, startTransition]);

  return (
    <p className="text-xs text-muted-foreground">
      Recording a simulated reading every 2 seconds while this session runs.
    </p>
  );
}
