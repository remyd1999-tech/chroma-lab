"use client";

import { useMemo, useState } from "react";

import { ChannelSlider } from "@/components/channel-slider";
import { ColorBoard } from "@/components/color-board";
import { HueWheel } from "@/components/hue-wheel";
import { ProportionBar } from "@/components/proportion-bar";
import { Segmented } from "@/components/segmented";
import { Separator } from "@/components/ui/separator";
import { resolveColor, type ColorStop } from "@/lib/color";
import {
  type HarmonyId,
  applyHarmony,
  defaultHarmonyForCount,
  isHarmonyValidForCount,
} from "@/lib/harmonies";
import { wrapHue } from "@/lib/math";
import {
  applyChannel,
  applyHues,
  equalProportions,
  resizeStops,
} from "@/lib/palette";

type Count = 2 | 3 | 4 | 5;
type DisplayMode = "board" | "pattern";
type UsageValue = "2" | "3" | "4" | "5" | "pattern";

const INITIAL_COLORS: ColorStop[] = [
  { l: 46, c: 34, h: 247 },
  { l: 74, c: 18, h: 67 },
];

export function ChromaApp() {
  const [count, setCount] = useState<Count>(2);
  const [mode, setMode] = useState<DisplayMode>("board");
  const [harmony, setHarmony] = useState<HarmonyId>("complementary");
  const [baseHue, setBaseHue] = useState(247);
  const [colors, setColors] = useState<ColorStop[]>(INITIAL_COLORS);
  const [proportions, setProportions] = useState<number[]>([36, 64]);

  const resolved = useMemo(
    () => colors.map((stop) => resolveColor(stop)),
    [colors],
  );

  const usage: UsageValue = mode === "pattern" ? "pattern" : String(count) as UsageValue;

  function setCountAndHarmony(nextCount: Count) {
    const nextStops = resizeStops(colors, nextCount);
    const nextHarmony = isHarmonyValidForCount(harmony, nextCount)
      ? harmony
      : defaultHarmonyForCount(nextCount);
    const hues =
      nextHarmony === "custom"
        ? nextStops.map((stop) => stop.h)
        : applyHarmony(baseHue, nextHarmony, nextCount);

    setCount(nextCount);
    setMode("board");
    setHarmony(nextHarmony);
    setColors(applyHues(nextStops, hues));
    setProportions(equalProportions(nextCount));
  }

  function onUsageChange(value: UsageValue) {
    if (value === "pattern") {
      setMode("pattern");
      return;
    }
    setCountAndHarmony(Number(value) as Count);
  }

  function onHarmonyChange(next: HarmonyId) {
    setHarmony(next);
    if (next === "custom") return;
    const hues = applyHarmony(baseHue, next, count);
    setColors(applyHues(colors, hues));
  }

  function onRotate(nextBase: number) {
    setBaseHue(nextBase);
    if (harmony === "custom") {
      setColors(
        applyHues(
          colors,
          colors.map((stop) => wrapHue(stop.h + (nextBase - baseHue))),
        ),
      );
      return;
    }
    setColors(applyHues(colors, applyHarmony(nextBase, harmony, count)));
  }

  function onHueChange(index: number, hue: number) {
    setHarmony("custom");
    setColors(
      colors.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, h: hue } : stop,
      ),
    );
    if (index === 0) {
      setBaseHue(hue);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F5F7] text-[#1D1D1F] lg:h-dvh lg:flex-row lg:overflow-hidden">
      <aside className="flex w-full flex-col border-[#D2D2D7] bg-white lg:h-full lg:w-[360px] lg:shrink-0 lg:border-r">
        <header className="px-6 pt-7 pb-5">
          <p className="text-[11px] tracking-[0.28em] text-[#6E6E73] uppercase">
            Palettes
          </p>
          <h1 className="mt-2 text-[28px] leading-none font-medium tracking-[-0.04em]">
            Chroma
          </h1>
          <p className="mt-3 max-w-[18rem] text-[13px] leading-5 text-[#6E6E73]">
            Combine colors in OKLCH. Set count, proportion, lightness, chroma,
            then hue.
          </p>
        </header>

        <div className="flex flex-col gap-7 px-6 pb-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[13px] font-medium">Usage</h2>
              <span className="text-[11px] text-[#6E6E73]">
                {count} colors{mode === "pattern" ? " · pattern" : ""}
              </span>
            </div>
            <Segmented
              ariaLabel="Palette usage"
              value={usage}
              onChange={onUsageChange}
              options={[
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
                { value: "pattern", label: "Pattern" },
              ]}
            />
          </section>

          <ProportionBar
            values={proportions}
            colors={resolved}
            onChange={setProportions}
          />

          <Separator className="bg-[#E8E8ED]" />

          <ChannelSlider
            label="Lightness"
            track="lightness"
            values={colors.map((stop) => stop.l)}
            colors={resolved}
            onChange={(values) => setColors(applyChannel(colors, "l", values))}
          />

          <ChannelSlider
            label="Chroma"
            track="chroma"
            values={colors.map((stop) => stop.c)}
            colors={resolved}
            onChange={(values) => setColors(applyChannel(colors, "c", values))}
          />

          <Separator className="bg-[#E8E8ED]" />

          <HueWheel
            colors={resolved}
            count={count}
            harmony={harmony}
            baseHue={baseHue}
            onHarmonyChange={onHarmonyChange}
            onRotate={onRotate}
            onHueChange={onHueChange}
          />
        </div>
      </aside>

      <ColorBoard colors={resolved} proportions={proportions} mode={mode} />
    </div>
  );
}
