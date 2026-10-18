"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResolvedColor } from "@/lib/color";
import { normalizeHexInput } from "@/lib/color";
import { cn } from "@/lib/utils";

type BaseColorsProps = {
  colors: ResolvedColor[];
  locks: boolean[];
  onToggle: (index: number, locked: boolean) => void;
  onHexCommit: (index: number, hex: string) => void;
};

export function BaseColors({
  colors,
  locks,
  onToggle,
  onHexCommit,
}: BaseColorsProps) {
  return (
    <section className="flex flex-col gap-3">
      <Label className="text-[13px] font-medium text-[#1D1D1F]">
        Base colors
      </Label>
      <div className="flex flex-col gap-2">
        {colors.map((color, index) => (
          <BaseColorRow
            key={index}
            index={index}
            color={color}
            locked={locks[index] ?? false}
            onToggle={(locked) => onToggle(index, locked)}
            onHexCommit={(hex) => onHexCommit(index, hex)}
          />
        ))}
      </div>
    </section>
  );
}

function BaseColorRow({
  index,
  color,
  locked,
  onToggle,
  onHexCommit,
}: {
  index: number;
  color: ResolvedColor;
  locked: boolean;
  onToggle: (locked: boolean) => void;
  onHexCommit: (hex: string) => void;
}) {
  const displayHex = color.hex.toUpperCase();
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? displayHex;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={locked}
        aria-label={`Lock base color ${index + 1}`}
        onClick={() => onToggle(!locked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          locked ? "bg-[#1D1D1F]" : "bg-[#D2D2D7]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            locked && "translate-x-4",
          )}
        />
      </button>

      <span
        className="size-5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
        style={{ background: color.displayCss }}
        aria-hidden
      />

      <span className="min-w-0 flex-1 truncate text-[12px] text-[#6E6E73]">
        Base color {index + 1}
      </span>

      <Input
        value={text}
        disabled={!locked}
        spellCheck={false}
        aria-label={`Hex for base color ${index + 1}`}
        className={cn(
          "h-7 w-[6.5rem] rounded-full border-transparent bg-[#E8E8ED] px-2.5 font-mono text-[11px] font-medium uppercase tracking-tight shadow-none focus-visible:border-[#1D1D1F] focus-visible:bg-white focus-visible:ring-0",
          !locked && "opacity-50",
        )}
        onFocus={() => setDraft(displayHex)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const raw = draft ?? displayHex;
          setDraft(null);
          onHexCommit(normalizeHexInput(raw));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}
