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
  /** Kept for call-site stability; track chrome is grayscale. */
  colors?: ResolvedColor[];
  track?: "lightness" | "chroma";
  onChange: (values: number[]) => void;
};

const HANDLE = 36;

function valueFromClientX(clientX: number, rect: DOMRect): number {
  const ratio = (clientX - rect.left) / rect.width;
  return clamp(Math.round(ratio * 100), 0, 100);
}

export function ChannelSlider({
  label,
  values,
  colors = [],
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
  const span = Math.max(max - min, 0);
  const mid = (min + max) / 2;
  const showSpan = span >= 18;

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
    const thumbPx =
      ((trackRef.current?.getBoundingClientRect().width ?? 0) *
        Math.abs(value - thumbValue)) /
      100;
    const grabbingThumb = thumbPx <= HANDLE / 2 + 4;
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
        setChannelValue(
          drag.originValues,
          drag.index,
          clientToValue(event.clientX),
        ),
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

  return (
    <section className="flex flex-col gap-3" aria-labelledby={labelId}>
      <Label id={labelId} className="text-[13px] font-medium text-[#1D1D1F]">
        {label}
      </Label>

      <div
        ref={trackRef}
        className="relative h-9 touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="group"
        aria-label={`${label} slider`}
      >
        <div className="absolute inset-0 rounded-full bg-[#E5E5EA]" />
        <div
          className="absolute inset-y-0 rounded-full bg-[#8E8E93]"
          style={{
            left: `${min}%`,
            width: `${span}%`,
          }}
        />
        {showSpan ? (
          <span
            className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-semibold text-white tabular-nums"
            style={{ left: `${mid}%` }}
          >
            {Math.round(gap)}
          </span>
        ) : null}
        {values.map((value, index) => {
          const isActive = index === activeIndex;
          const color = colors[index];
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
                "absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums shadow-[0_1px_3px_rgba(0,0,0,0.18)] ring-2 ring-white",
                isActive ? "z-20" : "z-10",
              )}
              style={{
                left: `${value}%`,
                background: color?.displayCss ?? "#FFFFFF",
                color: color?.labelColor ?? "#1D1D1F",
              }}
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
              {value}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center justify-start gap-2 text-[12px] text-[#6E6E73]">
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
        <label className="flex items-center justify-start gap-2 text-[12px] text-[#6E6E73]">
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
