import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function SignedInNotice() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        You are already signed in as {user.name}.
      </span>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 font-medium hover:underline"
      >
        Go to overview
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </Link>
    </div>
  );
}
