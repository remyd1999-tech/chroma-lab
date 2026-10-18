export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function wrapHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

export function hueDelta(from: number, to: number): number {
  const raw = wrapHue(to - from);
  return raw > 180 ? raw - 360 : raw;
}

export function roundTo(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
