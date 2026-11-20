"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function DemoLoginButton({
  label = "Try the demo",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className={className ?? "h-10 px-4"}
      disabled={pending}
    >
      {pending ? "Preparing demo…" : label}
    </Button>
  );
}
