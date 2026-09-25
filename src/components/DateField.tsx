"use client";

import { useRef } from "react";
import { Field } from "@/components/Field";
import { toDateInput, todayInput } from "@/lib/dates";

export function DateField({
  label,
  name,
  value,
  hint,
}: {
  label: string;
  name: string;
  value: Date | null;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Field label={label} name={name} hint={hint}>
      <div className="flex gap-1.5">
        <input ref={ref} id={name} name={name} type="date" defaultValue={toDateInput(value)} className="input" />
        <button
          type="button"
          className="btn-secondary shrink-0 px-2 text-xs"
          onClick={() => {
            if (ref.current) ref.current.value = todayInput();
          }}
        >
          今日
        </button>
      </div>
    </Field>
  );
}
