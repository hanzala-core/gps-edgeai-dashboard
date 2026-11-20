"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Something went wrong</CardTitle>
          <CardDescription>
            The page could not finish loading. Try again, or return to the home
            page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => reset()} size="sm">
            Try again
          </Button>
          <Link
            href="/"
            className="inline-flex h-7 items-center rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium hover:bg-muted"
          >
            Go home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
