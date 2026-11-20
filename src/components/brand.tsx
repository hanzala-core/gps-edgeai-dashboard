import Link from "next/link";
import { Radio } from "lucide-react";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
        <Radio className="size-4" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold tracking-tight">GPS-EdgeAI</span>
    </Link>
  );
}
