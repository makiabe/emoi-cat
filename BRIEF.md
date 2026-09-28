# ねこのいちにち — "A Cat's Day" : 60-second pixel-art SVG animation

Project root: this repository (Node 22, no npm deps). One self-contained SVG,
256x144 pixel canvas (viewBox), scaled 5x to 1280x720 with `shape-rendering="crispEdges"`.
Pure SMIL animation on ONE global 60s looping clock (`dur="60s" repeatCount="indefinite"`).
Hero: **Mikan (みかん)**, a chubby orange tabby with white chest. Goal: breathtaking, lively,
cozy pixel art (think Eastward / A Short Hike / Studio Ghibli warmth) — lots of secondary motion.

## Files
- `lib/core.js` — engine (READ IT FIRST, it is short). Key API:
  - timeline: `C.show(t0,t1)` (visibility window, put inside `<g opacity="0">`), `C.steps(attr, [[t,v],...])`
    discrete steps, `C.steps('translate', [[t,'x y'],...], 'animateTransform')`, `C.tween(attr, [[t,v],...])` linear,
    `C.move(t0,t1,fps, t=>[x,y])` pixel-snapped movement for a `<g>`, `C.sample`, `C.loopFrame`, `C.flipbook(ids,fps,x,y)`.
  - **`C.act({t0,t1,fps,pose:t=>spriteId|null, pos:t=>[x,y], flip:t=>bool})`** — the actor: choreograph any
    sprite as functions of global time t. This is the main tool for characters.
  - drawing: `C.sprite(id, asciiArt, charToColorMap)`, `C.spriteRaw(id, markup, w, h)`, `C.use(id,x,y,flip)`,
    `new C.Canvas(w,h)` raster with `.set .rect .ellipse .circle .line .poly .art .outline(color) .toSVG()`
    (fills may be functions `(x,y)=>color` for shading), dithering `C.dith(c1,c2,level0to16)` (Canvas fill fn),
    `C.ditherFill(c1,c2,level)` (SVG pattern fill), `C.ditherGradient(x,y,w,h,[[y,color],...])` (dithered sky!).
  - easing/keys: `C.key(t,[[t,v],...],easeFn)`, `C.pick(t,[[t,'a'],...])`, `C.ease/easeIn/easeOut/hop/lerp/inv/clamp`, `C.rng(seed)`.
  - text: `C.text(str,x,y,color,scale)` 3x5 pixel font (A-Z 0-9 : . ! ? ' - / ~ * ♥).
- `lib/cat.js` — parametric cat rig. `cat.catSprite(id, params)` registers a 36x28 sprite (cat faces RIGHT,
  feet on bottom row 27; use flip for left). `cat.drawCat(params)` returns the Canvas (you may post-edit pixels).
  params: `pose` sit|walk|loaf|sleep|stretch|crouch|leap|eat, `eyes` open|wide|half|closed|happy|look,
  `mouth` cat|open|yawn|tongue|none, `tail` angle deg (0=left, 90=up), `curl` deg, `step` 0..3 (walk/crouch),
  `breath` 0|1, `headDX`,`headDY`, `headTilt`, `paw` 0..3 (sit: raise right front paw). Palette: `cat.PAL`.
  Pose gallery: `tmp/sheet.png`. Do NOT edit lib/cat.js (shared) — if you need a new pose, write a local
  function in your scene file (you can reuse `cat.drawCat`, `cat.over`, `cat.fur`, `cat.thick`, `cat.tailPts`, `cat.PAL`).
- `build.js` — assembles scenes + `lib/overlay.js` (HUD clock, titles, dither transitions, CRT). `node build.js` → `out/cat_day.svg`.
- `tools/snap.js` — **render frames to PNG to SEE your work**:
  `node tools/snap.js --only N --times 20,21.5,23 --out tmp/sN_a.png` then open the PNG with the Read tool.
  Contact sheets of 6–9 frames at `--scale 2` are ideal; single frame `--scale 4` for detail. `--nocrt` disables scanlines.

## Scene contract
Each scene is `scenes/sN_name.js`:
```js
module.exports = ({ t0, t1, C, cat }) => { /* register defs with C.sprite/C.def, return markup string */ };
```
- Draw the FULL 256x144 frame (opaque background). Times are GLOBAL seconds; your scene is visible in [t0,t1).
- Prefix every sprite/def id with your scene tag (e.g. `s3_`) — ids share one document.
- The first/last 0.45s of your window are covered by a dither-to-black transition; don't put key beats there.
- HUD clock sits top-right (x 217–253, y 2–11): keep important things out of that box.
- Pixel-perfect: integer coordinates, stepped motion (8–12 fps "stop-motion" via act/move; smooth `tween` only
  for colors/opacity of light). No blur filters, no anti-aliased vector shapes. Everything must look like pixel art.
- Size budget: your scene's markup ≲ 350 KB. Prefer `<use>` of sprites and dedupe (steps() already drops repeats).
- Only edit your own scene file(s). Never touch other scenes, lib/, build.js.

## Shared palette hints (warm, cohesive)
outline `#2b1d2e`; night navy `#1b1733`, `#2a2550`, `#3d3a78`; dawn pinks `#f7a8a0`, `#ffd3a0`; warm light `#ffe9b8`,
`#ffcf7a`; wood `#8a5a3c`, `#6b412c`, `#b07a4f`; greens `#5fae5a`, `#3f7d4a`; sky day `#8fd3ff`, `#5fb0ee`;
sunset `#ff9a5a`, `#f2657a`, `#9a4a9a`. Cat fur `#f2a14a`/`#cf6e2e`/`#ffd08c`, white `#fff3e0`.

## Story & CUE SHEET (music/SFX are synced to these — hit them within ±0.25s)
In-world clock shown by HUD: S1 06:00→07:10, S2 07:30→08:15, S3 12:00→13:30, S4 15:00→16:30, S5 17:40→19:05, S6 21:30→23:59.

**S1 DAWN, bedroom (0–10)** — pre-dawn blue room slowly warming. Window with sunrise (sky colors shift,
sun peeks up). A golden light beam slides across the room with floating dust motes. Mikan sleeps curled on
the bed (breathing, floating "z"s). The opening title overlays 0.9–4.3s in the centre (y≈46–80): keep centre calm.
Cues: 5.5 sunbeam reaches Mikan's face · 6.2 ear twitch · 6.8 eyes open · 7.2–8.6 big stretch, yawn at 7.6 · 8.8 hops off bed, trots off right.

**S2 BREAKFAST, kitchen (10–19)** — warm morning kitchen (tiles, fridge, plants, steam from a kettle).
Cues: 10.5–12.0 Mikan walks in to the empty bowl · 12.4 "NYA!" meow (speech bubble) · 13.0 second meow ·
13.6–15.2 kibble pours from a bag held by the owner's hand from above (bouncing kibble particles) ·
15.3–17.6 eats (head bobs, crumbs) · 17.0 a ♥ floats up · 18.0 sits content, licks lips.

**S3 WINDOW, midday (19–29)** — Mikan on the window sill watching the outside world: parallax sky with drifting
clouds, swaying tree, laundry/curtain flutter. Cues: 21.0 sparrow lands on a branch · 22.0–23.5 Mikan chatters
(eyes wide, mouth fast) · 24.0 & 24.4 paw taps glass · 24.8 bird flies away · 25.5 a butterfly drifts by ·
26.5–28.5 Mikan loafs in the sunbeam and dozes off.

**S4 PLAY, living room afternoon (29–39)** — Cues: 30.2 a yarn ball rolls in (string trailing) · 31.0–32.2 crouch +
butt wiggle · 32.4 POUNCE (leap) · 33.2 tumble with the yarn · 35.0 a cardboard box · 35.6 Mikan jumps in (thud) ·
36.2–38.5 only ears/eyes peek out, box wobbles · 37.5 pops up with "!".

**S5 ROOFTOP, sunset (39–49)** — Japanese town rooftops (kawara tiles), dithered sunset sky, big sinking sun,
parallax skyline layers, utility poles and wires. Cues: 40.0–43.0 Mikan walks the roof ridge · 41.5 crows fly past
(caws 41.8, 42.3) · 43.5 sits and watches the sunset · 45.2, 45.8, 46.4, 47.0 house windows light up one by one ·
47.5 first star twinkles.

**S6 NIGHT, cozy room (49–60)** — moonlit room, starry window, lamp glow. Cues: 50.0–52.0 Mikan walks to a cushion,
turns around · 52.5 curls up to sleep · 53.5 dream bubble opens: Mikan swimming in the sky with big fish ·
54.8 shooting star · 55.6 lamp clicks off (room goes moonlit blue) · 56.4–59.4 end title overlays the centre
("GOOD NIGHT, MIKAN") — keep y≈40–80 calm/dark then · 59.4–60 fades to black (loops to S1 dawn).
