import React from "react";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({
  children,
  className = "",
  required = false,
  ...props
}: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 select-none ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
    </label>
  );
}

