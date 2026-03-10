"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "info" | "warning" | "error";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
  toasts: ToastRecord[];
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<
  ToastTone,
  {
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    className: "border-success/30 bg-success-soft text-success-foreground",
  },
  info: {
    icon: Info,
    className: "border-primary/20 bg-card text-foreground",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-warning/35 bg-warning-soft text-warning-foreground",
  },
  error: {
    icon: TriangleAlert,
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
};

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const counterRef = React.useRef(0);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = React.useCallback((input: ToastInput) => {
    counterRef.current += 1;
    setToasts((current) => [
      ...current,
      {
        id: `toast-${counterRef.current}`,
        tone: input.tone ?? "info",
        durationMs: input.durationMs ?? 4000,
        title: input.title,
        description: input.description,
      },
    ]);
  }, []);

  const value = React.useMemo(
    () => ({
      toast,
      dismiss,
      toasts,
    }),
    [dismiss, toast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

function Toaster() {
  const context = React.useContext(ToastContext);

  if (!context) {
    return null;
  }

  return (
    <>
      {context.toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const toneStyle = TOAST_STYLES[tone];
        const Icon = toneStyle.icon;

        return (
          <ToastPrimitives.Root
            key={toast.id}
            open
            duration={toast.durationMs}
            onOpenChange={(open) => {
              if (!open) {
                context.dismiss(toast.id);
              }
            }}
            className={cn(
              "pointer-events-auto w-full rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm",
              toneStyle.className,
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <ToastPrimitives.Title className="text-sm font-semibold">
                  {toast.title}
                </ToastPrimitives.Title>
                {toast.description ? (
                  <ToastPrimitives.Description className="mt-1 text-sm leading-6 opacity-90">
                    {toast.description}
                  </ToastPrimitives.Description>
                ) : null}
              </div>
              <ToastPrimitives.Close className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/10 bg-white/40 text-current transition hover:-translate-y-0.5">
                <X className="h-3.5 w-3.5" />
              </ToastPrimitives.Close>
            </div>
          </ToastPrimitives.Root>
        );
      })}
      <ToastPrimitives.Viewport className="pointer-events-none fixed right-4 top-4 z-[1300] flex w-full max-w-sm flex-col gap-3 outline-none" />
    </>
  );
}

export { ToastProvider, Toaster, useToast };
