import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader, AppHeaderSkeleton } from "@/components/app-header";
import { Footer } from "@/components/footer";
import { requireUser } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <Suspense fallback={<AppHeaderSkeleton />}>
        <AuthenticatedHeader />
      </Suspense>
      <main className="flex-1">
        <Suspense fallback={<PageSkeleton />}>
          <AuthenticatedContent>{children}</AuthenticatedContent>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

async function AuthenticatedHeader() {
  await connection();
  const user = await requireUser();
  return <AppHeader user={user} />;
}

async function AuthenticatedContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  await requireUser();
  return children;
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="h-6 w-40 rounded bg-muted" />
      <div className="mt-2 h-4 w-80 max-w-full rounded bg-muted/70" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-24 rounded-xl border bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
