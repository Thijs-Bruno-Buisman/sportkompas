import React from "react";
import { Label } from "./Label";

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  required = false,
  error,
  helperText,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p
          id={id ? `${id}-error` : undefined}
          className="text-xs font-medium text-rose-500 mt-1"
          role="alert"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={id ? `${id}-helper` : undefined}
          className="text-xs text-slate-500 dark:text-slate-400 mt-1"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
