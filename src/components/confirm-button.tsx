"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ConfirmButton({
  children,
  confirmMessage,
  variant = "outline",
  size = "default",
  className,
}: {
  children: React.ReactNode;
  confirmMessage: string;
  variant?: "outline" | "destructive" | "ghost" | "default";
  size?: "default" | "sm" | "xs";
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Working…" : children}
    </Button>
  );
}
