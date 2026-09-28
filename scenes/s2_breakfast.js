// S2 BREAKFAST — warm morning kitchen (global 10–19s). Mikan trots in, finds the bowl empty,
// meows twice, the owner's hand pours kibble from above, Mikan eats happily, then sits content.
'use strict';
module.exports = ({ t0, t1, C, cat }) => {
  const { Canvas } = C;
  const K = '#2b1d2e';
  const R = Math.round;
  const out = [];
  const EPS = 1e-6;
  // compact raster encoder: horizontal runs merged vertically into rectangles
  const enc = cv => {
    const by = {}; let open = new Map();
    const flush = r => (by[r.c] = by[r.c] || []).push(`M${r.x} ${r.y}h${r.n}v${r.h}h-${r.n}z`);
    for (let y = 0; y < cv.h; y++) {
      const next = new Map(); let x = 0;
      while (x < cv.w) {
        const c = cv.px[y * cv.w + x]; if (!c) { x++; continue; }
        let n = 1; while (x + n < cv.w && cv.px[y * cv.w + x + n] === c) n++;
        const k = `${x},${n},${c}`; const r = open.get(k);
        if (r) { r.h++; open.delete(k); next.set(k, r); } else next.set(k, { x, y, n, h: 1, c });
        x += n;
      }
      for (const r of open.values()) flush(r);
      open = next;
    }
    for (const r of open.values()) flush(r);
    return Object.entries(by).map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
  };
  const vis = (inner, a, b) => `<g opacity="0">${C.show(a, b)}${inner}</g>`;

  // ---------------------------------------------------------------- palette
  const P = {
    wall: '#c6e3c4', wallS: '#b6d8b6', wallD: '#9cc4a0',
    wood: '#b07a4f', woodD: '#8a5a3c', woodDD: '#6b412c', woodL: '#d09a68', woodLL: '#e6b884',
    tile: '#f7f1e6', grout: '#d9ccb6',
    cab: '#f1dcb4', cabS: '#d9bf92', cabL: '#fbecd0',
    flA: '#f2e1c2', flB: '#d9a986', flAL: '#fff5d9', flBL: '#f2c79c',
    fridge: '#f4ecdc', fridgeS: '#dccfb6', fridgeL: '#ffffff', chrome: '#b9c6d2',
    sky1: '#8fd3ff', sky2: '#bfe8ff', sky3: '#ffe7c4', roof: '#9fb6d8', roofD: '#8aa2c8',
    leaf: '#5fae5a', leafD: '#3f7d4a', leafL: '#8fd06a',
    red: '#e2574c', redD: '#b83d3d', redL: '#ff9a8a',
    pot: '#d0714a', potD: '#a8553a', potL: '#e8946a',
    blue: '#5f8fd6', blueD: '#3d5a9a', blueL: '#9cc0f0', blueLL: '#d6e8ff',
    iron: '#3d3444', ironL: '#5d5468', copper: '#d9824a', copperL: '#f2b27a', copperD: '#a85a2e',
    cream: '#fff3e0', gold: '#ffcf7a', light: '#ffe9b8',
    kib: '#a0522d', kibL: '#c97c3e', kibD: '#6e3a1f',
    sleeve: '#7390c9', sleeveD: '#56709f', sleeveL: '#94aee0', skin: '#f7c9a0', skinD: '#e0a27a',
    bag: '#dba468', bagD: '#b97f47', bagL: '#ecc088', mat: '#ec8c78', matD: '#cf6a5c', matL: '#f7b6a2',
  };

  // ================================================================ BACKGROUND
  const bg = new Canvas(256, 144);
  // wall with soft vertical stripes + tiny flower motif
  C.def(`<pattern id="s2_wallp" width="12" height="24" patternUnits="userSpaceOnUse"><rect width="12" height="24" fill="${P.wall}"/><rect width="2" height="24" fill="${P.wallS}"/><path fill="${P.wallD}" d="M6 8h1v1h-1zM5 9h3v1h-3zM6 10h1v1h-1zM0 20h1v1h-1zM11 21h1v1h-1zM0 21h1v1h-1zM1 21h1v1h-1zM0 22h1v1h-1z"/></pattern>`);
  out.push(`<rect width="256" height="99" fill="url(#s2_wallp)"/>`);
  // crown molding
  bg.rect(0, 0, 256, 2, P.woodD); bg.rect(0, 2, 256, 1, P.woodL); bg.rect(0, 3, 256, 1, P.wallD);
  // wainscot (right wall, beadboard)
  bg.rect(144, 68, 112, 31, (x, y) => (x % 6 === 0 ? P.cabS : P.cab));
  bg.rect(144, 66, 112, 2, P.woodL); bg.rect(144, 68, 112, 1, P.woodD);

  // ---- floor: perspective checker tiles
  const FY = 99;
  const ROWS = [99, 102, 106, 111, 117, 124, 132, 141, 152];
  const rowOf = y => { let i = 0; while (y >= ROWS[i + 1]) i++; return i; };
  const floorCol = (x, y) => {
    const w = 25 * (y - 34) / 110;
    const k = Math.floor((x + .5 - 128) / w);
    return ((k + rowOf(y)) & 1) ? P.flA : P.flB;
  };
  bg.rect(0, FY, 256, 144 - FY, floorCol);
  // baseboard
  bg.rect(0, 96, 256, 3, P.woodD); bg.rect(0, 96, 256, 1, P.woodL);
  bg.rect(0, 99, 256, 1, '#c49270');

  // ---- sunlight patch on the floor (window projected, with mullion cross)
  const LIT = { [P.flA]: P.flAL, [P.flB]: P.flBL, '#c49270': '#e2b48c' };
  const lit = new Set();
  for (let s = 0; s <= 1; s += 1 / 260) for (let w = 0; w <= 1; w += 1 / 160) {
    if (Math.abs(s - .5) < .025 || Math.abs(w - .5) < .04) continue; // mullions
    const x = C.lerp(C.lerp(84, 140, s), C.lerp(114, 166, s), w);
    const y = C.lerp(142, 104, w);
    const edge = s < .05 || s > .95 || w < .06 || w > .94 || Math.abs(s - .5) < .05 || Math.abs(w - .5) < .07;
    const X = R(x), Y = R(y);
    if (Y < FY) continue;
    if (edge && C.bayer(X, Y) >= 8) continue;
    lit.add(Y * 256 + X);
  }
  for (const i of lit) { const x = i % 256, y = (i / 256) | 0; const c = bg.get(x, y); if (LIT[c]) bg.set(x, y, LIT[c]); }

  // ---- fridge (retro cream)
  const FX = 4, FW = 34, FT = 22;
  bg.rect(FX, FT, FW, 77, P.fridge);
  bg.rect(FX + FW - 3, FT, 3, 77, P.fridgeS); bg.rect(FX + 1, FT + 1, 1, 75, P.fridgeL);
  bg.rect(FX, 45, FW, 1, K); bg.rect(FX + 1, 46, FW - 2, 1, P.fridgeS);
  // outline + rounded corners
  bg.rect(FX - 1, FT, 1, 77, K); bg.rect(FX + FW, FT, 1, 77, K); bg.rect(FX, FT - 1, FW, 1, K);
  bg.set(FX, FT, K); bg.set(FX + FW - 1, FT, K);
  bg.rect(FX + 2, 97, 4, 2, K); bg.rect(FX + FW - 6, 97, 4, 2, K);
  // handles
  bg.rect(FX + FW - 6, 30, 2, 11, P.chrome); bg.rect(FX + FW - 6, 30, 1, 11, '#e8eef4'); bg.rect(FX + FW - 4, 30, 1, 11, '#8896a4');
  bg.rect(FX + FW - 6, 50, 2, 16, P.chrome); bg.rect(FX + FW - 6, 50, 1, 16, '#e8eef4'); bg.rect(FX + FW - 4, 50, 1, 16, '#8896a4');
  // magnets & papers: child's drawing (sun + cat)
  bg.rect(8, 26, 12, 14, P.cream).rect(8, 26, 12, 1, P.fridgeS);
  bg.circle(12, 30, 2, P.gold); bg.set(12, 26, P.gold); bg.set(16, 30, P.gold);
  bg.rect(13, 35, 5, 3, '#f2a14a'); bg.set(13, 34, '#f2a14a'); bg.set(17, 34, '#f2a14a'); bg.line(9, 38, 19, 38, P.leaf);
  bg.rect(13, 25, 2, 2, P.red);
  // note with lines, heart magnet
  bg.rect(8, 52, 11, 13, '#fff8c8'); for (let y = 55; y < 64; y += 2) bg.line(10, y, 16 - (y % 4), y, '#b0a8c8');
  bg.rect(12, 50, 3, 3, P.blue); bg.set(12, 50, P.blueL);
  // polaroid of Mikan
  bg.rect(21, 58, 9, 11, '#ffffff'); bg.rect(22, 59, 7, 6, '#8fd3ff'); bg.rect(23, 62, 5, 3, '#f2a14a'); bg.set(23, 61, '#f2a14a'); bg.set(27, 61, '#f2a14a');
  bg.set(25, 57, P.red); bg.set(24, 57, P.red);
  // fish magnet + heart magnet
  bg.art(['.bbb.b', 'bbwbbb', '.bbb.b'], { b: '#f28a4a', w: K }, 22, 49);
  bg.art(['r.r', 'rrr', '.r.'], { r: P.red }, 24, 30);
  // letters A B C
  bg.art(['.g.', 'g.g', 'ggg', 'g.g'], { g: P.leaf }, 10, 72);
  bg.art(['yy.', 'yyy', 'y.y', 'yy.'], { y: '#f2c14a' }, 14, 73);
  bg.art(['.pp', 'p..', 'p..', '.pp'], { p: '#d86aa8' }, 18, 72);
  // basket on fridge with bread & apple
  bg.rect(8, 15, 24, 7, (x, y) => ((x + y) % 3 === 0 ? P.woodD : P.woodL));
  bg.rect(8, 15, 24, 1, P.woodD); bg.rect(7, 16, 1, 5, K); bg.rect(32, 16, 1, 5, K); bg.rect(8, 22, 24, 0, K);
  // baguette + loaf peeking out
  cat.thick(bg, [[11, 14], [24, 5]], 1.6, P.woodLL); bg.line(11, 16, 25, 6, P.wood);
  [[14, 11], [17, 9], [20, 7]].forEach(([x, y]) => { bg.set(x, y, P.woodL); bg.set(x + 1, y - 1, P.woodL); });
  bg.ellipse(18, 14, 5, 3, P.woodL); bg.rect(15, 12, 6, 1, P.woodLL); bg.set(16, 14, P.wood); bg.set(19, 14, P.wood);
  bg.circle(26, 12, 3, P.red); bg.set(25, 10, P.redL); bg.set(26, 8, P.leafD);

  // ---- counter: backsplash, top, cabinets
  const CX0 = 40, CX1 = 144;
  bg.rect(CX0, 40, CX1 - CX0, 22, (x, y) => ((y - 40) % 5 === 4 || ((x - CX0 + ((((y - 40) / 5) | 0) & 1) * 4) % 8 === 7) ? P.grout : P.tile));
  for (let x = CX0 + 3; x < CX1; x += 16) bg.rect(x, 50, 4, 4, P.blueL); // accent tiles
  bg.rect(CX0, 39, CX1 - CX0, 1, P.grout);
  bg.rect(CX0 - 1, 61, CX1 - CX0 + 2, 1, K);
  bg.rect(CX0 - 1, 62, CX1 - CX0 + 2, 1, P.woodLL); bg.rect(CX0 - 1, 63, CX1 - CX0 + 2, 2, P.wood); bg.rect(CX0 - 1, 65, CX1 - CX0 + 2, 1, P.woodDD);
  bg.rect(CX0, 66, CX1 - CX0, 30, P.cab);
  bg.rect(CX0, 66, CX1 - CX0, 1, P.cabS);
  // drawers row + doors
  for (let i = 0; i < 4; i++) {
    const x = CX0 + 2 + i * 26, w = 24;
    bg.rect(x, 68, w, 6, P.cabL); bg.rect(x, 74, w, 1, P.cabS); bg.rect(x + 9, 70, 6, 1, P.woodD); bg.rect(x + 9, 71, 6, 1, P.woodDD);
    bg.rect(x, 77, w, 18, P.cabS); bg.rect(x + 2, 79, w - 4, 14, P.cab); bg.rect(x + 2, 79, w - 4, 1, P.cabL);
    bg.rect(x + (i % 2 ? 3 : w - 5), 84, 2, 3, P.woodD);
  }
  bg.rect(CX0, 95, CX1 - CX0, 1, P.cabS);
  bg.rect(CX0 - 1, 66, 1, 30, K); bg.rect(CX1, 66, 1, 30, K);
  // towel hanging on first drawer
  bg.rect(47, 72, 8, 13, (x, y) => (y % 4 === 0 ? P.red : P.cream)); bg.rect(47, 72, 8, 1, P.woodDD);
  // stove hob on the counter (under the kettle)
  bg.rect(114, 60, 26, 2, P.iron); bg.rect(114, 60, 26, 1, P.ironL);
  // knobs
  bg.rect(118, 67, 3, 3, P.iron); bg.rect(132, 67, 3, 3, P.iron); bg.set(119, 67, P.ironL); bg.set(133, 67, P.ironL);

  // ---- shelf with jars (left, above counter)
  bg.rect(44, 30, 52, 2, P.wood); bg.rect(44, 30, 52, 1, P.woodLL); bg.rect(44, 32, 52, 1, P.woodDD);
  bg.rect(48, 33, 2, 4, P.woodD); bg.rect(90, 33, 2, 4, P.woodD);
  // pasta jar
  bg.rect(46, 18, 9, 12, '#dff2f4'); bg.rect(46, 17, 9, 1, P.woodD); bg.rect(45, 16, 11, 1, P.woodD);
  bg.rect(47, 22, 7, 8, (x, y) => ((x + y) % 2 ? '#f5d27a' : '#e8b85a')); bg.rect(46, 18, 1, 12, '#ffffff');
  bg.rect(45, 17, 1, 13, K); bg.rect(55, 17, 1, 13, K);
  // treat jar with fish label
  bg.rect(58, 20, 10, 10, '#f5e0c8'); bg.rect(58, 18, 10, 2, P.red); bg.rect(62, 17, 2, 1, P.redD);
  bg.art(['.bb.b', 'bbbbb', '.bb.b'], { b: P.blue }, 60, 23); bg.rect(57, 18, 1, 12, K); bg.rect(68, 18, 1, 12, K);
  // trailing pothos plant
  bg.rect(72, 24, 8, 6, P.pot); bg.rect(72, 24, 8, 1, P.potL); bg.rect(73, 29, 6, 1, P.potD);
  bg.ellipse(76, 21, 6, 4, (x, y) => ((x + y) % 3 ? P.leaf : P.leafD));
  [[70, 26], [69, 30], [70, 34], [69, 38], [71, 41]].forEach(([x, y]) => { bg.set(x, y, P.leafD); bg.set(x + 1, y, P.leaf); bg.set(x, y + 1, P.leaf); bg.set(x, y + 2, P.leafD); });
  [[81, 25], [82, 29], [81, 33], [82, 36]].forEach(([x, y]) => { bg.set(x, y, P.leaf); bg.set(x - 1, y + 1, P.leafD); bg.set(x, y + 2, P.leaf); });
  // two mugs
  bg.rect(84, 24, 5, 6, P.cream); bg.rect(89, 25, 2, 3, K); bg.rect(84, 24, 5, 1, P.cabS); bg.rect(85, 26, 2, 2, P.red);
  bg.rect(91, 25, 4, 5, P.blueL); bg.rect(91, 25, 4, 1, P.blue);

  // ---- hanging pan rail + utensils
  bg.rect(98, 11, 42, 2, P.iron); bg.rect(98, 11, 42, 1, P.ironL); bg.rect(97, 10, 2, 4, P.woodD); bg.rect(139, 10, 2, 4, P.woodD);
  // frying pan
  bg.rect(104, 13, 1, 2, P.ironL); bg.rect(103, 15, 3, 10, P.woodD); bg.rect(103, 15, 1, 10, P.woodL);
  bg.circle(104, 32, 8, K); bg.circle(104, 32, 7, P.iron); bg.circle(104, 32, 5, P.ironL); bg.circle(104, 32, 4, P.iron);
  bg.set(101, 28, '#8a8098'); bg.set(100, 29, '#8a8098');
  // copper saucepan
  bg.rect(119, 13, 1, 3, P.ironL); bg.rect(118, 16, 3, 8, P.copperD); bg.rect(118, 16, 1, 8, P.copper);
  bg.rect(112, 24, 15, 12, P.copper); bg.rect(112, 24, 15, 2, P.copperL); bg.rect(112, 34, 15, 2, P.copperD); bg.rect(114, 27, 1, 6, '#ffd6a8');
  bg.rect(111, 24, 1, 12, K); bg.rect(127, 24, 1, 12, K); bg.rect(112, 36, 15, 1, K); bg.rect(112, 23, 15, 1, K);
  // ladle
  bg.rect(133, 13, 1, 16, '#c9d3dc'); bg.rect(134, 13, 1, 16, '#8896a4'); bg.circle(133.5, 31, 2.6, '#8896a4'); bg.circle(133, 30.5, 1.5, '#c9d3dc');

  // ---- window (morning sky) — frame drawn on top of animated sky layer later
  const WX0 = 150, WX1 = 206, WY0 = 14, WY1 = 58;
  const sky = new Canvas(256, 144);
  sky.rect(WX0, WY0, WX1 - WX0, WY1 - WY0, (x, y) => {
    const u = (y - WY0) / (WY1 - WY0);
    if (u < .35) return C.bayer(x, y) < u / .35 * 10 ? P.sky2 : P.sky1;
    if (u < .75) return C.bayer(x, y) < (u - .35) / .4 * 8 ? P.sky3 : P.sky2;
    return P.sky3;
  });
  // sun glow top-right
  sky.circle(198, 22, 6, '#fff4cf'); sky.circle(198, 22, 4, '#ffffff');
  // distant roofs
  sky.poly([[150, 50], [160, 44], [170, 50]], P.roofD); sky.rect(152, 50, 16, 8, P.roof);
  sky.poly([[166, 52], [178, 46], [190, 52]], P.roofD); sky.rect(168, 52, 20, 6, P.roof);
  sky.rect(172, 54, 3, 2, '#ffe9b8'); sky.rect(157, 52, 2, 2, '#ffe9b8');
  // tree
  sky.ellipse(197, 42, 9, 9, (x, y) => ((x * 3 + y * 5) % 7 < 2 ? P.leafL : P.leaf)); sky.rect(196, 48, 3, 10, P.woodD);
  sky.ellipse(194, 38, 5, 4, P.leafL);
  out.push(enc(bg));
  out.push(enc(sky));
  // drifting cloud clipped to window
  C.def(`<clipPath id="s2_winclip"><rect x="${WX0}" y="${WY0}" width="${WX1 - WX0}" height="${WY1 - WY0}"/></clipPath>`);
  C.sprite('s2_cloud', `
    ....wwww.......
    ..wwwwwwww.ww..
    .wwwwwwwwwwwwww
    wwwwwwwwwwwwwww
    .ssssssssssss..`, { w: '#ffffff', s: '#dff1ff' });
  C.sprite('s2_cloud2', `
    ..www....
    .wwwwwww.
    wwwwwwwww
    .sssssss.`, { w: '#ffffff', s: '#dff1ff' });
  out.push(`<g clip-path="url(#s2_winclip)">
    <g>${C.move(t0, t1, 4, t => [C.lerp(140, 176, (t - t0) / (t1 - t0)), 22])}${C.use('s2_cloud', 0, 0)}</g>
    <g>${C.move(t0, t1, 4, t => [C.lerp(182, 204, (t - t0) / (t1 - t0)), 30])}${C.use('s2_cloud2', 0, 0)}</g>
  </g>`);

  // window frame, mullions, glass shine, curtains, sill
  const wf = new Canvas(256, 144);
  wf.rect(WX0 - 3, WY0 - 3, WX1 - WX0 + 6, 3, P.cream); wf.rect(WX0 - 3, WY1, WX1 - WX0 + 6, 2, P.cream);
  wf.rect(WX0 - 3, WY0, 3, WY1 - WY0, P.cream); wf.rect(WX1, WY0, 3, WY1 - WY0, P.cream);
  wf.rect(177, WY0, 2, WY1 - WY0, P.cream); wf.rect(WX0, 35, WX1 - WX0, 2, P.cream);
  wf.rect(179, WY0, 1, WY1 - WY0, '#d8cbb0'); wf.rect(WX0, 37, WX1 - WX0, 1, '#d8cbb0');
  // outline around the frame
  wf.rect(WX0 - 4, WY0 - 4, WX1 - WX0 + 8, 1, K); wf.rect(WX0 - 4, WY0 - 4, 1, WY1 - WY0 + 7, K); wf.rect(WX1 + 3, WY0 - 4, 1, WY1 - WY0 + 7, K);
  // shine
  [[153, 30], [156, 27], [181, 52], [184, 49]].forEach(([x, y]) => { for (let i = 0; i < 4; i++) wf.set(x + i, y - i, '#ffffffcc'); });
  // café-curtain valance (gingham) with scallops
  wf.rect(WX0 - 5, 8, WX1 - WX0 + 10, 9, (x, y) => (((x >> 1) + (y >> 1)) & 1 ? '#f08a7c' : P.cream));
  for (let x = WX0 - 5; x < WX1 + 5; x += 6) { wf.rect(x + 1, 17, 4, 1, '#f08a7c'); wf.rect(x + 2, 18, 2, 1, '#f08a7c'); }
  wf.rect(WX0 - 6, 7, WX1 - WX0 + 12, 1, P.woodD); wf.set(WX0 - 7, 7, P.woodDD); wf.set(WX1 + 6, 7, P.woodDD);
  // sill
  wf.rect(WX0 - 6, 58, WX1 - WX0 + 12, 2, P.woodLL); wf.rect(WX0 - 6, 60, WX1 - WX0 + 12, 2, P.wood); wf.rect(WX0 - 5, 62, WX1 - WX0 + 10, 1, P.woodDD);
  // pots on sill
  const potAt = (x, w) => { wf.rect(x, 51, w, 7, P.pot); wf.rect(x - 1, 50, w + 2, 2, P.potL); wf.rect(x + 1, 52, 1, 5, P.potL); wf.rect(x + w - 1, 52, 1, 6, P.potD); };
  potAt(155, 8); potAt(169, 7); potAt(190, 9);
  out.push(enc(wf));

  // ---- pendulum wall clock (below HUD box)
  const clk = new Canvas(256, 144);
  clk.rect(227, 34, 12, 20, P.woodD); clk.rect(228, 35, 10, 18, P.wood); clk.rect(229, 38, 8, 13, '#f8ecd4'); clk.rect(229, 38, 8, 1, P.woodDD);
  clk.rect(226, 53, 14, 2, P.woodDD);
  clk.circle(233, 25, 10, K); clk.circle(233, 25, 9, P.woodD); clk.circle(233, 25, 8, P.wood); clk.circle(233, 25, 7, P.cream);
  for (let h = 0; h < 12; h++) { const a = h * Math.PI / 6; clk.set(R(232.5 + Math.sin(a) * 6), R(24.5 - Math.cos(a) * 6), h % 3 ? '#c9b89a' : K); }
  clk.poly([[226, 17], [233, 11], [240, 17]], P.woodD); clk.set(233, 12, P.woodLL);
  out.push(enc(clk));
  // clock hands
  const hand = (id, ang, len, col) => {
    const cv = new Canvas(21, 21); const a = ang * Math.PI / 180;
    cv.line(10, 10, 10 + Math.sin(a) * len, 10 - Math.cos(a) * len, col);
    return C.spriteRaw(id, enc(cv), 21, 21);
  };
  const clockHands = [];
  for (let i = 0; i < 12; i++) {
    const tt = t0 + i * (t1 - t0) / 12, mins = 30 + 45 * (tt - t0) / (t1 - t0);
    const mid = hand(`s2_mh${i}`, mins * 6, 6, K), hid = hand(`s2_hh${i}`, (7 + mins / 60) * 30, 4, P.woodDD);
    clockHands.push(vis(C.use(hid, 223, 15) + C.use(mid, 223, 15), i ? tt : 0, i < 11 ? t0 + (i + 1) * (t1 - t0) / 12 : 60));
  }
  out.push(clockHands.join(''));
  out.push(`<rect x="232" y="24" width="2" height="2" fill="${K}"/>`);
  // pendulum (loops)
  ['L', 'C', 'R', 'C'].forEach((k, i) => {
    const dx = { L: -2, C: 0, R: 2 }[k];
    if (i === 3) return;
    const cv = new Canvas(12, 14);
    cv.line(6, 0, 6 + dx, 8, P.woodDD); cv.circle(6 + dx, 10, 2.2, P.gold); cv.set(5 + dx, 9, '#fff4cf');
    C.spriteRaw(`s2_pend${k}`, enc(cv), 12, 14);
  });
  out.push(C.flipbook(['s2_pendL', 's2_pendC', 's2_pendR', 's2_pendC'], 3.4, 227, 37));

  // ---- corner monstera (sways)
  const plant = sw => {
    const cv = new Canvas(40, 46);
    const leafAt = (cx, cy, rx, ry, dark) => {
      cv.ellipse(cx, cy, rx, ry, dark ? P.leafD : P.leaf);
      cv.line(cx - rx + 1, cy, cx + rx - 1, cy, dark ? '#2f5f3a' : P.leafD);
      cv.set(R(cx - rx / 2), R(cy - 1), P.wall); cv.set(R(cx + rx / 2), R(cy + 1), P.wall);
    };
    cv.line(20, 44, 12 + sw, 14, P.leafD); cv.line(20, 44, 28 + sw, 10, P.leafD); cv.line(20, 44, 20 + sw, 6, P.leafD); cv.line(20, 44, 7 + sw, 28, P.leafD); cv.line(20, 44, 33 + sw, 26, P.leafD);
    leafAt(10 + sw, 14, 7, 4, 1); leafAt(29 + sw, 10, 7, 4, 0); leafAt(20 + sw, 7, 5, 5, 0); leafAt(7 + sw, 28, 6, 3, 0); leafAt(33 + sw, 26, 6, 3, 1);
    cv.outline(K);
    return cv;
  };
  C.spriteRaw('s2_pl0', enc(plant(0)), 40, 46); C.spriteRaw('s2_pl1', enc(plant(1)), 40, 46);
  out.push(C.flipbook(['s2_pl0', 's2_pl1'], 1.2, 214, 50));
  const potC = new Canvas(256, 144);
  potC.rect(224, 86, 20, 13, P.pot); potC.rect(222, 84, 24, 3, P.potL); potC.rect(226, 88, 2, 9, P.potL); potC.rect(241, 88, 2, 11, P.potD);
  potC.rect(224, 99, 20, 1, 'rgba(60,30,40,0.3)');
  potC.outline(K);
  out.push(enc(potC));

  // ---- sill plants (sway)
  const sill = sw => {
    const cv = new Canvas(56, 16);
    // basil (x 155..163 -> local 5..13)
    [[6, 8], [9, 5], [12, 8], [8, 2], [11, 3]].forEach(([x, y], i) => { cv.ellipse(x + (y < 5 ? sw : 0), y + 3, 2.2, 1.6, i % 2 ? P.leaf : P.leafL); });
    // flower (169..176 -> 19..26)
    cv.line(22, 14, 22 + sw, 5, P.leafD); cv.line(22, 12, 25, 10, P.leafD); cv.set(25, 9, P.leaf); cv.set(19, 10, P.leaf); cv.line(22, 12, 19, 10, P.leafD);
    cv.circle(22.5 + sw, 4.5, 2.2, '#f59aaa'); cv.set(22 + sw, 4, P.gold);
    // cactus (190..199 -> 40..49)
    cv.rect(43, 4, 4, 12, P.leafD); cv.rect(44, 4, 2, 12, P.leaf); cv.rect(40, 8, 3, 2, P.leafD); cv.rect(40, 6, 2, 2, P.leaf); cv.rect(47, 9, 3, 2, P.leafD); cv.rect(48, 7, 2, 2, P.leaf);
    cv.set(44 + sw, 3, '#f59aaa');
    cv.outline(K);
    return cv;
  };
  C.spriteRaw('s2_sl0', enc(sill(0)), 56, 16); C.spriteRaw('s2_sl1', enc(sill(1)), 56, 16);
  out.push(C.flipbook(['s2_sl0', 's2_sl1', 's2_sl0', 's2_sl0'], 2.5, 150, 37));

  // ---- kettle on the hob + flame
  const kt = new Canvas(30, 20);
  kt.ellipse(13, 12, 10, 7.5, (x, y) => (y > 15 ? P.redD : x < 8 && y < 10 ? P.redL : P.red));
  kt.rect(3, 17, 21, 2, P.redD);
  kt.poly([[21, 12], [27, 3], [29, 4], [24, 14]], P.red); // spout
  kt.outline(K);
  kt.rect(10, 4, 7, 1, P.redD); kt.rect(12, 2, 3, 2, K);
  kt.set(7, 8, '#ffffff'); kt.set(6, 9, '#ffffff'); kt.set(8, 7, '#ffffff');
  // cute fish decal
  kt.art(['.cc.c', 'ccccc', '.cc.c'], { c: P.cream }, 11, 11);
  C.spriteRaw('s2_kettle', enc(kt), 30, 20);
  // handle arc (drawn behind by using separate canvas first)
  const kh = new Canvas(30, 20); for (let a = 0; a <= Math.PI; a += .05) kh.set(R(13 - Math.cos(a) * 8), R(8 - Math.sin(a) * 7), K);
  for (let a = 0.2; a <= Math.PI - .2; a += .05) kh.set(R(13 - Math.cos(a) * 7), R(8 - Math.sin(a) * 6), '#5a4a5e');
  C.spriteRaw('s2_khandle', enc(kh), 30, 20);
  out.push(C.use('s2_khandle', 112, 40) + C.use('s2_kettle', 112, 40));
  C.sprite('s2_fl0', '.b..b.b.\nbybbybby', { b: '#5fb0ee', y: '#ffcf7a' });
  C.sprite('s2_fl1', 'b..b.b..\nbbybbyby', { b: '#5fb0ee', y: '#ffcf7a' });
  out.push(C.flipbook(['s2_fl0', 's2_fl1'], 8, 117, 58));

  // ---- kettle steam (rising pixel puffs, looping)
  const SM = { w: '#ffffff', s: '#dfeeea' };
  C.sprite('s2_st0', ['ww', 'ws'], SM);
  C.sprite('s2_st1', ['.ww.', 'wwww', 'wwws', '.ss.'], SM);
  C.sprite('s2_st2', ['..ww..', '.wwwww', 'wwwwww', 'wwwwws', '.ssss.'], SM);
  C.sprite('s2_st3', ['.w..w.', 'w.ww.w', '..w...', '.s..s.'], SM);
  const SZ = [[2, 2], [4, 4], [6, 5], [6, 4]];
  const steam = [];
  for (let i = 0; i < 5; i++) {
    const L = 1.7, ph = i * L / 5;
    const st = u => (u < .18 ? 0 : u < .45 ? 1 : u < .78 ? 2 : 3);
    steam.push(C.act({
      t0, t1, fps: 8,
      pose: t => { const u = ((t - t0 + ph) % L) / L; return `s2_st${st(u)}`; },
      pos: t => { const u = ((t - t0 + ph) % L) / L, s = SZ[st(u)]; return [141 + u * 5 + Math.sin(u * 7 + i) * 2 - s[0] / 2, 41 - 30 * Math.pow(u, .8) - s[1] / 2]; },
    }));
  }
  out.push(`<g opacity=".95">${steam.join('')}</g>`);

  // ---- placemat (fish-shaped) + bowl back
  const BCX = 156; // bowl centre x
  const mat = new Canvas(256, 144);
  mat.ellipse(154, 121, 27, 6, P.mat); mat.poly([[178, 121], [192, 114], [190, 121], [192, 128]], P.mat);
  mat.ellipse(154, 121, 24, 4.4, (x, y) => ((x + y) % 4 === 0 ? P.matL : P.mat));
  mat.outline(P.matD);
  mat.set(133, 120, P.cream); mat.set(134, 120, K); // fish eye
  for (const i of lit) { const x = i % 256, y = (i / 256) | 0; const c = mat.get(x, y); if (c === P.mat) mat.set(x, y, '#f7a894'); else if (c === P.matL) mat.set(x, y, '#ffd0c0'); }
  out.push(enc(mat));

  const bowlBack = new Canvas(256, 144);
  bowlBack.ellipse(BCX, 114, 11, 3.5, P.blueL); bowlBack.ellipse(BCX, 114.5, 9, 2.4, P.blueD);
  bowlBack.ellipse(BCX, 115, 7, 1.6, '#2f467a');
  // outline top of rim
  for (let x = BCX - 11; x <= BCX + 11; x++) for (let y = 108; y < 115; y++) if (!bowlBack.get(x, y) && bowlBack.get(x, y + 1)) bowlBack.set(x, y, K);
  bowlBack.set(BCX - 11, 114, K); bowlBack.set(BCX + 11, 114, K);
  out.push(enc(bowlBack));

  // ---- kibble pile levels inside bowl
  const pileSprite = lv => {
    const cv = new Canvas(24, 12);
    const top = 7 - lv * 1.4;
    cv.ellipse(15, 8, 6, Math.max(1, 8 - top), (x, y) => {
      const k = (x * 7 + y * 13) % 5; return k === 0 ? P.kibD : k < 3 ? P.kib : P.kibL;
    });
    for (let x = 0; x < 24; x++) for (let y = 8; y < 12; y++) cv.set(x, y, null);
    return cv;
  };
  for (let lv = 1; lv <= 4; lv++) C.spriteRaw(`s2_pile${lv}`, enc(pileSprite(lv)), 24, 12);

  // ================================================================ KIBBLE PHYSICS
  const TH_POUR = 112;
  const PIV = [170, 71];
  const rot = (dx, dy, th) => { const a = th * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [dx * c + dy * s, -dx * s + dy * c]; };
  const mo = rot(9 - 18, 0.5 - 8, TH_POUR); const MOUTH = [PIV[0] + mo[0], PIV[1] + mo[1]];
  C.sprite('s2_kb0', 'ab\nbc', { a: P.kibL, b: P.kib, c: P.kibD });
  C.sprite('s2_kb1', 'ba\ncb', { a: P.kibL, b: P.kib, c: P.kibD });
  C.sprite('s2_kb2', 'ab', { a: P.kibL, b: P.kib });
  const rnd = C.rng(7);
  const NK = 34, POUR0 = 14.12, POUR1 = 14.85, G = 330, FPSK = 12;
  const inBowlLand = [];
  const kibs = [];
  for (let i = 0; i < NK; i++) {
    const ts = POUR0 + (POUR1 - POUR0) * i / NK + rnd() * .02;
    let x = MOUTH[0] + (rnd() - .5) * 3, y = MOUTH[1] + rnd() * 2;
    const outer = i % 6 === 3;
    const target = outer ? (i % 12 === 3 ? BCX - 10.5 : BCX + 10.5) : BCX - 6 + rnd() * 12;
    let vy = 15 + rnd() * 20;
    const tf = (-vy + Math.sqrt(vy * vy + 2 * G * (112 - y))) / G;
    let vx = (target - x) / tf;
    let phase = 0, bounces = 0, floorY = 0, tEnd = t1, t = ts, dt = 1 / 480;
    const samples = [];
    let nextS = Math.ceil(ts * FPSK - EPS) / FPSK;
    let settled = false;
    while (t < t1) {
      if (t >= nextS - EPS) { samples.push([nextS, `${R(x)} ${R(y)}`]); nextS += 1 / FPSK; }
      if (!settled) {
        vy += G * dt; x += vx * dt; y += vy * dt;
        if (phase === 0 && y >= 112 && vy > 0) {
          const d = Math.abs(x - BCX);
          if (d <= 8.5) { vy = -vy * .28; vx *= .3; phase = 1; }
          else if (d <= 12) { vy = -vy * .45; vx = Math.sign(x - BCX) * (22 + rnd() * 22); phase = 2; floorY = 121 + rnd() * 5; }
          else { phase = 2; floorY = 121 + rnd() * 5; }
        } else if (phase === 1 && y >= 113.5 && vy > 0) { tEnd = t; inBowlLand.push(t); break; }
        else if (phase === 2 && y >= floorY && vy > 0) {
          if (bounces < 1) { vy = -vy * .3; vx *= .45; bounces++; y = floorY; }
          else { y = floorY; settled = true; }
        }
      }
      t += dt;
    }
    if (!samples.length) samples.push([ts, `${R(x)} ${R(y)}`]);
    const st0 = samples[0][0];
    const spr = `s2_kb${i % 3}`;
    kibs.push(`<g opacity="0">${C.steps('opacity', [[0, 0], [st0, 1], [Math.max(tEnd, st0 + .05), 0]])}<g>${C.steps('translate', samples, 'animateTransform')}${C.use(spr, 0, 0)}</g></g>`);
  }
  inBowlLand.sort((a, b) => a - b);
  // pile level windows: fill as kibble lands, drain while eating
  const lvAt = tt => {
    if (tt < 15.35) { const n = inBowlLand.filter(v => v <= tt).length; return Math.min(4, Math.ceil(n / inBowlLand.length * 4 - .15)); }
    return C.pick(tt, [[15.35, 4], [15.9, 3], [16.5, 2], [17.05, 1], [17.5, 0]]);
  };
  const pileSt = C.sample(13.5, t1, 12, tt => lvAt(tt));
  let pileOut = '';
  for (let lv = 1; lv <= 4; lv++) pileOut += `<g opacity="0">${C.steps('opacity', [[0, 0], ...pileSt.map(([tt, v]) => [tt, v === lv ? 1 : 0])])}${C.use(`s2_pile${lv}`, BCX - 12, 104)}</g>`;
  out.push(pileOut);

  // ================================================================ MIKAN
  const catIds = {}; let nc = 0;
  const shX = { sit: 14, walk: 15, eat: 16 };
  function catS(p) {
    const k = JSON.stringify(p);
    if (catIds[k]) return catIds[k];
    const cv = cat.drawCat(p);
    const c2 = new Canvas(36, 30);
    c2.ellipse(shX[p.pose] || 15, 27.6, p.pose === 'walk' ? 11 : 12, 1.8, 'rgba(90,45,30,0.28)');
    cat.over(c2, cv);
    const id = `s2_cat${nc++}`;
    C.spriteRaw(id, enc(c2), 36, 30);
    return (catIds[k] = id);
  }
  const Y = 92, XS = 120, XE = 125, XC = 121;
  const walkX = t => (t < 11.7 ? C.lerp(-34, 106, C.inv(10.5, 11.7, t)) : C.lerp(106, XS, C.easeOut(C.inv(11.7, 12.0, t))));
  const catPose = t => {
    t += 0.02 + EPS;
    if (t < 10.5) return null;
    if (t < 12.0) { const s = Math.floor((t - 10.5) * 10) % 4; return catS({ pose: 'walk', step: s, tail: 105 + [0, 8, 0, -8][s], curl: -50 }); }
    if (t < 12.4) return catS({ pose: 'sit', eyes: 'look', headDY: 1, tail: 15, curl: 100 });
    if (t < 12.8) return catS({ pose: 'sit', eyes: 'closed', mouth: 'open', headDY: -1, tail: 30, curl: 90 });
    if (t < 13.0) return catS({ pose: 'sit', eyes: 'open', headDY: 0, tail: 20, curl: 100 });
    if (t < 13.5) return catS({ pose: 'sit', eyes: 'closed', mouth: 'yawn', headDY: -2, paw: 2, tail: 45, curl: 80 });
    if (t < 13.6) return catS({ pose: 'sit', eyes: 'open', headDY: -1, tail: 30, curl: 90 });
    if (t < 15.2) { const w = Math.floor((t - 13.6) * 4) % 2; return catS({ pose: 'sit', eyes: 'wide', headDY: -1, tail: w ? 70 : 95, curl: w ? 60 : 30, breath: w }); }
    if (t < 15.3) return catS({ pose: 'walk', step: 1, tail: 110, curl: -50 });
    if (t < 17.6) {
      const f = Math.floor((t - 15.3) * 10);
      const dy = [0, 2, 2, 0][f % 4];
      const tl = [90, 105, 120, 105][Math.floor((t - 15.3) / 0.4) % 4];
      return catS({ pose: 'eat', headDY: dy, eyes: dy ? 'closed' : 'happy', tail: tl, curl: -50 });
    }
    if (t < 18.0) return catS({ pose: 'sit', eyes: 'happy', headDY: 0, tail: 15, curl: 100 });
    const lick = (t < 18.15) || (t >= 18.3 && t < 18.45) || (t >= 18.7 && t < 18.8);
    return catS({ pose: 'sit', eyes: 'happy', mouth: lick ? 'tongue' : 'cat', breath: Math.floor((t - 18) * 2) % 2, tail: 15, curl: 100 });
  };
  const catPos = t => {
    t += 0.02 + EPS;
    if (t < 12.0) return [walkX(t), Y];
    if (t < 15.2) return [XS, Y];
    if (t < 15.3) return [123, Y];
    if (t < 17.6) return [XE, Y];
    return [XC, Y];
  };
  out.push(C.act({ t0: 10.38, t1: 18.98, fps: 10, pose: catPose, pos: catPos }));

  // ---- bowl front (occludes Mikan's muzzle while eating)
  const bowlF = new Canvas(256, 144);
  bowlF.poly([[BCX - 11, 114], [BCX + 12, 114], [BCX + 10, 123], [BCX - 9, 123]], (x, y) => (y >= 121 ? P.blueD : x < BCX - 6 ? P.blueL : P.blue));
  // front half of rim
  bowlF.rect(BCX - 11, 114, 23, 1, P.blueLL);
  for (let x = BCX - 10; x <= BCX + 10; x++) { const yy = R(114 + Math.sqrt(Math.max(0, 1 - ((x - BCX) / 11) ** 2)) * 2.5); bowlF.set(x, yy, P.blueLL); bowlF.set(x, yy - 1, P.blueLL); }
  bowlF.outline(K);
  // clear outline pixels above the rim line so pile/cat head show
  for (let x = 0; x < 256; x++) for (let y = 100; y < 114; y++) bowlF.set(x, y, null);
  // fish logo
  bowlF.art(['..www..w', '.wwwwwww', 'wwkwwww.', '.wwwwwww', '..www..w'], { w: P.cream, k: K }, BCX - 4, 116);
  out.push(enc(bowlF));
  out.push(kibs.join(''));

  // ---- crumbs flicked out while eating
  const crumbs = [];
  const rc = C.rng(99);
  for (let i = 0; i < 8; i++) {
    const ts = 15.55 + i * 0.26 + rc() * .08;
    let x = BCX - 3 + rc() * 6, y = 112, vx = (i % 2 ? 1 : -1) * (18 + rc() * 22), vy = -45 - rc() * 25;
    const fy = 118 + rc() * 7; const samp = []; let tt = ts;
    for (let k = 0; k < 14; k++) { samp.push([tt, `${R(x)} ${R(y)}`]); if (y >= fy && k > 0) break; const d = 1 / 12; vy += G * d; x += vx * d; y = Math.min(fy, y + vy * d); tt += d; }
    crumbs.push(`<g opacity="0">${C.steps('opacity', [[0, 0], [ts, 1], [t1, 0]])}<g>${C.steps('translate', samp, 'animateTransform')}${C.use(i % 2 ? 's2_kb2' : 's2_kb0', 0, 0)}</g></g>`);
  }
  out.push(crumbs.join(''));

  // ================================================================ OWNER'S HAND + BAG
  const bagTex = (u, v) => {
    if (u < 0 || v < 0 || u >= 18 || v >= 24) return null;
    if (u >= 14 && v >= 6 && v < 12) return (v % 2 === 1 && v < 11) ? P.skinD : P.skin; // fingers wrapping the bag
    if (v < 1) return '#6e4428';
    if (v < 3) return (u + v) % 2 ? P.bagL : P.bag;
    if (v === 4) return P.bagD;
    if (u >= 3 && u < 13 && v >= 8 && v < 19) {
      if (v < 10) return P.red;
      const fu = u - 4, fv = v - 12;
      const fish = ['..bbb..b', '.bbbbbbb', 'bbkbbbb.', '.bbbbbbb', '..bbb..b'];
      if (fv >= 0 && fv < 5 && fu >= 0 && fu < 8 && fish[fv][fu] !== '.') return fish[fv][fu] === 'k' ? K : P.blue;
      return P.cream;
    }
    if (u < 2) return P.bagD;
    return u >= 16 ? P.bagL : P.bag;
  };
  const AW = 70, AH = 110, AP = [40, 80];
  const armSprite = (id, th) => {
    const B = new Canvas(AW, AH);
    for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
      const dx = x + .5 - AP[0], dy = y + .5 - AP[1];
      const a = th * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      const col = bagTex(Math.floor(18 + lx), Math.floor(8 + ly));
      if (col) B.set(x, y, col);
    }
    B.outline(K);
    const A = new Canvas(AW, AH);
    cat.thick(A, [[AP[0] + 8, AP[1] - 8], [AP[0] + 20, AP[1] - 50], [AP[0] + 26, -12]], 5.5, P.sleeve);
    const Ab = new Canvas(AW, AH);
    cat.thick(Ab, [[AP[0] + 7, AP[1] - 6], [AP[0] + 9, AP[1] - 12]], 5.8, P.sleeveL);
    const H = new Canvas(AW, AH);
    H.ellipse(AP[0] + 3, AP[1] - 1, 4.5, 4, P.skin); H.set(AP[0] + 5, AP[1] + 2, P.skinD); H.set(AP[0] + 6, AP[1] + 1, P.skinD);
    H.outline(K);
    A.outline(K);
    // knit ribs (vertical lines along the sleeve)
    for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) if (A.get(x, y) === P.sleeve && A.get(x + 2, y) === K) A.set(x, y, P.sleeveD);
    cat.over(B, A);
    Ab.outline(K); for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) if (Ab.get(x, y) === P.sleeveL && x % 2) Ab.set(x, y, P.sleeve);
    cat.over(B, Ab); cat.over(B, H);
    return C.spriteRaw(id, enc(B), AW, AH);
  };
  [0, 45, 85, 106, 118].forEach(a => armSprite(`s2_arm${a}`, a));
  const armPose = t => {
    t += EPS;
    if (t < 13.6 || t >= 15.3) return null;
    if (t < 13.95) return 's2_arm0';
    if (t < 14.0) return 's2_arm45';
    if (t < 14.07) return 's2_arm85';
    if (t < 14.9) return (Math.floor((t - 14.07) * 12) % 3 === 1) ? 's2_arm118' : 's2_arm106';
    if (t < 15.0) return 's2_arm45';
    return 's2_arm0';
  };
  const armPos = t => {
    t += EPS;
    const bx = PIV[0] - AP[0], by = PIV[1] - AP[1];
    if (t < 13.95) return [bx + 10 * (1 - C.easeOut(C.inv(13.6, 13.95, t))), by - 95 * (1 - C.easeOut(C.inv(13.6, 13.95, t)))];
    if (t >= 15.0) return [bx + 6 * C.easeIn(C.inv(15.0, 15.3, t)), by - 100 * C.easeIn(C.inv(15.0, 15.3, t))];
    const shake = (t >= 14.07 && t < 14.9) ? [0, 1, 0, -1][Math.floor((t - 14.07) * 12) % 4] : 0;
    return [bx, by + shake];
  };
  out.push(C.act({ t0: 13.5, t1: 15.4, fps: 12, pose: armPose, pos: armPos }));

  // ================================================================ BUBBLES, HEART, SPARKLES
  const bub = new Canvas(24, 15);
  bub.rect(1, 0, 20, 11, '#ffffff'); bub.rect(0, 1, 22, 9, '#ffffff');
  bub.poly([[14, 10], [20, 10], [21, 14]], '#ffffff');
  bub.outline(K);
  C.spriteRaw('s2_bub1', enc(bub) + C.text('NYA!', 4, 3, K), 24, 15);
  const bub2 = new Canvas(32, 18);
  bub2.rect(2, 1, 26, 11, '#ffffff'); bub2.rect(1, 2, 28, 9, '#ffffff');
  [[0, 0], [14, -1], [29, 1], [30, 7], [27, 13], [0, 11], [6, 13]].forEach(([x, y]) => bub2.rect(x, y, 2, 2, '#ffffff'));
  bub2.poly([[18, 11], [24, 11], [27, 17]], '#ffffff');
  bub2.outline(K);
  C.spriteRaw('s2_bub2', enc(bub2) + C.text('NYAA!', 5, 4, P.red), 32, 18);
  // "sound" ticks near head
  C.sprite('s2_tick', 'k..\n.k.\n...\nkk.', { k: K });
  out.push(C.act({ t0: 12.38, t1: 12.9, fps: 12, pose: () => 's2_bub1', pos: t => [118, t < 12.45 ? 77 : 76] }));
  out.push(C.act({ t0: 12.98, t1: 13.55, fps: 12, pose: () => 's2_bub2', pos: t => [108 + (Math.floor((t - 13) * 12) % 2), t < 13.05 ? 71 : 70] }));
  out.push(vis(C.use('s2_tick', 150, 94), 12.98, 13.45));

  // heart floats up at 17.0
  C.sprite('s2_heart', `
    .KKK.KKK.
    KRPPKRRRK
    KRPRRRRRK
    KRRRRRRDK
    .KRRRRDK.
    ..KRRDK..
    ...KRK...
    ....K....`, { K, R: '#f2657a', P: '#ffd0d8', D: '#c9405a' });
  C.sprite('s2_hsp', ['.w.....', 'www...w', '.w.....'], { w: '#ffffff' });
  C.sprite('s2_heartS', '.K.K.\nKRKRK\n.KRK.\n..K..', { K, R: '#f2657a' });
  out.push(C.act({
    t0: 16.98, t1: 17.93, fps: 10,
    pose: t => (t < 17.06 ? 's2_heartS' : (t > 17.75 && Math.floor(t * 20) % 2) ? null : 's2_heart'),
    pos: t => { const u = C.inv(16.98, 17.93, t); return [147 + Math.sin(u * 9) * 1.6, 96 - 26 * C.easeOut(u)]; },
  }));
  out.push(C.act({ t0: 17.08, t1: 17.5, fps: 10, pose: t => (Math.floor((t - 17.08) * 10) % 2 ? null : 's2_hsp'), pos: t => { const u = C.inv(16.98, 17.93, t); return [146 + Math.sin(u * 9) * 1.6, 93 - 26 * C.easeOut(u)]; } }));
  // sparkle on the full bowl
  C.sprite('s2_spk0', '.w.\nwyw\n.w.', { w: '#ffffff', y: P.gold });
  C.sprite('s2_spk1', '..w..\n..w..\nwwyww\n..w..\n..w..', { w: '#ffffff', y: P.gold });
  out.push(C.act({ t0: 14.95, t1: 15.35, fps: 10, pose: t => (Math.floor((t - 14.95) * 10) % 2 ? 's2_spk1' : 's2_spk0'), pos: t => (Math.floor((t - 14.95) * 10) % 2 ? [158, 101] : [159, 102]) }));

  // "!" when the hand appears
  C.sprite('s2_excl', ['.kk.', 'kwwk', 'kwwk', 'kwwk', '.kk.', 'kwwk', '.kk.'], { k: K, w: P.gold });
  out.push(C.act({ t0: 13.58, t1: 14.05, fps: 12, pose: t => 's2_excl', pos: t => [139, t < 13.66 ? 84 : 82] }));

  // ---- foreground stool with knitted cushion (depth framing, bottom-left)
  const fg = new Canvas(40, 44);
  cat.thick(fg, [[6, 8], [2, 43]], 1.6, P.woodD); cat.thick(fg, [[28, 8], [33, 43]], 1.6, P.woodD);
  cat.thick(fg, [[18, 8], [18, 43]], 1.4, P.woodDD);
  fg.rect(3, 30, 30, 2, P.woodDD);
  fg.rect(0, 6, 36, 4, P.wood); fg.rect(0, 6, 36, 1, P.woodL); fg.rect(0, 9, 36, 1, P.woodDD);
  fg.ellipse(18, 4, 17, 3.5, (x, y) => ((x + (y & 1)) % 3 === 0 ? '#d9913a' : '#f0b04a'));
  fg.set(4, 2, P.cream); fg.set(31, 3, P.cream);
  fg.outline(K);
  C.spriteRaw('s2_stool', enc(fg), 40, 44);
  out.push(C.use('s2_stool', -8, 101));

  // ================================================================ LIGHT: beam + dust motes
  const beam = new Canvas(256, 144);
  beam.poly([[150, 14], [206, 14], [206, 58], [166, 104], [140, 142], [84, 142]], '#fff1c8');
  out.push(`<g opacity=".16">${C.tween('opacity', [[t0, .14], [12, .2], [14, .15], [16, .21], [18, .16], [t1, .19]])}${enc(beam)}</g>`);
  const rm = C.rng(5); const motes = [];
  for (let i = 0; i < 14; i++) {
    const u = rm(), w = rm();
    const bx = C.lerp(C.lerp(150, 206, u), C.lerp(100, 150, u), w), by = C.lerp(18, 130, w), ph = rm() * 6;
    const tw = C.sample(t0, t1, 3, t => (Math.sin(t * 2.3 + ph * 3) > -0.3 ? 1 : 0));
    motes.push(`<g>${C.move(t0, t1, 6, t => [bx + Math.sin(t * .7 + ph) * 3, by + Math.sin(t * .5 + ph * 2) * 4])}<rect width="1" height="1" fill="#fff8e0">${C.steps('opacity', tw)}</rect></g>`);
  }
  out.push(motes.join(''));
  // subtle warm morning grade
  out.push(`<rect width="256" height="144" fill="#ffb86a" opacity=".05"/>`);
  return out.join('\n');
};
