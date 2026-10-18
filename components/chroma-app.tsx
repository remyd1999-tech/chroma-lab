"use client";

import { useMemo } from "react";

import { BaseColors } from "@/components/base-colors";
import { ChannelSlider } from "@/components/channel-slider";
import { ColorBoard } from "@/components/color-board";
import { HueWheel } from "@/components/hue-wheel";
import { ProportionBar } from "@/components/proportion-bar";
import { Segmented } from "@/components/segmented";
import { resolveColor, stopFromHex, type ColorStop } from "@/lib/color";
import {
  type HarmonyId,
  applyHarmonyKeepingLocks,
  defaultHarmonyForCount,
  isHarmonyValidForCount,
} from "@/lib/harmonies";
import { useUndoableState } from "@/lib/history";
import { wrapHue } from "@/lib/math";
import {
  applyChannel,
  equalProportions,
  resizeStops,
} from "@/lib/palette";

type Count = 1 | 2 | 3 | 4 | 5;
type DisplayMode = "board" | "pattern";
type UsageValue = "1" | "2" | "3" | "4" | "5" | "pattern";

type AppState = {
  count: Count;
  mode: DisplayMode;
  harmony: HarmonyId;
  baseHue: number;
  colors: ColorStop[];
  locks: boolean[];
  proportions: number[];
  hueCount: number;
  chromaCount: number;
  lightnessCount: number;
  columns: number;
};

const INITIAL: AppState = {
  count: 2,
  mode: "board",
  harmony: "complementary",
  baseHue: 247,
  colors: [
    { l: 46, c: 34, h: 247 },
    { l: 74, c: 18, h: 67 },
  ],
  locks: [false, false],
  proportions: [36, 64],
  hueCount: 1,
  chromaCount: 1,
  lightnessCount: 5,
  columns: 5,
};

function resizeLocks(locks: boolean[], count: number): boolean[] {
  if (locks.length === count) return locks;
  if (count < locks.length) return locks.slice(0, count);
  return [...locks, ...Array.from({ length: count - locks.length }, () => false)];
}

