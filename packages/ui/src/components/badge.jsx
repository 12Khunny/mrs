import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[--color-primary] text-[--color-primary-foreground] border-transparent",
        secondary: "bg-[--color-muted] text-[--color-foreground] border-transparent",
        success: "bg-[--color-success] text-[--color-success-foreground] border-transparent",
        destructive: "bg-[--color-destructive] text-[--color-destructive-foreground] border-transparent",
        warning: "bg-[--color-warning] text-[--color-warning-foreground] border-transparent",
        outline: "text-[--color-foreground] border-[--color-border]",
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
