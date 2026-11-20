import { UserRound } from "lucide-react";
import { logoutAction } from "@/app/auth-actions";
import { Brand } from "@/components/brand";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

export function AppHeader({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Brand href="/dashboard" />
        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto">
          <NavLink href="/dashboard">Overview</NavLink>
          <NavLink href="/sessions">Sessions</NavLink>
          <NavLink href="/help">Help</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <NavLink href="/settings" className="inline-flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-full bg-muted">
              <UserRound className="size-3.5" aria-hidden="true" />
            </span>
            <span className="max-w-36 truncate">{user.name}</span>
          </NavLink>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

export function AppHeaderSkeleton() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-[57px] w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Brand href="/dashboard" />
        <div className="h-3 w-48 rounded bg-muted" />
        <div className="ml-auto h-7 w-28 rounded bg-muted" />
      </div>
    </header>
  );
}
