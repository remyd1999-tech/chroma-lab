"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberFieldProps = {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  suffix?: string;
  "aria-label": string;
  className?: string;
};

function formatValue(value: number, decimals: number): string {
  if (decimals <= 0) return String(Math.round(value));
  return value.toFixed(decimals);
}

export function NumberField({
  value,
  onCommit,
  min = 0,
  max = 100,
  step = 1,
  decimals = 0,
  suffix,
  className,
  "aria-label": ariaLabel,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? formatValue(value, decimals);

  function commit(raw: string) {
    const parsed = Number.parseFloat(raw);
    setDraft(null);
    if (Number.isNaN(parsed)) {
      return;
    }
    onCommit(parsed);
  }

  return (
    <div className="relative">
      <Input
        aria-label={ariaLabel}
        inputMode="decimal"
        value={text}
        step={step}
        min={min}
        max={max}
        onFocus={() => setDraft(formatValue(value, decimals))}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className={cn(
          "h-7 rounded-md border-[#D2D2D7] bg-white px-2 text-right font-sans text-[13px] tabular-nums tracking-tight shadow-none focus-visible:border-[#1D1D1F] focus-visible:ring-0",
          suffix ? "pr-6" : "",
          className,
        )}
      />
      {suffix ? (
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-[#6E6E73]">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
