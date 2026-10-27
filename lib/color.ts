import { converter, formatHex, inGamut, parse } from "culori";

import { clamp, roundChannel, roundTo, wrapHue } from "@/lib/math";

const toOklch = converter("oklch");

export type ColorStop = {
  l: number;
  c: number;
  h: number;
};

/** Display clamp target. Default rendering uses P3. */
export type DisplayGamut = "p3" | "srgb";

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
const srgbGamutCheck = inGamut("rgb");
const p3GamutCheck = inGamut("p3");

export function uiChromaToOklch(c: number): number {
  return (clamp(c, 0, 100) / 100) * MAX_CHROMA;
}

export function oklchChromaToUi(chroma: number): number {
  return clamp((chroma / MAX_CHROMA) * 100, 0, 100);
}

export function lightnessToUnit(l: number): number {
  return clamp(l, 0, 100) / 100;
}

function isInGamut(
  gamut: DisplayGamut,
  l: number,
  chroma: number,
  h: number,
): boolean {
  const check = gamut === "p3" ? p3GamutCheck : srgbGamutCheck;
  return check({
    mode: "oklch",
    l,
    c: chroma,
    h,
  });
}

export function clampChromaToGamut(
  gamut: DisplayGamut,
  l: number,
  chroma: number,
  h: number,
): number {
  const lightness = clamp(l, 0, 1);
  const requested = Math.max(0, chroma);
  if (isInGamut(gamut, lightness, requested, h)) {
    return requested;
  }

  let low = 0;
  let high = requested;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (isInGamut(gamut, lightness, mid, h)) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

export function formatOklch(l: number, chroma: number, h: number): string {
  const lightness = roundTo(l, 2).toFixed(2);
  const c = roundTo(chroma, 3).toFixed(3);
  const hue = roundTo(h, 1).toFixed(1);
  return `oklch(${lightness}% ${c} ${hue})`;
}

export function resolveColor(
  stop: ColorStop,
  gamut: DisplayGamut = "p3",
): ResolvedColor {
  const l = clamp(stop.l, 0, 100);
  const c = clamp(stop.c, 0, 100);
  const h = ((stop.h % 360) + 360) % 360;
  const chroma = uiChromaToOklch(c);
  const unitL = lightnessToUnit(l);
  const displayChroma = clampChromaToGamut(gamut, unitL, chroma, h);
  const hexChroma = clampChromaToGamut("srgb", unitL, chroma, h);
  const inRange = isInGamut(gamut, unitL, chroma, h);
  const css = formatOklch(l, chroma, h);
  const displayCss = formatOklch(l, displayChroma, h);
  const hex =
    formatHex({
      mode: "oklch",
      l: unitL,
      c: hexChroma,
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

/** Adjacent filled squares as SVG markup (clipboard-friendly). */
export function swatchSvg(colors: ResolvedColor[], size = 100): string {
  if (colors.length === 0) return "";
  const width = size * colors.length;
  const rects = colors
    .map(
      (color, index) =>
        `<rect x="${index * size}" y="0" width="${size}" height="${size}" fill="${color.hex}"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${size}" viewBox="0 0 ${width} ${size}">${rects}</svg>`;
}

export function normalizeHexInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

/** Parse a hex (or CSS color) string into a UI ColorStop, or null if invalid. */
export function stopFromHex(raw: string): ColorStop | null {
  const normalized = normalizeHexInput(raw);
  if (!normalized || normalized === "#") return null;
  const parsed = parse(normalized);
  if (!parsed) return null;
  const oklch = toOklch(parsed);
  if (!oklch || oklch.l == null) return null;
  return {
    l: roundChannel((oklch.l ?? 0) * 100),
    c: roundChannel(oklchChromaToUi(oklch.c ?? 0)),
    h: wrapHue(oklch.h ?? 0),
  };
}

export function keepLockedStops(
  previous: ColorStop[],
  next: ColorStop[],
  locks: boolean[],
): ColorStop[] {
  return next.map((stop, index) => (locks[index] ? previous[index] ?? stop : stop));
}
