"use client";

import { useActionState } from "react";
import { startSessionAction, type ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  SCENARIO_DESCRIPTIONS,
  SCENARIOS,
  type Scenario,
} from "@/lib/types";

const initialState: ActionState = { message: "" };

export function StartSessionForm({
  defaultScenario = "nominal",
}: {
  defaultScenario?: Scenario;
}) {
  const [state, formAction, pending] = useActionState(
    startSessionAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="sr-only">Scenario</legend>
        {SCENARIOS.map((scenario) => (
          <label key={scenario.value} className="block cursor-pointer">
            <input
              type="radio"
              name="scenario"
              value={scenario.value}
              defaultChecked={scenario.value === defaultScenario}
              className="peer sr-only"
            />
            <span className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5 transition-colors peer-checked:border-foreground/40 peer-checked:bg-muted/60 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:[&_.scenario-dot]:border-foreground peer-checked:[&_.scenario-dot]:bg-foreground">
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">
                  {scenario.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {SCENARIO_DESCRIPTIONS[scenario.value]}
                </span>
              </span>
              <span className="scenario-dot mt-1 size-3.5 shrink-0 rounded-full border" />
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-9 px-3.5" disabled={pending}>
          {pending ? "Starting…" : "Start session"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Adds a reading every 2 seconds.
        </p>
      </div>

      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
