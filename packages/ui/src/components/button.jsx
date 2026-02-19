import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[--color-primary] text-[--color-primary-foreground] hover:bg-[--color-primary]/90",
        destructive:
          "bg-[--color-destructive] text-[--color-destructive-foreground] hover:bg-[--color-destructive]/90",
        success:
          "bg-[--color-success] text-[--color-success-foreground] hover:bg-[--color-success]/90",
        outline:
          "border border-[--color-border] bg-transparent hover:bg-[--color-muted] hover:text-[--color-foreground]",
        secondary:
          "bg-[--color-muted] text-[--color-foreground] hover:bg-[--color-muted]/80",
        ghost:
          "hover:bg-[--color-muted] hover:text-[--color-foreground]",
        link:
          "text-[--color-primary] underline-offset-4 hover:underline",
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
