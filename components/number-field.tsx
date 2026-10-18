"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { clamp } from "@/lib/math";
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
    onCommit(clamp(parsed, min, max));
  }

  function nudge(direction: 1 | -1, large: boolean) {
    const delta = (large ? step * 10 : step) * direction;
    const base = draft !== null ? Number.parseFloat(draft) : value;
    const current = Number.isNaN(base) ? value : base;
    const next = clamp(current + delta, min, max);
    setDraft(null);
    onCommit(next);
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
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            nudge(1, event.shiftKey);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            nudge(-1, event.shiftKey);
          }
        }}
        className={cn(
          "h-7 rounded-full border-transparent bg-[#E8E8ED] px-2.5 text-right font-sans text-[12px] font-medium tabular-nums tracking-tight shadow-none focus-visible:border-[#1D1D1F] focus-visible:bg-white focus-visible:ring-0",
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
