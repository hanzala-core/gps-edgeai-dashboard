import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          GPS-EdgeAI · Simulated GPS session monitoring. No receiver hardware
          required.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/help" className="hover:text-foreground">
            Help
          </Link>
          <span>Simulation mode</span>
          <span>Data stays on this device</span>
        </nav>
      </div>
    </footer>
  );
}
