"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import { clamp } from "@/lib/math";
import { cn } from "@/lib/utils";

type CountSliderProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (value: number) => void;
  className?: string;
};

export function CountSlider({
  label,
  value,
  min = 1,
  max = 24,
  suffix,
  onChange,
  className,
}: CountSliderProps) {
  const id = useId();
  const display = suffix ? `${value}${suffix}` : String(value);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Label
        htmlFor={id}
        className="w-[4.5rem] shrink-0 text-[12px] font-medium text-[#1D1D1F]"
      >
        {label}
      </Label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuetext={display}
        onChange={(event) =>
          onChange(clamp(Number(event.target.value), min, max))
        }
        className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[#E5E5EA] accent-[#1D1D1F] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
      />
      <span className="w-10 shrink-0 text-right text-[12px] font-semibold tabular-nums text-[#3A3A3C]">
        {display}
      </span>
    </div>
  );
}
