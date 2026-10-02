import React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", hasError = false, disabled = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={`w-full min-h-[88px] px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError
            ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
            : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

