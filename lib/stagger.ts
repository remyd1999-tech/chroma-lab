import { resolveColor, type ColorStop, type ResolvedColor } from "@/lib/color";
import { clamp, roundTo, wrapHue } from "@/lib/math";

export type StaggerCounts = {
  hue: number;
  chroma: number;
  lightness: number;
};

export type StaggerCombo = {
  stops: ColorStop[];
  colors: ResolvedColor[];
  /** Primary stop after transform — drives the under-swatch label. */
  primary: ColorStop;
  /** Short label under the swatch, reference-style. */
  label: string;
  /** Full values for tooltips / accessibility. */
  detail: string;
  hueIndex: number;
  chromaIndex: number;
  lightnessIndex: number;
};

function linspace(count: number, min: number, max: number, fallback: number): number[] {
  if (count <= 1) return [clamp(roundTo(fallback, 0), min, max)];
  return Array.from({ length: count }, (_, index) =>
    roundTo(min + (index / (count - 1)) * (max - min), 0),
  );
}

/** Even jumps around the wheel: 360° / count. */
export function hueJumpSteps(count: number, baseHue: number): number[] {
  const base = wrapHue(baseHue);
  if (count <= 1) return [base];
  const step = 360 / count;
  return Array.from({ length: count }, (_, index) =>
    wrapHue(base + index * step),
  );
}

export function chromaStaggerSteps(count: number, baseChroma: number): number[] {
  return linspace(count, 0, 100, baseChroma);
}

export function lightnessStaggerSteps(
  count: number,
  baseLightness: number,
): number[] {
  return linspace(count, 0, 100, baseLightness);
}

function comboLabel(parts: {
  showHue: boolean;
  showChroma: boolean;
  showLightness: boolean;
  h: number;
  c: number;
  l: number;
  lightnessIndex: number;
  lightnessCount: number;
}): string {
  const {
    showHue,
    showChroma,
    showLightness,
    h,
    c,
    l,
    lightnessIndex,
    lightnessCount,
  } = parts;

  // Mirror the reference site when only lightness is staggered.
  if (!showHue && !showChroma && showLightness) {
    if (lightnessCount <= 1) return String(Math.round(l));
    return String(Math.round((lightnessIndex / (lightnessCount - 1)) * 1000));
  }

  const bits: string[] = [];
  if (showLightness) bits.push(String(Math.round(l)));
  if (showChroma) bits.push(String(Math.round(c)));
  if (showHue) bits.push(`${Math.round(h)}°`);
  return bits.join(" · ") || String(Math.round(l));
}

/** Shift the whole palette so color 0 lands on the target L/C/H. */
export function shiftPaletteToPrimary(
  stops: ColorStop[],
  primary: ColorStop,
): ColorStop[] {
  const origin = stops[0] ?? primary;
  const dL = primary.l - origin.l;
  const dC = primary.c - origin.c;
  const dH = primary.h - origin.h;

  return stops.map((stop) => ({
    l: clamp(roundTo(stop.l + dL, 0), 0, 100),
    c: clamp(roundTo(stop.c + dC, 0), 0, 100),
    h: wrapHue(stop.h + dH),
  }));
}

/**
 * Cartesian product of hue jumps × chroma stagger × L stagger.
 * Fill order: hue → chroma → lightness (lightness varies fastest along a row).
 */
export function buildStaggerCombos(
  stops: ColorStop[],
  counts: StaggerCounts,
): StaggerCombo[] {
  const origin = stops[0] ?? { l: 50, c: 20, h: 0 };
  const hues = hueJumpSteps(counts.hue, origin.h);
  const chromas = chromaStaggerSteps(counts.chroma, origin.c);
  const lights = lightnessStaggerSteps(counts.lightness, origin.l);

  const showHue = counts.hue > 1;
  const showChroma = counts.chroma > 1;
  const showLightness = counts.lightness > 1;

  const combos: StaggerCombo[] = [];

  hues.forEach((h, hueIndex) => {
    chromas.forEach((c, chromaIndex) => {
      lights.forEach((l, lightnessIndex) => {
        const primary: ColorStop = { l, c, h };
        const shifted = shiftPaletteToPrimary(stops, primary);
        const colors = shifted.map((stop) => resolveColor(stop));
        combos.push({
          stops: shifted,
          colors,
          primary,
          label: comboLabel({
            showHue,
            showChroma,
            showLightness,
            h,
            c,
            l,
            lightnessIndex,
            lightnessCount: counts.lightness,
          }),
          detail: `L ${Math.round(l)} · C ${Math.round(c)} · H ${Math.round(h)}`,
          hueIndex,
          chromaIndex,
          lightnessIndex,
        });
      });
    });
  });

  return combos;
}
