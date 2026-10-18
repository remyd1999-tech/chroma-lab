"use client";

import { useMemo, useRef } from "react";

import { Label } from "@/components/ui/label";
import {
  clampChromaToSrgb,
  formatOklch,
  lightnessToUnit,
  type ResolvedColor,
  uiChromaToOklch,
} from "@/lib/color";
import {
  type HarmonyId,
  harmonyById,
  harmoniesForCount,
} from "@/lib/harmonies";
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

const SIZE = 260;
const CENTER = SIZE / 2;
const RING_INSET = 2;
const RING_THICKNESS = 46;
const OUTER_RADIUS = CENTER - RING_INSET;
const RING_RADIUS = OUTER_RADIUS - RING_THICKNESS / 2;
const CENTER_DOT = 5;
const LINE_COLOR = "#A1A1A6";

type Point = { x: number; y: number; h: number; index: number };

function polar(hue: number, radius: number) {
  const radians = (hue * Math.PI) / 180;
  return {
    x: CENTER - radius * Math.sin(radians),
    y: CENTER + radius * Math.cos(radians),
  };
}

function hueFromPoint(clientX: number, clientY: number, rect: DOMRect): number {
  const x = ((clientX - rect.left) / rect.width) * SIZE - CENTER;
  const y = ((clientY - rect.top) / rect.height) * SIZE - CENTER;
  const angle = (Math.atan2(-x, y) * 180) / Math.PI;
  return wrapHue(angle);
}

function sortedByHue(points: Point[]): Point[] {
  return points.slice().sort((a, b) => a.h - b.h || a.index - b.index);
}

/** Complementary-ish pairs: each point linked to the one closest to +180°. */
function diameterPairs(points: Point[]): [Point, Point][] {
  if (points.length < 2) return [];
  const used = new Set<number>();
  const pairs: [Point, Point][] = [];

  for (const point of points) {
    if (used.has(point.index)) continue;
    let best: Point | null = null;
    let bestScore = Infinity;
    for (const other of points) {
      if (other.index === point.index || used.has(other.index)) continue;
      const delta = Math.abs(Math.abs(hueDelta(point.h, other.h)) - 180);
      if (delta < bestScore) {
        bestScore = delta;
        best = other;
      }
    }
    if (best) {
      used.add(point.index);
      used.add(best.index);
      pairs.push([point, best]);
    }
  }
  return pairs;
}

function relationshipPaths(
  harmony: HarmonyId,
  points: Point[],
): { lines: [Point, Point][]; polygon: string | null } {
  if (points.length < 2) {
    return { lines: [], polygon: null };
  }

  const style = harmonyById(harmony).linkStyle;
  const ordered = sortedByHue(points);

  if (style === "none") {
    return { lines: [], polygon: null };
  }

  if (style === "diameters") {
    return { lines: diameterPairs(points), polygon: null };
  }

  if (style === "arc") {
    const lines: [Point, Point][] = [];
    for (let i = 0; i < ordered.length - 1; i += 1) {
      lines.push([ordered[i], ordered[i + 1]]);
    }
    return { lines, polygon: null };
  }

  // polygon — closed shape in hue order
  const polygon = `${ordered.map((p) => `${p.x},${p.y}`).join(" ")}`;
  return { lines: [], polygon };
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
  const surfaceRef = useRef<HTMLDivElement>(null);
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
    return `conic-gradient(from 180deg, ${stops.join(", ")})`;
  }, [colors]);

  const points: Point[] = useMemo(
    () =>
      colors.map((color, index) => {
        const pos = polar(color.h, RING_RADIUS);
        return { ...pos, h: wrapHue(color.h), index };
      }),
    [colors],
  );

  const links = useMemo(
    () => relationshipPaths(harmony, points),
    [harmony, points],
  );

  function setFromPointer(index: number, clientX: number, clientY: number) {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const hue = hueFromPoint(clientX, clientY, rect);
    if (locked) {
      const current = colors[index]?.h ?? baseHue;
      onRotate(wrapHue(baseHue + hueDelta(current, hue)));
      return;
    }
    onHueChange(index, hue);
  }

  const insetPercent = (RING_INSET / SIZE) * 100;
  const thicknessPercent = (RING_THICKNESS / SIZE) * 100;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <Label className="text-[13px] font-medium text-[#1D1D1F]">Hue</Label>
        <p className="text-[11px] text-[#6E6E73]">
          {locked ? "Preset rotates as a set" : "Drag each handle freely"}
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
                  ? "h-7 rounded-full bg-[#1D1D1F] px-2.5 text-[11px] font-medium text-white"
                  : "h-7 rounded-full bg-[#E8E8ED] px-2.5 text-[11px] font-medium text-[#1D1D1F] hover:bg-[#D2D2D7]"
              }
            >
              {preset.short}
            </button>
          );
        })}
      </div>

      <div
        ref={surfaceRef}
        className="relative mx-auto aspect-square w-[92%] touch-none"
        role="group"
        aria-label="OKLCH hue wheel"
      >
        <div
          className="absolute rounded-full shadow-[0_10px_32px_rgba(0,0,0,0.14)]"
          style={{ inset: `${insetPercent}%` }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: wheelGradient,
              WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thicknessPercent}%), #000 calc(100% - ${thicknessPercent}% + 0.4%))`,
              mask: `radial-gradient(farthest-side, transparent calc(100% - ${thicknessPercent}%), #000 calc(100% - ${thicknessPercent}% + 0.4%))`,
            }}
          />
        </div>

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          {links.polygon ? (
            <polygon
              points={links.polygon}
              fill="none"
              stroke={LINE_COLOR}
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
          ) : null}
          {links.lines.map(([a, b]) => (
            <line
              key={`${a.index}-${b.index}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={LINE_COLOR}
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          ))}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={CENTER_DOT}
            fill="#3A3A3C"
          />
        </svg>

        {colors.map((color, index) => {
          const point = polar(color.h, RING_RADIUS);
          return (
            <button
              key={index}
              type="button"
              aria-label={`Hue ${Math.round(wrapHue(color.h))}`}
              className="absolute z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full text-[12px] font-semibold tabular-nums shadow-[0_1px_3px_rgba(0,0,0,0.18)] active:cursor-grabbing"
              style={{
                left: `${(point.x / SIZE) * 100}%`,
                top: `${(point.y / SIZE) * 100}%`,
                background: color.displayCss,
                color: color.labelColor,
              }}
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
              onPointerCancel={() => {
                dragIndex.current = null;
              }}
            >
              {Math.round(wrapHue(color.h))}
            </button>
          );
        })}
      </div>
    </section>
  );
}
