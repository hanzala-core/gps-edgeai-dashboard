import { CircleCheck, TriangleAlert } from "lucide-react";
import type { FormState } from "@/lib/types";

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{state.error}</span>
      </p>
    );
  }

  if (state.success) {
    return (
      <p
        role="status"
        className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
      >
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{state.success}</span>
      </p>
    );
  }

  return null;
}
