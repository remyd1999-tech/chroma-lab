"use client";

import { Check, Copy, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { CountSlider } from "@/components/count-slider";
import { Button } from "@/components/ui/button";
import {
  cssVariablesBlock,
  hexList,
  oklchList,
  swatchSvg,
  type ColorStop,
  type DisplayGamut,
} from "@/lib/color";
import { clamp } from "@/lib/math";
import { buildStaggerCombos, type StaggerCounts } from "@/lib/stagger";
import { cn } from "@/lib/utils";

type ColorBoardProps = {
  stops: ColorStop[];
  proportions: number[];
  hueCount: number;
  chromaCount: number;
  lightnessCount: number;
  columns: number;
  gamut: DisplayGamut;
  onGamutChange: (gamut: DisplayGamut) => void;
  onHueCountChange: (value: number) => void;
  onChromaCountChange: (value: number) => void;
  onLightnessCountChange: (value: number) => void;
  onColumnsChange: (value: number) => void;
};

type CopyKey = "oklch" | "hex" | "css" | number | null;

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 12;

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ColorBoard({
  stops,
  proportions,
  hueCount,
  chromaCount,
  lightnessCount,
  columns,
  gamut,
  onGamutChange,
  onHueCountChange,
  onChromaCountChange,
  onLightnessCountChange,
  onColumnsChange,
}: ColorBoardProps) {
  const [copied, setCopied] = useState<CopyKey>(null);
  const srgb = gamut === "srgb";

  const counts: StaggerCounts = useMemo(
    () => ({
      hue: hueCount,
      chroma: chromaCount,
      lightness: lightnessCount,
    }),
    [hueCount, chromaCount, lightnessCount],
  );

  const combos = useMemo(
    () => buildStaggerCombos(stops, counts, gamut),
    [stops, counts, gamut],
  );

  const flatColors = useMemo(
    () => combos.flatMap((combo) => combo.colors),
    [combos],
  );

  async function copy(key: CopyKey, text: string) {
    const ok = await writeClipboard(text);
    if (!ok) return;
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 bg-white px-5 py-4">
        <div className="flex min-w-0 flex-1 basis-[16rem] flex-col gap-2.5 sm:max-w-md">
          <CountSlider
            label="Hue jumps"
            value={hueCount}
            min={1}
            max={12}
            onChange={onHueCountChange}
          />
          <CountSlider
            label="C stagger"
            value={chromaCount}
            min={1}
            max={12}
            onChange={onChromaCountChange}
          />
          <CountSlider
            label="L stagger"
            value={lightnessCount}
            min={1}
            max={24}
            onChange={onLightnessCountChange}
          />
        </div>

        <div className="ml-auto flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CopyButton
              label="Copy OKLCH"
              copied={copied === "oklch"}
              onClick={() => copy("oklch", oklchList(flatColors))}
            />
            <CopyButton
              label="Copy HEX"
              copied={copied === "hex"}
              onClick={() => copy("hex", hexList(flatColors))}
            />
            <CopyButton
              label="Copy CSS"
              copied={copied === "css"}
              onClick={() => copy("css", cssVariablesBlock(flatColors))}
            />
            <span className="ml-1 text-[11px] tabular-nums text-[#6E6E73]">
              {combos.length} · {columns} col
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Remove column"
              disabled={columns <= MIN_COLUMNS}
              onClick={() =>
                onColumnsChange(clamp(columns - 1, MIN_COLUMNS, MAX_COLUMNS))
              }
              className="size-8 rounded-full border-[#D2D2D7] bg-white p-0 shadow-none hover:bg-[#F5F5F7]"
            >
              <Minus className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Add column"
              disabled={columns >= MAX_COLUMNS}
              onClick={() =>
                onColumnsChange(clamp(columns + 1, MIN_COLUMNS, MAX_COLUMNS))
              }
              className="size-8 rounded-full border-[#D2D2D7] bg-white p-0 shadow-none hover:bg-[#F5F5F7]"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={srgb}
            aria-label="Clamp display to sRGB"
            onClick={() => onGamutChange(srgb ? "p3" : "srgb")}
            className="flex items-center gap-2 text-[12px] text-[#6E6E73]"
          >
            <span
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                srgb ? "bg-[#1D1D1F]" : "bg-[#D2D2D7]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
                  srgb && "translate-x-4",
                )}
              />
            </span>
            sRGB
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          className="grid gap-x-3 gap-y-5 p-5"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {combos.map((combo, index) => (
            <button
              key={`${combo.hueIndex}-${combo.chromaIndex}-${combo.lightnessIndex}`}
              type="button"
              title={combo.detail}
              onClick={() => copy(index, swatchSvg(combo.colors))}
              className="group flex min-w-0 flex-col gap-2 text-left"
            >
              <span className="flex aspect-[2/1] w-full overflow-hidden">
                {combo.colors.map((color, colorIndex) => (
                  <span
                    key={colorIndex}
                    className="min-w-0"
                    style={{
                      flexGrow: proportions[colorIndex] ?? 1,
                      flexBasis: 0,
                      background: color.displayCss,
                    }}
                  />
                ))}
              </span>
              <span className="flex justify-center">
                <span
                  className={cn(
                    "rounded-md bg-[#E8E8ED] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#3A3A3C]",
                    copied === index && "bg-[#1D1D1F] text-white",
                  )}
                >
                  {copied === index ? "Copied" : combo.label}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CopyButton({
  label,
  copied,
  onClick,
}: {
  label: string;
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 rounded-full border-[#D2D2D7] bg-white text-[12px] text-[#1D1D1F] shadow-none hover:bg-white"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
