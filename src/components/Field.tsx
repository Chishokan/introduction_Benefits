import type { ReactNode } from "react";

export function Field({
  label,
  name,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </label>
      {hint && <p className="mb-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
