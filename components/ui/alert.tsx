import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "rounded-2xl border px-5 py-4 shadow-md",
  {
    variants: {
      tone: {
        info: "border-line bg-card text-foreground",
        warning: "border-warning bg-warning-soft text-warning-foreground",
        error: "border-destructive bg-destructive/10 text-destructive",
        success: "border-success bg-success-soft text-success-foreground",
      },
    },
    defaultVariants: {
      tone: "info",
    },
  },
);

function Alert({
  className,
  tone,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div className={cn(alertVariants({ tone }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm font-semibold", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-2 text-sm leading-7", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
