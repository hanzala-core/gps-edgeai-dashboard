import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SCENARIOS,
  type Scenario,
  type SessionState,
} from "@/lib/types";

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-40 dark:bg-input/30";

export function SessionFilters({
  query,
  scenario,
  state,
  active,
}: {
  query: string;
  scenario: Scenario | null;
  state: SessionState | null;
  active: boolean;
}) {
  return (
    <form
      method="get"
      role="search"
      className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="session-search">Search</Label>
        <Input
          id="session-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Name, note, scenario, or number"
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="session-scenario">Scenario</Label>
        <select
          id="session-scenario"
          name="scenario"
          defaultValue={scenario ?? ""}
          className={selectClassName}
        >
          <option value="">All scenarios</option>
          {SCENARIOS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="session-state">State</Label>
        <select
          id="session-state"
          name="state"
          defaultValue={state ?? ""}
          className={selectClassName}
        >
          <option value="">All states</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="outline" size="sm" className="h-9">
          Apply filters
        </Button>
        {active ? (
          <Link
            href="/sessions"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "h-9",
            })}
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
