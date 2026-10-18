"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  cssVariablesBlock,
  hexList,
  oklchList,
  type ResolvedColor,
} from "@/lib/color";

type ColorBoardProps = {
  colors: ResolvedColor[];
  proportions: number[];
  mode: "board" | "pattern";
};

type CopyKey = "oklch" | "hex" | "css" | number | null;

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ColorBoard({ colors, proportions, mode }: ColorBoardProps) {
  const [copied, setCopied] = useState<CopyKey>(null);

  async function copy(key: CopyKey, text: string) {
    const ok = await writeClipboard(text);
    if (!ok) return;
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1400);
  }

  const repeats = mode === "pattern" ? 4 : 1;
  const cycles = Array.from({ length: repeats }, (_, index) => index);

  return (
    <div className="relative flex min-h-[42vh] flex-1 flex-col bg-white lg:min-h-0">
      <div className="flex min-h-0 flex-1">
        {cycles.map((cycle) => (
          <div key={cycle} className="flex min-h-0 min-w-0 flex-1">
            {colors.map((color, index) => (
              <button
                key={`${cycle}-${index}`}
                type="button"
                onClick={() => copy(index, color.css)}
                className="relative min-w-0 overflow-hidden text-left transition-opacity hover:opacity-95"
                style={{
                  flexGrow: proportions[index],
                  flexBasis: 0,
                  background: color.displayCss,
                  color: color.labelColor,
                }}
              >
                {mode === "board" && cycle === 0 ? (
                  <span className="absolute right-3 bottom-4 left-3 flex flex-col gap-1">
                    <span className="text-[11px] tracking-[0.16em] uppercase opacity-70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] leading-tight font-medium tracking-tight">
                      {color.css}
                    </span>
                    <span className="text-[12px] tracking-tight uppercase opacity-80">
                      {color.hex}
                      {!color.inGamut ? " · clamped" : ""}
                    </span>
                    {copied === index ? (
                      <span className="text-[11px] tracking-tight">
                        Copied OKLCH
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[#D2D2D7] bg-[#F5F5F7] px-4 py-3">
        <CopyButton
          label="Copy OKLCH"
          copied={copied === "oklch"}
          onClick={() => copy("oklch", oklchList(colors))}
        />
        <CopyButton
          label="Copy HEX"
          copied={copied === "hex"}
          onClick={() => copy("hex", hexList(colors))}
        />
        <CopyButton
          label="Copy CSS"
          copied={copied === "css"}
          onClick={() => copy("css", cssVariablesBlock(colors))}
        />
        <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-x-4 gap-y-1 text-[11px] tracking-tight text-[#6E6E73] tabular-nums">
          {colors.map((color, index) => (
            <span key={index}>
              {String(index + 1).padStart(2, "0")} L {Math.round(color.l)} · C{" "}
              {color.chroma.toFixed(2)}
              {color.inGamut ? "" : `→${color.displayChroma.toFixed(2)}`} · H{" "}
              {Math.round(color.h)}
            </span>
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
      className="h-8 rounded-md border-[#D2D2D7] bg-white text-[12px] text-[#1D1D1F] shadow-none hover:bg-white"
    >
      {copied ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}
