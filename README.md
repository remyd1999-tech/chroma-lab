# Chroma

Compose color combinations in **OKLCH** — lightness, chroma, and hue — on a single page. Chroma is a palette tool with a quiet, pre-liquid-glass Apple layout and Swiss typographic discipline: one column of controls, one planche of color.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

Everything lives on one screen.

**Usage** — 2, 3, 4, or 5 colors, or Pattern (the same palette tiled so you can judge proportion in rhythm).

**Proportion** — how much of the board each color occupies. Two colors can be 10 / 90. More than two: drag the dividers; they always sum to 100%.

**Lightness** and **Chroma** — one thumb per color on a 0–100 track, with numeric fields beside it. Offset slides the whole group. Gap opens or closes the span around the midpoint.

**Hue** — classic relationships (complementary, analogous, triadic, split-complementary, square, tetradic, pentadic, monochromatic) plus Custom. Points sit on an OKLCH wheel with their degree values. A preset rotates as a set; Custom lets each point move on its own.

Colors that fall outside sRGB are chroma-clamped for display and HEX. The OKLCH string keeps the values you asked for.

Click a field on the planche to copy its `oklch()` notation, or copy the full OKLCH list, HEX list, or CSS variables from the bar.
