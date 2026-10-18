"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: string;
};

type SegmentedProps<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "default" | "compact";
};

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = "default",
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full rounded-full bg-[#E5E5EA] p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-w-0 flex-1 rounded-full font-medium tracking-tight transition-colors",
              size === "compact"
                ? "h-7 px-1.5 text-[11px]"
                : "h-8 px-2 text-[13px]",
              selected
                ? "bg-white text-[#1D1D1F] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "bg-transparent text-[#6E6E73] hover:text-[#1D1D1F]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
