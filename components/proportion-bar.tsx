"use client";

import { useRef } from "react";

import { NumberField } from "@/components/number-field";
import { Label } from "@/components/ui/label";
import type { ResolvedColor } from "@/lib/color";
import { clamp } from "@/lib/math";
import {
  MIN_PROPORTION,
  cumulativeStops,
  setProportion,
} from "@/lib/palette";

type ProportionBarProps = {
  values: number[];
  colors: ResolvedColor[];
  onChange: (values: number[]) => void;
};

export function ProportionBar({
  values,
  colors,
  onChange,
}: ProportionBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stops = cumulativeStops(values);

  function updateFromClientX(index: number, clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const percent = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const previous = index === 0 ? 0 : stops[index - 1];
    onChange(setProportion(values, index, percent - previous));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <Label className="text-[13px] font-medium text-[#1D1D1F]">
          Proportion
        </Label>
        <div className="flex flex-wrap justify-end gap-1.5">
          {values.map((value, index) => (
            <NumberField
              key={index}
              value={value}
              min={MIN_PROPORTION}
              max={100 - MIN_PROPORTION * (values.length - 1)}
              suffix="%"
              className="w-[58px]"
              aria-label={`Proportion for color ${index + 1}`}
              onCommit={(next) => onChange(setProportion(values, index, next))}
            />
          ))}
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative flex h-10 overflow-hidden rounded-md border border-[#D2D2D7] bg-white"
      >
        {values.map((value, index) => (
          <div
            key={index}
            className="relative h-full min-w-0"
            style={{
              width: `${value}%`,
              background: colors[index]?.displayCss,
            }}
          />
        ))}
        {stops.map((stop, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Resize color ${index + 1} and ${index + 2}`}
            className="absolute top-0 z-10 h-full w-3 -translate-x-1/2 cursor-ew-resize touch-none"
            style={{ left: `${stop}%` }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateFromClientX(index, event.clientX);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                return;
              }
              updateFromClientX(index, event.clientX);
            }}
          >
            <span className="absolute top-1/2 left-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.18)]" />
          </button>
        ))}
      </div>
    </section>
  );
}
