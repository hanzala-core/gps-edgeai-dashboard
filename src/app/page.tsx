import Link from "next/link";
import { connection } from "next/server";
import {
  Activity,
  ArrowRight,
  Database,
  Gauge,
  Satellite,
} from "lucide-react";
import { demoLoginAction } from "@/app/auth-actions";
import { AppHeader } from "@/components/app-header";
import { DemoLoginButton } from "@/components/auth/demo-login-button";
import { Footer } from "@/components/footer";
import { PublicHeader } from "@/components/public-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export const instant = false;

export default async function Home() {
  await connection();
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-svh flex-col">
      {user ? <AppHeader user={user} /> : <PublicHeader />}

      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div>
              <Badge variant="outline">Simulation mode · no hardware</Badge>
              <h1 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                GPS sessions, clearly explained.
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground">
                Run a simulated receiver, watch signal quality and position in
                real time, and keep a tidy history you can review later. No
                hardware, no setup, no jargon.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={buttonVariants({
                        size: "lg",
                        className: "h-10 px-4",
                      })}
                    >
                      Open dashboard
                      <ArrowRight aria-hidden="true" />
                    </Link>
                    <Link
                      href="/sessions"
                      className={buttonVariants({
                        variant: "outline",
                        size: "lg",
                        className: "h-10 px-4",
                      })}
                    >
                      View sessions
                    </Link>
                  </>
                ) : (
                  <>
                    <form action={demoLoginAction}>
                      <DemoLoginButton label="Open the demo" />
                    </form>
                    <Link
                      href="/register"
                      className={buttonVariants({
                        variant: "outline",
                        size: "lg",
                        className: "h-10 px-4",
                      })}
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {user
                  ? `Signed in as ${user.name} · Your data stays on this device`
                  : "Demo workspace included · Your data stays on this device"}
              </p>
            </div>

            <HeroPreview />
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold tracking-tight">
                Built for reviewing, not fiddling.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The screen shows the few things that matter during a session,
                then gets out of the way.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Feature
                icon={<Activity aria-hidden="true" />}
                title="One clear status"
                body="Know at a glance whether the receiver is idle, running, or stopped, and whether the position fix can be trusted."
              />
              <Feature
                icon={<Gauge aria-hidden="true" />}
                title="Signal quality you can scan"
                body="Per-satellite measurements with plain-language labels: strong, good, weak, or unusable."
              />
              <Feature
                icon={<Satellite aria-hidden="true" />}
                title="Scenarios that teach"
                body="Practise a healthy run, a weak signal, or a satellite that fails mid-session."
              />
              <Feature
                icon={<Database aria-hidden="true" />}
                title="History that stays"
                body="Sessions are saved locally, so you can close the app and pick up where you left off."
              />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  How it works
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Three steps, about a minute. The demo account already has
                  sample sessions if you would rather look first.
                </p>
                <Link
                  href="/help"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Read the short guide
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>

              <ol className="grid gap-3 sm:grid-cols-3">
                <Step
                  number="01"
                  title="Pick a scenario"
                  body="Nominal, weak signal, or a satellite anomaly."
                />
                <Step
                  number="02"
                  title="Watch the session"
                  body="Readings arrive every two seconds with position and signal health."
                />
                <Step
                  number="03"
                  title="Review or delete"
                  body="Open the history later, compare runs, or remove what you no longer need."
                />
              </ol>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-6 rounded-xl border bg-muted/30 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="max-w-xl">
                <h2 className="text-lg font-semibold tracking-tight">
                  {user ? "Your workspace is ready." : "See it with sample data."}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {user
                    ? "Continue where you left off, or start a new simulated session and watch the readings arrive."
                    : "The demo account opens with three finished sessions, including an anomaly alert. No email required."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={buttonVariants({
                        size: "lg",
                        className: "h-10 px-4",
                      })}
                    >
                      Open dashboard
                    </Link>
                    <Link
                      href="/sessions"
                      className={buttonVariants({
                        variant: "outline",
                        size: "lg",
                        className: "h-10 px-4",
                      })}
                    >
                      View sessions
                    </Link>
                  </>
                ) : (
                  <>
                    <form action={demoLoginAction}>
                      <DemoLoginButton label="Open the demo" />
                    </form>
                    <Link
                      href="/login"
                      className={buttonVariants({
                        variant: "outline",
                        size: "lg",
                        className: "h-10 px-4",
                      })}
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <span className="inline-grid size-8 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-4">
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-xl border bg-card p-4">
      <span className="font-mono text-xs text-muted-foreground">{number}</span>
      <h3 className="mt-2 text-sm font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </li>
  );
}

function HeroPreview() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div>
          <p className="text-xs text-muted-foreground">Session preview</p>
          <CardTitle>Nominal scenario</CardTitle>
        </div>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="outline">Simulation</Badge>
            <Badge>Running</Badge>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <PreviewMetric label="Satellites" value="8 / 8" />
          <PreviewMetric label="Avg C/N₀" value="41.2" />
          <PreviewMetric label="Fix" value="Valid" />
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Signal over time</p>
            <p className="font-mono text-xs tabular-nums">dB-Hz</p>
          </div>
          <svg
            viewBox="0 0 320 72"
            className="mt-2 h-20 w-full"
            role="img"
            aria-label="Illustration of a steady signal quality chart"
          >
            <line
              x1="0"
              y1="52"
              x2="320"
              y2="52"
              className="stroke-border"
              strokeDasharray="4 4"
            />
            <polyline
              points="0,38 32,34 64,40 96,31 128,36 160,28 192,33 224,26 256,31 288,24 320,28"
              fill="none"
              className="stroke-foreground"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx="320" cy="28" r="3" className="fill-foreground" />
          </svg>
        </div>

        <div className="space-y-2">
          <PreviewSatellite prn="PRN 03" value="47.0 dB-Hz" width="94%" />
          <PreviewSatellite prn="PRN 07" value="45.2 dB-Hz" width="88%" />
          <PreviewSatellite prn="PRN 15" value="41.4 dB-Hz" width="76%" />
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums">{value}</p>
    </div>
  );
}

function PreviewSatellite({
  prn,
  value,
  width,
}: {
  prn: string;
  value: string;
  width: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">
        {prn}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-foreground"
          style={{ width }}
        />
      </span>
      <span className="w-20 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {value}
      </span>
    </div>
  );
}
