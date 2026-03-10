"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-transform outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary! px-4 py-3 text-white!",
        outline: "border border-line bg-card px-4 py-3 text-foreground",
        secondary: "bg-surface px-4 py-3 text-foreground",
        ghost: "bg-transparent px-3 py-2 text-foreground hover:bg-surface-soft",
        destructive: "bg-destructive px-4 py-3 text-primary-foreground",
      },
      size: {
        default: "",
        sm: "px-3 py-2 text-xs",
        lg: "px-6 py-3.5",
        icon: "h-10 w-10 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
