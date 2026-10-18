"use client";

import { useMemo, useRef } from "react";

import { NumberField } from "@/components/number-field";
import { Label } from "@/components/ui/label";
import {
  clampChromaToSrgb,
  formatOklch,
  lightnessToUnit,
  type ResolvedColor,
  uiChromaToOklch,
} from "@/lib/color";
import { type HarmonyId, harmoniesForCount } from "@/lib/harmonies";
import { hueDelta, wrapHue } from "@/lib/math";

type HueWheelProps = {
  colors: ResolvedColor[];
  count: number;
  harmony: HarmonyId;
  baseHue: number;
  onHarmonyChange: (harmony: HarmonyId) => void;
  onRotate: (baseHue: number) => void;
  onHueChange: (index: number, hue: number) => void;
};

const SIZE = 240;
const CENTER = SIZE / 2;
const POINT_RADIUS = 82;

function polar(hue: number, radius: number) {
  const radians = ((hue - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function hueFromPoint(clientX: number, clientY: number, rect: DOMRect): number {
  const x = ((clientX - rect.left) / rect.width) * SIZE - CENTER;
  const y = ((clientY - rect.top) / rect.height) * SIZE - CENTER;
  const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
  return wrapHue(angle);
}

export function HueWheel({
  colors,
  count,
  harmony,
  baseHue,
  onHarmonyChange,
  onRotate,
  onHueChange,
}: HueWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragIndex = useRef<number | null>(null);
  const presets = harmoniesForCount(count);
  const locked = harmony !== "custom";

  const wheelGradient = useMemo(() => {
    const l =
      colors.reduce((sum, color) => sum + color.l, 0) / Math.max(colors.length, 1);
    const c =
      colors.reduce((sum, color) => sum + color.c, 0) / Math.max(colors.length, 1);
    const requested = uiChromaToOklch(c);
    const stops: string[] = [];
    for (let hue = 0; hue <= 360; hue += 15) {
      const safe = clampChromaToSrgb(lightnessToUnit(l), requested, hue);
      stops.push(`${formatOklch(l, safe, hue)} ${hue}deg`);
    }
    return `conic-gradient(from 0deg, ${stops.join(", ")})`;
  }, [colors]);

  const polygon = colors
    .map((color) => polar(color.h, POINT_RADIUS))
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  function setFromPointer(index: number, clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const hue = hueFromPoint(clientX, clientY, rect);
    if (locked) {
      const current = colors[index]?.h ?? baseHue;
      onRotate(wrapHue(baseHue + hueDelta(current, hue)));
      return;
    }
    onHueChange(index, hue);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <Label className="text-[13px] font-medium text-[#1D1D1F]">Hue</Label>
        <p className="text-[11px] text-[#6E6E73]">
          {locked ? "Preset rotates as a set" : "Drag each point freely"}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const selected = preset.id === harmony;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onHarmonyChange(preset.id)}
              className={
                selected
                  ? "h-7 rounded-md bg-[#1D1D1F] px-2 text-[11px] font-medium text-white"
                  : "h-7 rounded-md bg-[#E8E8ED] px-2 text-[11px] font-medium text-[#1D1D1F] hover:bg-[#D2D2D7]"
              }
            >
              {preset.short}
            </button>
          );
        })}
      </div>

      <div className="relative mx-auto aspect-square w-[min(100%,240px)]">
        <div
          className="absolute inset-[8px] rounded-full"
          style={{ background: wheelGradient }}
        />
        <div className="absolute inset-[42px] rounded-full bg-white" />
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 h-full w-full touch-none"
          role="group"
          aria-label="OKLCH hue wheel"
        >
          {colors.length > 1 ? (
            <polygon
              points={polygon}
              fill="none"
              stroke="#1D1D1F"
              strokeOpacity="0.28"
              strokeWidth="1"
            />
          ) : null}
          {colors.map((color, index) => {
            const point = polar(color.h, POINT_RADIUS);
            const label = polar(color.h, POINT_RADIUS + 24);
            return (
              <g key={index}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={point.x}
                  y2={point.y}
                  stroke="#1D1D1F"
                  strokeOpacity="0.12"
                  strokeWidth="1"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="9"
                  fill={color.displayCss}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="cursor-grab"
                  onPointerDown={(event) => {
                    dragIndex.current = index;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setFromPointer(index, event.clientX, event.clientY);
                  }}
                  onPointerMove={(event) => {
                    if (dragIndex.current !== index) return;
                    setFromPointer(index, event.clientX, event.clientY);
                  }}
                  onPointerUp={() => {
                    dragIndex.current = null;
                  }}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-[#1D1D1F] text-[10px] font-medium tabular-nums"
                >
                  {`${Math.round(color.h)}°`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap justify-end gap-1.5">
        {colors.map((color, index) => (
          <NumberField
            key={index}
            value={Math.round(wrapHue(color.h))}
            min={0}
            max={360}
            suffix="°"
            className="w-[64px]"
            aria-label={`Hue for color ${index + 1}`}
            onCommit={(next) => {
              if (locked && index === 0) {
                onRotate(wrapHue(baseHue + (next - color.h)));
                return;
              }
              onHueChange(index, wrapHue(next));
            }}
          />
        ))}
      </div>
    </section>
  );
}
