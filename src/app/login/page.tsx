import { Suspense } from "react";
import Link from "next/link";
import { demoLoginAction } from "@/app/auth-actions";
import { AuthAside } from "@/components/auth/auth-aside";
import { DemoLoginButton } from "@/components/auth/demo-login-button";
import { LoginForm } from "@/components/auth/login-form";
import { SignedInNotice } from "@/components/auth/signed-in-notice";
import { Footer } from "@/components/footer";
import { PublicHeader } from "@/components/public-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Sign in" };

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center">
          <AuthAside
            title="A calmer way to review a GPS run."
            body="Sign in to start a session, follow the readings, and return to the history whenever you need it. Everything stays on this device."
          />

          <div className="mx-auto w-full max-w-sm">
            <Suspense fallback={null}>
              <SignedInNotice />
            </Suspense>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sign in</CardTitle>
                <CardDescription>
                  Use your account to continue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
            </Card>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Card size="sm">
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Just looking?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Open a sample workspace with three finished sessions,
                    including an anomaly alert.
                  </p>
                </div>
                <form action={demoLoginAction}>
                  <DemoLoginButton
                    label="Use the demo account"
                    className="h-9 w-full"
                  />
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link
                href="/register"
                className="font-medium text-foreground hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
