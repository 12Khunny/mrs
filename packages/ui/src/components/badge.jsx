import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-transparent",
        secondary: "bg-[var(--color-muted)] text-[var(--color-foreground)] border-transparent",
        success: "bg-[var(--color-success)] text-[var(--color-success-foreground)] border-transparent",
        destructive: "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] border-transparent",
        warning: "bg-[var(--color-warning)] text-[var(--color-warning-foreground)] border-transparent",
        outline: "text-[var(--color-foreground)] border-[var(--color-border)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

