"use client";

import { useId, useRef, useState } from "react";

import { NumberField } from "@/components/number-field";
import { Label } from "@/components/ui/label";
import type { ResolvedColor } from "@/lib/color";
import { clamp } from "@/lib/math";
import {
  channelGap,
  channelOffset,
  maxChannelGap,
  setChannelGap,
  setChannelOffset,
  setChannelValue,
} from "@/lib/palette";
import { cn } from "@/lib/utils";

type ChannelSliderProps = {
  label: string;
  values: number[];
  colors: ResolvedColor[];
  track: "lightness" | "chroma";
  onChange: (values: number[]) => void;
};

function valueFromClientX(
  clientX: number,
  rect: DOMRect,
): number {
  const ratio = (clientX - rect.left) / rect.width;
  return clamp(Math.round(ratio * 100), 0, 100);
}

export function ChannelSlider({
  label,
  values,
  colors,
  track,
  onChange,
}: ChannelSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: "thumb" | "offset";
    index: number;
    originX: number;
    originValues: number[];
  } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const labelId = useId();

  const gap = channelGap(values);
  const offset = channelOffset(values);
  const min = Math.min(...values);
  const max = Math.max(...values);

  function clientToValue(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return valueFromClientX(clientX, rect);
  }

  function nearestThumb(value: number): number {
    let best = 0;
    let bestDist = Infinity;
    values.forEach((thumb, index) => {
      const dist = Math.abs(thumb - value);
      if (dist < bestDist || (dist === bestDist && index === activeIndex)) {
        best = index;
        bestDist = dist;
      }
    });
    return best;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const value = clientToValue(event.clientX);
    const index = nearestThumb(value);
    const thumbValue = values[index];
    const thumbPx = ((trackRef.current?.getBoundingClientRect().width ?? 0) *
      Math.abs(value - thumbValue)) /
      100;
    const grabbingThumb = thumbPx <= 14;
    const grabbingOffset = !grabbingThumb && value >= min && value <= max;

    dragRef.current = {
      mode: grabbingThumb || !grabbingOffset ? "thumb" : "offset",
      index: grabbingThumb || !grabbingOffset ? index : -1,
      originX: event.clientX,
      originValues: values.slice(),
    };

    if (dragRef.current.mode === "thumb") {
      setActiveIndex(index);
      onChange(setChannelValue(values, index, value));
    }

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.mode === "thumb") {
      onChange(
        setChannelValue(drag.originValues, drag.index, clientToValue(event.clientX)),
      );
      return;
    }

    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const delta = ((event.clientX - drag.originX) / rect.width) * 100;
    onChange(
      setChannelOffset(
        drag.originValues,
        channelOffset(drag.originValues) + delta,
      ),
    );
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  const trackBackground =
    track === "lightness"
      ? "linear-gradient(to right, #000000 0%, #FFFFFF 100%)"
      : `linear-gradient(to right, oklch(62% 0 0), oklch(62% ${Math.max(colors[0]?.displayChroma ?? 0.08, 0.08)} ${colors[0]?.h ?? 250}))`;

  return (
    <section className="flex flex-col gap-3" aria-labelledby={labelId}>
      <div className="flex items-end justify-between gap-3">
        <Label id={labelId} className="text-[13px] font-medium text-[#1D1D1F]">
          {label}
        </Label>
        <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
          {values.map((value, index) => (
            <NumberField
              key={index}
              value={value}
              min={0}
              max={100}
              className="w-[52px]"
              aria-label={`${label} for color ${index + 1}`}
              onCommit={(next) =>
                onChange(setChannelValue(values, index, next))
              }
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-6 text-[11px] tabular-nums text-[#6E6E73]">0</span>
        <div
          ref={trackRef}
          className="relative h-8 flex-1 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="group"
          aria-label={`${label} slider`}
        >
          <div
            className="absolute top-1/2 right-0 left-0 h-[3px] -translate-y-1/2 rounded-full"
            style={{ background: trackBackground }}
          />
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#1D1D1F]/16"
            style={{
              left: `${min}%`,
              width: `${Math.max(max - min, 0)}%`,
            }}
          />
          {values.map((value, index) => {
            const color = colors[index];
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                role="slider"
                aria-label={`${label} ${index + 1}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                className={cn(
                  "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D2D2D7] bg-white",
                  isActive ? "z-20" : "z-10",
                )}
                style={{ left: `${value}%` }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  setActiveIndex(index);
                  dragRef.current = {
                    mode: "thumb",
                    index,
                    originX: event.clientX,
                    originValues: values.slice(),
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onKeyDown={(event) => {
                  const step = event.shiftKey ? 10 : 1;
                  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    onChange(setChannelValue(values, index, value - step));
                  }
                  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    onChange(setChannelValue(values, index, value + step));
                  }
                }}
              >
                <span
                  className="absolute inset-[3px] rounded-full"
                  style={{ background: color?.displayCss ?? "#888" }}
                />
              </button>
            );
          })}
        </div>
        <span className="w-8 text-right text-[11px] tabular-nums text-[#6E6E73]">
          100
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center justify-between gap-2 text-[12px] text-[#6E6E73]">
          Offset
          <NumberField
            value={Math.round(offset)}
            min={0}
            max={100}
            className="w-[56px]"
            aria-label={`${label} offset`}
            onCommit={(next) => onChange(setChannelOffset(values, next))}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-[12px] text-[#6E6E73]">
          Gap
          <NumberField
            value={Math.round(gap)}
            min={0}
            max={Math.round(maxChannelGap(values))}
            className="w-[56px]"
            aria-label={`${label} gap`}
            onCommit={(next) => onChange(setChannelGap(values, next))}
          />
        </label>
      </div>
    </section>
  );
}
