"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<
  ToastTone,
  {
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    className:
      "border-success/30 bg-success-soft text-success-foreground",
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

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    counterRef.current += 1;

    const nextToast: ToastRecord = {
      id: `toast-${counterRef.current}`,
      tone: input.tone ?? "info",
      durationMs: input.durationMs ?? 4000,
      title: input.title,
      description: input.description,
    };

    setToasts((current) => [...current, nextToast]);
  }, []);

  const value = useMemo(
    () => ({
      toast,
      dismiss,
      toasts,
    }),
    [dismiss, toast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs ?? 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onDismiss, toast.durationMs, toast.id]);

  const tone = toast.tone ?? "info";
  const toneStyle = TOAST_STYLES[tone];
  const Icon = toneStyle.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto w-full rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm",
        toneStyle.className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm leading-6 opacity-90">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/10 bg-white/40 text-current transition hover:-translate-y-0.5"
          aria-label="Dismiss toast"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const context = useContext(ToastContext);

  if (!context) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {context.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={context.dismiss} />
      ))}
    </div>
  );
}
