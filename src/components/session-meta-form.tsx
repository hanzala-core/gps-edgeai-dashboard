"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateSessionMetaAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState, SessionRow } from "@/lib/types";

const initialState: FormState = {};

export function SessionMetaForm({
  session,
}: {
  session: Pick<SessionRow, "id" | "title" | "note">;
}) {
  const [state, formAction, pending] = useActionState(
    updateSessionMetaAction,
    initialState,
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Pencil aria-hidden="true" />
        {session.title || session.note
          ? "Edit name and note"
          : "Rename or add a note"}
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="sessionId" value={session.id} />
      <FormMessage state={state} />

      <div className="space-y-1.5">
        <Label htmlFor={`session-title-${session.id}`}>Name</Label>
        <Input
          id={`session-title-${session.id}`}
          name="title"
          defaultValue={session.title ?? ""}
          maxLength={80}
          placeholder="For example, Rooftop check"
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`session-note-${session.id}`}>
          Note
          <span className="font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id={`session-note-${session.id}`}
          name="note"
          defaultValue={session.note ?? ""}
          maxLength={280}
          rows={2}
          placeholder="What happened in this session?"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Close
        </Button>
      </div>
    </form>
  );
}
