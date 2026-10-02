import React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className = "", hasError = false, disabled = false, children, ...props },
    ref
  ) => {
    return (
      <select
        ref={ref}
        disabled={disabled}
        className={`w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError
            ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
            : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

