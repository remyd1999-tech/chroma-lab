import { wrapHue } from "@/lib/math";

export type HarmonyId =
  | "primary"
  | "complementary"
  | "nearComplementary"
  | "analogous"
  | "triadic"
  | "splitComplementary"
  | "doubleComplementary"
  | "square"
  | "tetradic"
  | "pentadic"
  | "monochromatic"
  | "custom";

/** How relationship lines are drawn on the hue wheel. */
export type HarmonyLinkStyle =
  | "polygon" // closed shape in hue order (triad, square, tetrad…)
  | "arc" // open chain in hue order (analogous)
  | "diameters" // complementary pairs through the center
  | "none";

export type HarmonyDefinition = {
  id: HarmonyId;
  label: string;
  short: string;
  counts: number[];
  offsetsFor: (count: number) => number[];
  linkStyle: HarmonyLinkStyle;
};

export const HARMONIES: HarmonyDefinition[] = [
  {
    id: "primary",
    label: "Primary",
    short: "Primary",
    counts: [3],
    offsetsFor: () => [0, 120, 240],
    linkStyle: "polygon",
  },
  {
    id: "complementary",
    label: "Complementary",
    short: "Complement",
    counts: [2],
    offsetsFor: () => [0, 180],
    linkStyle: "diameters",
  },
  {
    id: "nearComplementary",
    label: "Near complementary",
    short: "Near",
    counts: [2],
    offsetsFor: () => [0, 165],
    linkStyle: "diameters",
  },
  {
    id: "analogous",
    label: "Analogous",
    short: "Analogous",
    counts: [1, 2, 3, 4, 5],
    offsetsFor: (count) => {
      if (count === 1) return [0];
      if (count === 2) return [0, 30];
      if (count === 3) return [-30, 0, 30];
      if (count === 4) return [-45, -15, 15, 45];
      return [-60, -30, 0, 30, 60];
    },
    linkStyle: "arc",
  },
  {
    id: "triadic",
    label: "Triadic",
    short: "Triad",
    counts: [3],
    offsetsFor: () => [0, 120, 240],
    linkStyle: "polygon",
  },
  {
    id: "splitComplementary",
    label: "Split-complementary",
    short: "Split",
    counts: [3],
    offsetsFor: () => [0, 150, 210],
    linkStyle: "polygon",
  },
  {
    id: "doubleComplementary",
    label: "Double-complementary",
    short: "Double",
    counts: [4],
    offsetsFor: () => [0, 60, 180, 240],
    linkStyle: "diameters",
  },
  {
    id: "square",
    label: "Square",
    short: "Square",
    counts: [4],
    offsetsFor: () => [0, 90, 180, 270],
    linkStyle: "polygon",
  },
  {
    id: "tetradic",
    label: "Tetradic",
    short: "Tetrad",
    counts: [4],
    offsetsFor: () => [0, 60, 180, 240],
    linkStyle: "polygon",
  },
  {
    id: "pentadic",
    label: "Pentadic",
    short: "Pentad",
    counts: [5],
    offsetsFor: () => [0, 72, 144, 216, 288],
    linkStyle: "polygon",
  },
  {
    id: "monochromatic",
    label: "Monochromatic",
    short: "Mono",
    counts: [1, 2, 3, 4, 5],
    offsetsFor: (count) => Array.from({ length: count }, () => 0),
    linkStyle: "none",
  },
  {
    id: "custom",
    label: "Custom",
    short: "Custom",
    counts: [1, 2, 3, 4, 5],
    offsetsFor: (count) => Array.from({ length: count }, () => 0),
    linkStyle: "polygon",
  },
];

export function harmonyById(id: HarmonyId): HarmonyDefinition {
  const found = HARMONIES.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Unknown harmony: ${id}`);
  }
  return found;
}

export function harmoniesForCount(count: number): HarmonyDefinition[] {
  return HARMONIES.filter((item) => item.counts.includes(count));
}

export function defaultHarmonyForCount(count: number): HarmonyId {
  if (count === 1) return "monochromatic";
  if (count === 2) return "complementary";
  if (count === 3) return "triadic";
  if (count === 4) return "square";
  return "pentadic";
}

export function applyHarmony(
  baseHue: number,
  harmony: HarmonyId,
  count: number,
): number[] {
  if (harmony === "custom") {
    return Array.from({ length: count }, () => wrapHue(baseHue));
  }
  const offsets = harmonyById(harmony).offsetsFor(count);
  return offsets.slice(0, count).map((offset) => wrapHue(baseHue + offset));
}

/**
 * Apply harmony hues while keeping locked stops fixed.
 * Unlocked hues are derived so the first locked color (or baseHue) stays the anchor.
 */
export function applyHarmonyKeepingLocks(
  colors: { l: number; c: number; h: number }[],
  locks: boolean[],
  baseHue: number,
  harmony: HarmonyId,
): { l: number; c: number; h: number }[] {
  if (harmony === "custom") return colors;

  const count = colors.length;
  const offsets = harmonyById(harmony).offsetsFor(count);
  const anchorIndex = locks.findIndex(Boolean);
  const anchorHue = anchorIndex >= 0 ? colors[anchorIndex].h : baseHue;
  const anchorOffset = offsets[Math.max(anchorIndex, 0)] ?? 0;

  return colors.map((stop, index) => {
    if (locks[index]) return stop;
    return {
      ...stop,
      h: wrapHue(anchorHue + (offsets[index] ?? 0) - anchorOffset),
    };
  });
}

export function isHarmonyValidForCount(
  harmony: HarmonyId,
  count: number,
): boolean {
  return harmonyById(harmony).counts.includes(count);
}