export function ChromaApp() {
  const { state, set } = useUndoableState<AppState>(INITIAL, {
    limit: 10,
    coalesceMs: 400,
  });

  const {
    count,
    mode,
    harmony,
    baseHue,
    colors,
    locks,
    proportions,
    hueCount,
    chromaCount,
    lightnessCount,
    columns,
  } = state;

  const resolved = useMemo(
    () => colors.map((stop) => resolveColor(stop)),
    [colors],
  );

  const usage: UsageValue =
    mode === "pattern" ? "pattern" : (String(count) as UsageValue);

  function patch(partial: Partial<AppState>, coalesce = false) {
    set((prev) => ({ ...prev, ...partial }), { coalesce });
  }

  function setCountAndHarmony(nextCount: Count) {
    const nextStops = resizeStops(colors, nextCount);
    const nextLocks = resizeLocks(locks, nextCount);
    const nextHarmony = isHarmonyValidForCount(harmony, nextCount)
      ? harmony
      : defaultHarmonyForCount(nextCount);
    const withHarmony =
      nextHarmony === "custom"
        ? nextStops
        : applyHarmonyKeepingLocks(
            nextStops,
            nextLocks,
            baseHue,
            nextHarmony,
          );

    patch({
      count: nextCount,
      mode: "board",
      harmony: nextHarmony,
      colors: withHarmony,
      locks: nextLocks,
      proportions: equalProportions(nextCount),
    });
  }

  function onUsageChange(value: UsageValue) {
    if (value === "pattern") {
      patch({ mode: "pattern" });
      return;
    }
    setCountAndHarmony(Number(value) as Count);
  }

  function onHarmonyChange(next: HarmonyId) {
    if (next === "custom") {
      patch({ harmony: next });
      return;
    }
    patch({
      harmony: next,
      colors: applyHarmonyKeepingLocks(colors, locks, baseHue, next),
    });
  }

  function onRotate(nextBase: number) {
    if (harmony === "custom") {
      const delta = nextBase - baseHue;
      patch(
        {
          baseHue: nextBase,
          colors: colors.map((stop, index) =>
            locks[index] ? stop : { ...stop, h: wrapHue(stop.h + delta) },
          ),
        },
        true,
      );
      return;
    }
    patch(
      {
        baseHue: nextBase,
        colors: applyHarmonyKeepingLocks(colors, locks, nextBase, harmony),
      },
      true,
    );
  }

  function onHueChange(index: number, hue: number) {
    if (locks[index]) {
      const nextColors = colors.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, h: hue } : stop,
      );
      if (harmony !== "custom") {
        patch(
          {
            baseHue: index === 0 || !locks.some(Boolean) ? hue : baseHue,
            colors: applyHarmonyKeepingLocks(nextColors, locks, hue, harmony),
          },
          true,
        );
        return;
      }
      patch(
        {
          baseHue: index === 0 ? hue : baseHue,
          colors: nextColors,
        },
        true,
      );
      return;
    }

    patch(
      {
        harmony: "custom",
        baseHue: index === 0 ? hue : baseHue,
        colors: colors.map((stop, stopIndex) =>
          stopIndex === index ? { ...stop, h: hue } : stop,
        ),
      },
      true,
    );
  }

  function onLockToggle(index: number, locked: boolean) {
    const nextLocks = locks.map((value, i) => (i === index ? locked : value));
    if (locked && harmony !== "custom") {
      patch({
        locks: nextLocks,
        baseHue: colors[index]?.h ?? baseHue,
        colors: applyHarmonyKeepingLocks(
          colors,
          nextLocks,
          colors[index]?.h ?? baseHue,
          harmony,
        ),
      });
      return;
    }
    patch({ locks: nextLocks });
  }

  function onBaseHexCommit(index: number, hex: string) {
    const stop = stopFromHex(hex);
    if (!stop) return;
    const nextColors = colors.map((item, i) => (i === index ? stop : item));
    if (harmony !== "custom" && locks[index]) {
      patch({
        baseHue: stop.h,
        colors: applyHarmonyKeepingLocks(nextColors, locks, stop.h, harmony),
      });
      return;
    }
    patch({
      baseHue: index === 0 ? stop.h : baseHue,
      colors: nextColors,
    });
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-[#1D1D1F] lg:flex-row">
      <aside className="flex max-h-[48vh] w-full shrink-0 flex-col overflow-hidden bg-white lg:max-h-none lg:h-full lg:w-[360px]">
        <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-6 pt-6 pb-8">
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[13px] font-medium">Usage</h2>
              <span className="text-[11px] text-[#6E6E73]">
                {count} color{count === 1 ? "" : "s"}
                {mode === "pattern" ? " · pattern" : ""}
              </span>
            </div>
            <Segmented
              ariaLabel="Palette usage"
              value={usage}
              onChange={onUsageChange}
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "5", label: "5" },
                { value: "pattern", label: "Pattern" },
              ]}
            />
          </section>

          <BaseColors
            colors={resolved}
            locks={locks}
            onToggle={onLockToggle}
            onHexCommit={onBaseHexCommit}
          />

          {count > 1 ? (
            <ProportionBar
              values={proportions}
              colors={resolved}
              onChange={(next) => patch({ proportions: next }, true)}
            />
          ) : null}

          <ChannelSlider
            label="Lightness"
            track="lightness"
            values={colors.map((stop) => stop.l)}
            colors={resolved}
            onChange={(values) =>
              patch({ colors: applyChannel(colors, "l", values) }, true)
            }
          />

          <ChannelSlider
            label="Chroma"
            track="chroma"
            values={colors.map((stop) => stop.c)}
            colors={resolved}
            onChange={(values) =>
              patch({ colors: applyChannel(colors, "c", values) }, true)
            }
          />

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

      <ColorBoard
        stops={colors}
        proportions={proportions}
        hueCount={hueCount}
        chromaCount={chromaCount}
        lightnessCount={lightnessCount}
        columns={columns}
        onHueCountChange={(value) => patch({ hueCount: value }, true)}
        onChromaCountChange={(value) => patch({ chromaCount: value }, true)}
        onLightnessCountChange={(value) =>
          patch({ lightnessCount: value }, true)
        }
        onColumnsChange={(value) => patch({ columns: value })}
      />
    </div>
  );
}
