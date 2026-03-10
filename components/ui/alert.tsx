import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "rounded-2xl border px-5 py-4 shadow-sm",
  {
    variants: {
      tone: {
        info: "border-primary/20 bg-primary/5 text-foreground",
        warning:
          "border-warning/35 bg-warning-soft text-warning-foreground",
        error:
          "border-destructive/35 bg-destructive/10 text-destructive",
        success:
          "border-success/35 bg-success-soft text-success-foreground",
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
  return (
    <p className={cn("text-sm font-semibold tracking-[-0.02em]", className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-2 text-sm leading-7", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
