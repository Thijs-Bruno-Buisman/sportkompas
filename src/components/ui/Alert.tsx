import React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
  className = "",
}: AlertProps) {
  const variantStyles = {
    info: {
      container:
        "border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200",
      icon: <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />,
    },
    success: {
      container:
        "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    },
    warning: {
      container:
        "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
    },
    error: {
      container:
        "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200",
      icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
    },
  };

  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-4 flex gap-3 text-sm transition-all ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm opacity-90 leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="min-w-[44px] min-h-[44px] w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-xl opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Sluit melding"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

