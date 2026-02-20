import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
        destructive:
          "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:opacity-90",
        success:
          "bg-[var(--color-success)] text-[var(--color-success-foreground)] hover:opacity-90",
        outline:
          "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
        secondary:
          "bg-[var(--color-muted)] text-[var(--color-foreground)] hover:opacity-80",
        ghost:
          "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
        link:
          "text-[var(--color-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
