import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AppNotFound() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <Card className="max-w-md">
        <CardHeader>
          <p className="font-mono text-xs text-muted-foreground">404</p>
          <CardTitle className="text-lg">Page not found</CardTitle>
          <CardDescription>
            This page does not exist, or the session belongs to another account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
            Back to overview
          </Link>
          <Link
            href="/sessions"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View sessions
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
