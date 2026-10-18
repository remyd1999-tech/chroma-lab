import { formatHex, inGamut } from "culori";

import { clamp, roundTo } from "@/lib/math";

export type ColorStop = {
  l: number;
  c: number;
  h: number;
};

export type ResolvedColor = ColorStop & {
  chroma: number;
  displayChroma: number;
  inGamut: boolean;
  css: string;
  displayCss: string;
  hex: string;
  labelColor: "#1D1D1F" | "#F5F5F7";
};

const MAX_CHROMA = 0.4;
const gamutCheck = inGamut("rgb");

export function uiChromaToOklch(c: number): number {
  return (clamp(c, 0, 100) / 100) * MAX_CHROMA;
}

export function oklchChromaToUi(chroma: number): number {
  return clamp((chroma / MAX_CHROMA) * 100, 0, 100);
}

export function lightnessToUnit(l: number): number {
  return clamp(l, 0, 100) / 100;
}

function isInSrgb(l: number, chroma: number, h: number): boolean {
  return gamutCheck({
    mode: "oklch",
    l,
    c: chroma,
    h,
  });
}

export function clampChromaToSrgb(l: number, chroma: number, h: number): number {
  const lightness = clamp(l, 0, 1);
  const requested = Math.max(0, chroma);
  if (isInSrgb(lightness, requested, h)) {
    return requested;
  }

  let low = 0;
  let high = requested;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (isInSrgb(lightness, mid, h)) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

export function formatOklch(l: number, chroma: number, h: number): string {
  const lightness = roundTo(l, 1).toFixed(1);
  const c = roundTo(chroma, 3).toFixed(3);
  const hue = roundTo(h, 1).toFixed(1);
  return `oklch(${lightness}% ${c} ${hue})`;
}

export function resolveColor(stop: ColorStop): ResolvedColor {
  const l = clamp(stop.l, 0, 100);
  const c = clamp(stop.c, 0, 100);
  const h = ((stop.h % 360) + 360) % 360;
  const chroma = uiChromaToOklch(c);
  const displayChroma = clampChromaToSrgb(lightnessToUnit(l), chroma, h);
  const inRange = isInSrgb(lightnessToUnit(l), chroma, h);
  const css = formatOklch(l, chroma, h);
  const displayCss = formatOklch(l, displayChroma, h);
  const hex =
    formatHex({
      mode: "oklch",
      l: lightnessToUnit(l),
      c: displayChroma,
      h,
    }) ?? "#000000";

  return {
    l,
    c,
    h,
    chroma,
    displayChroma,
    inGamut: inRange,
    css,
    displayCss,
    hex,
    labelColor: l >= 55 ? "#1D1D1F" : "#F5F5F7",
  };
}

export function cssVariablesBlock(colors: ResolvedColor[]): string {
  const lines = colors.map(
    (color, index) => `  --chroma-${index + 1}: ${color.css};`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

export function hexList(colors: ResolvedColor[]): string {
  return colors.map((color) => color.hex).join("\n");
}

export function oklchList(colors: ResolvedColor[]): string {
  return colors.map((color) => color.css).join("\n");
}
