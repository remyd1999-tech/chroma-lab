import { clamp, roundChannel } from "@/lib/math";
import type { ColorStop } from "@/lib/color";

export const MIN_PROPORTION = 4;

export function channelGap(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

export function channelOffset(values: number[]): number {
  return (Math.min(...values) + Math.max(...values)) / 2;
}

export function maxChannelGap(values: number[]): number {
  const mid = channelOffset(values);
  return Math.min(100, 2 * Math.min(mid, 100 - mid));
}

export function setChannelValue(
  values: number[],
  index: number,
  value: number,
): number[] {
  const next = values.slice();
  next[index] = clamp(roundChannel(value), 0, 100);
  return next;
}

export function setChannelOffset(values: number[], offset: number): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mid = (min + max) / 2;
  const delta = clamp(offset - mid, -min, 100 - max);
  return values.map((value) => clamp(roundChannel(value + delta), 0, 100));
}

export function setChannelGap(values: number[], gap: number): number[] {
  const n = values.length;
  const mid = channelOffset(values);
  const maxGap = maxChannelGap(values);
  const g = clamp(roundChannel(gap), 0, roundChannel(maxGap));
  const low = roundChannel(mid - g / 2);
  const high = roundChannel(mid + g / 2);

  if (n === 1) {
    return [roundChannel(mid)];
  }

  const ranked = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value || a.index - b.index);

  const next = values.slice();
  for (let rank = 0; rank < n; rank += 1) {
    const t = rank / (n - 1);
    next[ranked[rank].index] = roundChannel(low + t * (high - low));
  }
  next[ranked[0].index] = low;
  next[ranked[n - 1].index] = high;
  return next.map((value) => clamp(value, 0, 100));
}

export function equalProportions(count: number): number[] {
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from(
    { length: count },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

export function setProportion(
  values: number[],
  index: number,
  value: number,
  min = MIN_PROPORTION,
): number[] {
  const partner = index === values.length - 1 ? index - 1 : index + 1;
  const pair = values[index] + values[partner];
  const nextValue = clamp(Math.round(value), min, pair - min);
  const next = values.slice();
  next[index] = nextValue;
  next[partner] = pair - nextValue;
  return next;
}

export function cumulativeStops(values: number[]): number[] {
  const stops: number[] = [];
  let total = 0;
  for (let i = 0; i < values.length - 1; i += 1) {
    total += values[i];
    stops.push(total);
  }
  return stops;
}

export function resizeStops(stops: ColorStop[], count: number): ColorStop[] {
  if (count === stops.length) return stops;
  if (count < stops.length) return stops.slice(0, count);

  const lights = stops.map((stop) => stop.l);
  const chromas = stops.map((stop) => stop.c);
  const lMin = Math.min(...lights);
  const lMax = Math.max(...lights);
  const cMin = Math.min(...chromas);
  const cMax = Math.max(...chromas);

  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0 : index / (count - 1);
    return {
      l: roundChannel(lMin + t * (lMax - lMin)),
      c: roundChannel(cMin + t * (cMax - cMin)),
      h: stops[Math.min(index, stops.length - 1)].h,
    };
  });
}

export function applyChannel(
  stops: ColorStop[],
  channel: "l" | "c",
  values: number[],
): ColorStop[] {
  return stops.map((stop, index) => ({
    ...stop,
    [channel]: values[index] ?? stop[channel],
  }));
}

export function applyHues(stops: ColorStop[], hues: number[]): ColorStop[] {
  return stops.map((stop, index) => ({
    ...stop,
    h: hues[index] ?? stop.h,
  }));
}
