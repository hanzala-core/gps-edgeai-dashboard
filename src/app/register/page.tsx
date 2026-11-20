import { Suspense } from "react";
import Link from "next/link";
import { AuthAside } from "@/components/auth/auth-aside";
import { RegisterForm } from "@/components/auth/register-form";
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

export const metadata = { title: "Create account" };

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center">
          <AuthAside
            title="Start with a clean, local workspace."
            body="Create an account to keep your sessions separate and easy to find. No email confirmation, no cloud sync, and no hardware to connect."
          />

          <div className="mx-auto w-full max-w-sm">
            <Suspense fallback={null}>
              <SignedInNotice />
            </Suspense>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create account</CardTitle>
                <CardDescription>
                  Takes a moment. Your data stays on this device.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterForm />
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
