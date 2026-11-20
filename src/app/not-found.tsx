import Link from "next/link";
import { Footer } from "@/components/footer";
import { PublicHeader } from "@/components/public-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <p className="font-mono text-xs text-muted-foreground">404</p>
            <CardTitle className="text-lg">Page not found</CardTitle>
            <CardDescription>
              The page you were looking for does not exist or may have been
              removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/" className={buttonVariants({ size: "sm" })}>
              Go home
            </Link>
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open overview
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
