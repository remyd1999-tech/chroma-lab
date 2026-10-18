import { wrapHue } from "@/lib/math";

export type HarmonyId =
  | "complementary"
  | "nearComplementary"
  | "analogous"
  | "triadic"
  | "splitComplementary"
  | "square"
  | "tetradic"
  | "pentadic"
  | "monochromatic"
  | "custom";

export type HarmonyDefinition = {
  id: HarmonyId;
  label: string;
  short: string;
  counts: number[];
  offsetsFor: (count: number) => number[];
};

export const HARMONIES: HarmonyDefinition[] = [
  {
    id: "complementary",
    label: "Complementary",
    short: "Complement",
    counts: [2],
    offsetsFor: () => [0, 180],
  },
  {
    id: "nearComplementary",
    label: "Near complementary",
    short: "Near",
    counts: [2],
    offsetsFor: () => [0, 165],
  },
  {
    id: "analogous",
    label: "Analogous",
    short: "Analogous",
    counts: [2, 3, 4, 5],
    offsetsFor: (count) => {
      if (count === 2) return [0, 30];
      if (count === 3) return [-30, 0, 30];
      if (count === 4) return [-45, -15, 15, 45];
      return [-60, -30, 0, 30, 60];
    },
  },
  {
    id: "triadic",
    label: "Triadic",
    short: "Triad",
    counts: [3],
    offsetsFor: () => [0, 120, 240],
  },
  {
    id: "splitComplementary",
    label: "Split-complementary",
    short: "Split",
    counts: [3],
    offsetsFor: () => [0, 150, 210],
  },
  {
    id: "square",
    label: "Square",
    short: "Square",
    counts: [4],
    offsetsFor: () => [0, 90, 180, 270],
  },
  {
    id: "tetradic",
    label: "Tetradic",
    short: "Tetrad",
    counts: [4],
    offsetsFor: () => [0, 60, 180, 240],
  },
  {
    id: "pentadic",
    label: "Pentadic",
    short: "Pentad",
    counts: [5],
    offsetsFor: () => [0, 72, 144, 216, 288],
  },
  {
    id: "monochromatic",
    label: "Monochromatic",
    short: "Mono",
    counts: [2, 3, 4, 5],
    offsetsFor: (count) => Array.from({ length: count }, () => 0),
  },
  {
    id: "custom",
    label: "Custom",
    short: "Custom",
    counts: [2, 3, 4, 5],
    offsetsFor: (count) => Array.from({ length: count }, () => 0),
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

export function isHarmonyValidForCount(
  harmony: HarmonyId,
  count: number,
): boolean {
  return harmonyById(harmony).counts.includes(count);
}
