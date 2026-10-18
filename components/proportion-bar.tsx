"use client";

import { useRef } from "react";

import { Label } from "@/components/ui/label";
import type { ResolvedColor } from "@/lib/color";
import { clamp } from "@/lib/math";
import { cumulativeStops, setProportion } from "@/lib/palette";

type ProportionBarProps = {
  values: number[];
  colors: ResolvedColor[];
  onChange: (values: number[]) => void;
};

const HANDLE = 36;

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
      <Label className="text-[13px] font-medium text-[#1D1D1F]">
        Proportion
      </Label>

      <div
        ref={trackRef}
        className="relative h-9 overflow-visible rounded-full bg-[#E5E5EA]"
      >
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {values.map((value, index) => {
            const showLabel = value >= 14;
            return (
              <div
                key={index}
                className="absolute inset-y-0 flex items-center justify-center"
                style={{
                  left: `${index === 0 ? 0 : stops[index - 1]}%`,
                  width: `${value}%`,
                  background: colors[index]?.displayCss,
                }}
              >
                {showLabel ? (
                  <span
                    className="pointer-events-none text-[12px] font-semibold tabular-nums"
                    style={{ color: colors[index]?.labelColor ?? "#1D1D1F" }}
                  >
                    {value}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {stops.map((stop, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Resize color ${index + 1} and ${index + 2}`}
            className="absolute top-1/2 z-10 size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
            style={{ left: `${stop}%`, width: HANDLE, height: HANDLE }}
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
          />
        ))}
      </div>
    </section>
  );
}
