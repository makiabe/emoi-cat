// S6 NIGHT — cozy room, lamplight -> moonlight, Mikan falls asleep and dreams of sky-fish.
'use strict';
module.exports = ({ t0, t1, C, cat }) => {
  const P = 's6_';
  const { Canvas } = C;
  const K = cat.PAL.k;
  const W = 256, H = 144;

  // ---------------- colour helpers ----------------
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mul = (a, b) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v * B[i] / 255 * 1.08)); };
  const mix = (a, b, u) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * u)); };

  // light tints per band (0 dark .. 3 bright). hue-shifted: shadows purple, light warm / blue
  const TINT = {
    warm: ['#5e4c86', '#9a7c98', '#e2b690', '#fff0cc'],
    moon: ['#34366e', '#4c5a9a', '#7890d0', '#b4cbf6'],
  };
  const SC = {}; // cache
  const shade = (c, band, mode) => { const k = c + band + mode; return SC[k] || (SC[k] = mul(c, TINT[mode][band])); };

  // point in polygon
  const inPoly = (x, y, pts) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };

  // ---------------- layout ----------------
  const FLOOR = 100;
  const GL = { x: 18, y: 14, w: 55, h: 55 };          // window glass
  const MOON = { x: 31, y: 27, r: 9.5 };
  const LAMP = { x: 176, top: 28, bot: 44, base: 124 };
  const CUSH = { x: 128, y: 115 };
  const PATCH = [[58, 101], [100, 101], [172, 141], [130, 141]]; // moonlight on the floor
  const rim = (d, w) => C.clamp((1 - d) / w);
  const hyp = Math.hypot;
  const lampLight = (x, y) => {
    let L = 1.5;
    const dx = Math.abs(x - LAMP.x);
    if (y < FLOOR) {
      L += rim(hyp((x - LAMP.x) / 46, (y - 40) / 40), 0.3);
      L += rim(hyp((x - LAMP.x) / 20, (y - 38) / 15), 0.35);
      if (y > LAMP.bot) L += 0.9 * C.clamp((15 + (y - LAMP.bot) * 0.45 - dx) / 4);
      if (y < LAMP.top) L += 0.9 * C.clamp((8 + (LAMP.top - y) * 0.8 - dx) / 4);
    } else {
      L += rim(hyp((x - 150) / 62, (y - 121) / 17), 0.3);
      L += rim(hyp((x - 146) / 36, (y - 118) / 9), 0.4);
    }
    L -= 1 - rim(hyp((x - 150) / 178, (y - 74) / 104), 0.2); // corner vignette
    return C.clamp(L, 0.5, 3.49);
  };
  const moonLight = (x, y) => {
    let L = 0.5;
    L += rim(hyp((x - 45) / 62, (y - 40) / 58), 0.35);
    if (y >= FLOOR && inPoly(x, y, PATCH)) {
      L = 2.5;
      const u = (y - 101) / 40, mx = 79 + u * 72;
      if (Math.abs(x - mx) < 1.5 || Math.abs(y - 121) < 1) L = 1.5;
    }
    L -= 1 - rim(hyp((x - 128) / 190, (y - 74) / 110), 0.2);
    return C.clamp(L, 0.5, 3.49);
  };
  const band = (L, x, y) => C.clamp(Math.floor(L + (C.bayer(x, y) / 16 - 0.47) * 0.9), 0, 3);

  // render a pair of canvases (material + emissive) through a light mode
  function render(B, E, mode, lightFn) {
    const out = new Canvas(B.w, B.h);
    for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
      const e = E && E.get(x, y);
      if (e) { out.set(x, y, e); continue; }
      const c = B.get(x, y);
      if (!c) continue;
      if (c[0] === '!') { out.set(x, y, c.slice(1)); continue; } // unlit (e.g. outline ink)
      out.set(x, y, shade(c, band(lightFn(x, y), x, y), mode));
    }
    return out;
  }

  // compact SVG: merge identical runs of consecutive rows into rectangles
  function toSVG(cv) {
    const by = {};
    const open = {}; // key "c|x|w" -> [y0, n]
    const flush = (c, x, w, y0, n) => (by[c] = by[c] || []).push(`M${x} ${y0}h${w}v${n}h-${w}z`);
    let prev = {};
    for (let y = 0; y <= cv.h; y++) {
      const cur = {};
      if (y < cv.h) {
        let x = 0;
        while (x < cv.w) {
          const c = cv.px[y * cv.w + x];
          if (!c) { x++; continue; }
          let n = 1; while (x + n < cv.w && cv.px[y * cv.w + x + n] === c) n++;
          const k = c + '|' + x + '|' + n;
          cur[k] = prev[k] ? [prev[k][0], prev[k][1] + 1] : [y, 1];
          x += n;
        }
      }
      for (const k in prev) if (!cur[k] || cur[k][0] !== prev[k][0]) { const [c, x, w] = k.split('|'); flush(c, x, w, prev[k][0], prev[k][1]); }
      prev = cur;
    }
    return Object.entries(by).map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
  }

  // ---------------- base (material) canvas ----------------
  const B = new Canvas(W, H);
  // wall
  B.rect(0, 0, W, FLOOR, '#e2cfb2');
  // wallpaper: tiny diamond motif, sparse
  for (let y = 6; y < 72; y += 12) for (let x = ((y / 12) % 2) * 8 + 4; x < W; x += 16) { B.set(x, y, '#d0b898'); B.set(x, y + 1, '#d0b898'); }
  // wainscot
  B.rect(0, 74, W, 2, '#b07a4f'); B.rect(0, 76, W, 1, '#8a5a3c');
  B.rect(0, 77, W, 20, '#c89a70');
  for (let x = 6; x < W; x += 14) { B.rect(x, 79, 1, 16, '#a87650'); B.rect(x + 1, 79, 1, 16, '#dcb488'); }
  B.rect(0, 96, W, 1, '#8a5a3c'); B.rect(0, 97, W, 3, '#6b412c');
  // floor planks
  B.rect(0, FLOOR, W, H - FLOOR, '#a8714a');
  const planks = [100, 106, 113, 121, 130, 140];
  planks.forEach((py, i) => {
    B.rect(0, py, W, 1, '#6b412c');
    if (i < planks.length - 1) {
      const ph = planks[i + 1] - py;
      B.rect(0, py + 1, W, 1, '#b8845a');
      for (let x = (i * 37) % 60 + 8; x < W; x += 60) B.rect(x, py + 1, 1, ph - 1, '#6b412c');
    }
  });
  B.rect(0, 141, W, 3, '#a8714a');

  // curtain rod
  B.rect(2, 6, 88, 2, '#6b412c'); B.rect(1, 5, 3, 4, '#b07a4f'); B.rect(88, 5, 3, 4, '#b07a4f');
  // window frame
  B.rect(GL.x - 4, GL.y - 4, GL.w + 8, GL.h + 8, '#f0e2c8');
  B.rect(GL.x - 1, GL.y - 1, GL.w + 2, GL.h + 2, '#b89c80');
  B.rect(GL.x, GL.y, GL.w, GL.h, '#223'); // (sky is emissive)
  // sill
  B.rect(GL.x - 8, GL.y + GL.h + 3, GL.w + 16, 3, '#f6ead4'); B.rect(GL.x - 8, GL.y + GL.h + 6, GL.w + 16, 1, '#a48870');
  // curtains (gathered, with folds)
  const curtain = (x0, w, dir) => {
    for (let y = 8; y < 92; y++) {
      // pinch at tie-back y=58
      const pinch = y < 58 ? 1 - 0.55 * Math.pow((y - 8) / 50, 2) : 0.45 + 0.55 * Math.min(1, (y - 58) / 22);
      const ww = Math.max(3, Math.round(w * pinch));
      for (let i = 0; i < ww; i++) {
        const x = dir > 0 ? x0 + i : x0 - i;
        const fold = (i + Math.floor(y / 30)) % 4;
        B.set(x, y, fold === 0 ? '#8a4a6a' : fold === 1 ? '#c07090' : '#a85a7c');
      }
      const x = dir > 0 ? x0 + ww : x0 - ww;
      B.set(x, y, '#6a3450');
    }
    // tie-back
    const tx = dir > 0 ? x0 : x0 - 7;
    B.rect(tx, 57, 8, 2, '#e8c070');
  };
  curtain(4, 15, 1); curtain(87, 15, -1);

  // fairy-light wire
  const garland = [];
  const sag = (xa, xb, ya, s) => { for (let x = xa; x <= xb; x++) { const u = (x - xa) / (xb - xa); garland.push([x, Math.round(ya + s * 4 * u * (1 - u))]); } };
  sag(96, 150, 5, 10); sag(150, 206, 5, 9);
  garland.forEach(([x, y]) => B.set(x, y, '#4a3a3a'));
  B.rect(95, 4, 2, 2, '#6b412c'); B.rect(149, 4, 2, 2, '#6b412c'); B.rect(205, 4, 2, 2, '#6b412c');

  // bookshelf
  const BS = { x: 200, y: 26, w: 46, h: 78 };
  B.rect(BS.x, BS.y, BS.w, BS.h, '#6b412c');
  B.rect(BS.x + 3, BS.y + 3, BS.w - 6, BS.h - 6, '#4a2c20');
  B.rect(BS.x - 1, BS.y - 2, BS.w + 2, 3, '#8a5a3c');
  const shelves = [BS.y + 26, BS.y + 50];
  shelves.forEach(sy => { B.rect(BS.x + 3, sy, BS.w - 6, 3, '#8a5a3c'); B.rect(BS.x + 3, sy + 3, BS.w - 6, 1, '#3a2018'); });
  const bookCols = ['#c85a5a', '#5a8ac8', '#e8c060', '#6aa870', '#9a6ab0', '#e89060', '#d8d0c0', '#4a7a8a'];
  const R = C.rng(66);
  [BS.y + 3, BS.y + 29, BS.y + 53].forEach((top, si) => {
    const bot = si === 0 ? shelves[0] : si === 1 ? shelves[1] : BS.y + BS.h - 3;
    let x = BS.x + 4;
    while (x < BS.x + BS.w - 6) {
      const bw = 2 + Math.floor(R() * 3), bh = bot - top - 3 - Math.floor(R() * 7);
      const col = bookCols[Math.floor(R() * bookCols.length)];
      if (si === 1 && x > BS.x + 26 && x < BS.x + 34) { // a leaning book + a little frame
        B.poly([[x, bot], [x + 3, bot], [x + 9, bot - bh + 3], [x + 6, bot - bh + 2]], '#5a8ac8');
        x += 11; continue;
      }
      B.rect(x, bot - bh, bw, bh, col);
      B.rect(x, bot - bh + 2, bw, 1, mix(col, '#ffffff', 0.35));
      B.rect(x + bw - 1, bot - bh, 1, bh, mix(col, '#000000', 0.25));
      x += bw + (R() < 0.15 ? 1 : 0);
    }
  });
  // plant on top of shelf
  B.rect(BS.x + 6, BS.y - 8, 9, 6, '#c0705a'); B.rect(BS.x + 5, BS.y - 9, 11, 2, '#d8866a');
  [[-3, -14], [0, -18], [3, -15], [6, -13], [-1, -12], [4, -11]].forEach(([dx, dy], i) => B.line(BS.x + 10, BS.y - 9, BS.x + 10 + dx, BS.y + dy, i % 2 ? '#5fae5a' : '#3f7d4a'));
  B.ellipse(BS.x + 7, BS.y - 17, 2, 1.5, '#5fae5a'); B.ellipse(BS.x + 14, BS.y - 16, 2, 1.5, '#3f7d4a'); B.ellipse(BS.x + 10, BS.y - 20, 1.6, 2, '#5fae5a');
  // small framed photo on top
  B.rect(BS.x + 28, BS.y - 12, 11, 10, '#e8c070'); B.rect(BS.x + 30, BS.y - 10, 7, 6, '#8fd3ff'); B.ellipse(BS.x + 33.5, BS.y - 6.5, 2.4, 1.6, '#f2a14a');

  // floor lamp
  B.ellipse(LAMP.x + 0.5, LAMP.base, 8, 2.4, '#3a2c2c'); B.rect(LAMP.x - 6, LAMP.base - 1, 13, 1, '#6a5656');
  B.rect(LAMP.x, LAMP.bot, 2, LAMP.base - LAMP.bot - 1, '#5a4646'); B.rect(LAMP.x, LAMP.bot, 1, LAMP.base - LAMP.bot - 1, '#8a7070');
  B.poly([[LAMP.x - 7, LAMP.top], [LAMP.x + 9, LAMP.top], [LAMP.x + 16, LAMP.bot], [LAMP.x - 14, LAMP.bot]], '#e0b070');
  B.rect(LAMP.x - 7, LAMP.top - 1, 16, 1, '#8a6040'); B.rect(LAMP.x - 14, LAMP.bot, 30, 1, '#8a6040');

  // rug (braided oval)
  const RUG = { x: 130, y: 128, rx: 62, ry: 11 };
  B.ellipse(RUG.x, RUG.y, RUG.rx, RUG.ry, (x, y) => {
    const d = Math.hypot((x + 0.5 - RUG.x) / RUG.rx, (y + 0.5 - RUG.y) / RUG.ry);
    const ring = Math.floor(d * 5);
    return ['#c8687a', '#e8c890', '#7a8ac0', '#e8c890', '#b05a6a'][ring] || '#b05a6a';
  });
  // side stool + mug
  B.ellipse(94, 104, 10, 2.5, '#b07a4f'); B.rect(84, 104, 21, 3, '#8a5a3c'); B.ellipse(94, 104, 10, 2.5, '#c8905c');
  B.rect(86, 107, 2, 15, '#6b412c'); B.rect(101, 107, 2, 15, '#6b412c'); B.rect(93, 107, 2, 17, '#6b412c');
  B.rect(90, 97, 7, 7, '#f0f0f8'); B.rect(90, 97, 7, 1, '#ffffff'); B.rect(96, 97, 1, 7, '#c8c8d8');
  B.rect(97, 99, 2, 1, '#f0f0f8'); B.rect(98, 99, 1, 3, '#f0f0f8'); B.rect(97, 102, 2, 1, '#f0f0f8');
  B.rect(91, 100, 5, 2, '#e27a8a'); // heart band
  B.rect(90, 97, 6, 1, '#6b3a2a'); // cocoa surface

  // cushion (round floor cushion)
  const cushion = (cv, front) => {
    const { x, y } = CUSH;
    if (!front) {
      cv.ellipse(x, y + 3, 23, 7, '#a8502e');
      cv.ellipse(x, y, 22, 6, (px, py) => (py < y - 3 ? '#f09a58' : '#e0783e'));
      cv.set(x, y, '#8a3a24'); cv.set(x - 1, y, '#8a3a24');
      // tassels
      cv.rect(x - 24, y + 1, 2, 2, '#e8c070'); cv.rect(x + 22, y + 1, 2, 2, '#e8c070');
    } else {
      // front lip drawn over the cat's belly
      cv.ellipse(x, y + 3, 23, 7, (px, py) => (py >= y + 4 ? (py > y + 6 ? '#a8502e' : '#e0783e') : null));
      cv.ellipse(x, y + 3, 23, 7, (px, py) => (py === y + 4 ? '#f09a58' : null));
    }
  };
  cushion(B, false);
  // outline ink for key furniture silhouettes (unlit)
  const Fr = new Canvas(W, H); cushion(Fr, true);

  // ---------------- emissive canvases ----------------
  const skyStops = mode => mode === 'warm'
    ? [[GL.y, '#1b1733'], [GL.y + 30, '#2a2550'], [GL.y + GL.h, '#3d3a78']]
    : [[GL.y, '#141230'], [GL.y + 30, '#232250'], [GL.y + GL.h, '#36407a']];
  const E = mode => {
    const e = new Canvas(W, H);
    const st = skyStops(mode);
    for (let y = GL.y; y < GL.y + GL.h; y++) {
      let i = 0; while (i < st.length - 2 && y >= st[i + 1][0]) i++;
      const u = C.clamp((y - st[i][0]) / (st[i + 1][0] - st[i][0]));
      for (let x = GL.x; x < GL.x + GL.w; x++) e.set(x, y, C.dith(st[i][1], st[i + 1][1], Math.round(u * 16))(x, y));
    }
    // moon halo + moon
    e.circle(MOON.x, MOON.y, MOON.r + 5, C.dith(null, mode === 'warm' ? '#4a4888' : '#56609c', 5));
    e.circle(MOON.x, MOON.y, MOON.r + 2.5, mode === 'warm' ? '#4a4888' : '#56609c');
    e.circle(MOON.x, MOON.y, MOON.r, (x, y) => (Math.hypot(x + .5 - MOON.x - 3, y + .5 - MOON.y + 2) > MOON.r + 1 ? '#f2dc9a' : '#fff4cc'));
    [[-3, -2, 2], [2, 3, 1.6], [-1, 4, 1], [4, -3, 1]].forEach(([dx, dy, rr]) => e.circle(MOON.x + dx, MOON.y + dy, rr, '#ead08c'));
    // distant town silhouette at the bottom of the window
    const town = [[0, 8], [7, 11], [13, 6], [20, 10], [27, 7], [34, 12], [40, 8], [47, 10], [55, 10]];
    for (let i = 0; i < town.length - 1; i++) {
      const [xa, ha] = town[i], [xb] = town[i + 1];
      for (let x = xa; x < xb; x++) for (let y = GL.y + GL.h - ha; y < GL.y + GL.h; y++) e.set(GL.x + x, y, '#15112a');
      e.set(GL.x + xa + 1, GL.y + GL.h - ha - 1, '#15112a');
    }
    const lit = mode === 'warm' ? [[3, 5], [15, 3], [23, 6], [36, 5], [44, 4], [50, 6]] : [[15, 3], [44, 4]];
    lit.forEach(([x, dy]) => e.rect(GL.x + x, GL.y + GL.h - dy, 1, 1, '#ffcf7a'));
    // dim stars
    starList.forEach(([x, y]) => e.set(x, y, mode === 'warm' ? '#8a86c0' : '#b0b4e8'));
    if (mode === 'moon') starList2.forEach(([x, y]) => e.set(x, y, '#8a90cc'));
    // mullions (drawn over sky)
    e.rect(GL.x + 26, GL.y, 3, GL.h, null);
    if (mode === 'warm') {
      // glowing lamp shade
      e.poly([[LAMP.x - 6, LAMP.top], [LAMP.x + 8, LAMP.top], [LAMP.x + 15, LAMP.bot], [LAMP.x - 13, LAMP.bot]],
        (x, y) => C.dith('#ffcf7a', '#ffe9b8', Math.round((y - LAMP.top) / (LAMP.bot - LAMP.top) * 16))(x, y));
      e.rect(LAMP.x - 13, LAMP.bot, 29, 1, '#fff6d8');
      e.rect(LAMP.x - 3, LAMP.bot + 1, 8, 1, '#fff6d8');
    }
    return e;
  };
  // stars
  const starList = [], starList2 = [];
  {
    const r = C.rng(606);
    const ok = (x, y) => !(Math.hypot(x - MOON.x, y - MOON.y) < MOON.r + 4) && !(x >= GL.x + 26 && x <= GL.x + 28) && !(y >= GL.y + 26 && y <= GL.y + 28) && y < GL.y + GL.h - 13;
    while (starList.length < 22) { const x = GL.x + 1 + Math.floor(r() * (GL.w - 2)), y = GL.y + 1 + Math.floor(r() * (GL.h - 14)); if (ok(x, y)) starList.push([x, y]); }
    while (starList2.length < 14) { const x = GL.x + 1 + Math.floor(r() * (GL.w - 2)), y = GL.y + 1 + Math.floor(r() * (GL.h - 14)); if (ok(x, y)) starList2.push([x, y]); }
  }
  // mullions go into B (material) but must sit over the sky: draw as B & clear E there
  const mull = cv => { cv.rect(GL.x + 26, GL.y, 3, GL.h, '#f0e2c8'); cv.rect(GL.x, GL.y + 26, GL.w, 3, '#f0e2c8'); };
  mull(B);
  const clearMull = e => { for (let y = GL.y; y < GL.y + GL.h; y++) for (let x = GL.x; x < GL.x + GL.w; x++) if ((x >= GL.x + 26 && x <= GL.x + 28) || (y >= GL.y + 26 && y <= GL.y + 28)) e.px[y * W + x] = null; return e; };
  const Ew = clearMull(E('warm')), Em = clearMull(E('moon'));

  const bgWarm = toSVG(render(B, Ew, 'warm', lampLight));
  const bgMoon = toSVG(render(B, Em, 'moon', moonLight));
  const frWarm = toSVG(render(Fr, null, 'warm', lampLight));
  const frMoon = toSVG(render(Fr, null, 'moon', moonLight));

  const LOFF = 55.6; // lamp clicks off
  const out = [];
  out.push(`<g>${bgWarm}${C.steps('opacity', [[0, 1], [LOFF, 0]])}</g>`);
  out.push(`<g opacity="0">${bgMoon}${C.show(LOFF, 60)}</g>`);

  // ---------------- twinkling stars ----------------
  const tw = (x, y, col, glow) => `<path fill="${glow}" d="M${x - 1} ${y}h3v1h-3zM${x} ${y - 1}h1v3h-1z"/><path fill="${col}" d="M${x} ${y}h1v1h-1z"/>`;
  let stars = '';
  starList.forEach(([x, y], i) => {
    if (i % 2) return;
    const n = 3 + (i % 3), per = [1.3, 1.9, 2.6, 3.1, 1.6][i % 5];
    stars += `<g opacity="0">${tw(x, y, '#ffffff', '#b8b4f0')}${C.loopFrame(i % n, n, per)}</g>`;
  });
  out.push(`<g>${stars}</g>`);
  let stars2 = '';
  starList2.forEach(([x, y], i) => {
    const n = 3 + (i % 2), per = [1.1, 1.7, 2.3, 2.9][i % 4];
    stars2 += `<g opacity="0">${tw(x, y, '#ffffff', '#c8d0ff')}${C.loopFrame(i % n, n, per)}</g>`;
  });
  starList.forEach(([x, y], i) => { if (i % 4 === 1) stars2 += `<g opacity="0">${tw(x, y, '#ffffff', '#c8d0ff')}${C.loopFrame(i % 3, 3, 1.5 + (i % 4) * 0.4)}</g>`; });
  out.push(`<g opacity="0">${C.show(LOFF + 0.25, 60)}${stars2}</g>`);

  // ---------------- shooting star 54.8 ----------------
  {
    const pane = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    C.def(`<clipPath id="${P}glass">${pane(GL.x, GL.y, 26, 26)}${pane(GL.x + 29, GL.y, GL.w - 29, 26)}${pane(GL.x, GL.y + 29, 26, GL.h - 42)}${pane(GL.x + 29, GL.y + 29, GL.w - 29, GL.h - 42)}</clipPath>`);
    const SS = 54.8, n = 9, fr = 0.05, TR = 14;
    const cols = ['#ffffff', '#ffffff', '#fff6c8', '#fff1a8', '#ffe08a', '#d8c8f0', '#b0a8e8', '#8a86c8'];
    let g = '';
    for (let i = 0; i < n + 4; i++) {
      const hx = GL.x + GL.w + 6 - i * 7, hy = GL.y + 1 + i * 4;
      const by = {};
      for (let k = 0; k < TR; k++) {
        if (i >= n && k < (i - n + 1) * 4) continue; // head gone, tail fading out
        if (k > i * 7) continue;
        const x = Math.round(hx + k * 1.75), y = Math.round(hy - k);
        const c = cols[Math.min(cols.length - 1, Math.floor(k / 2))];
        (by[c] = by[c] || []).push(`M${x} ${y}h2v1h-2z`);
      }
      if (i < n) (by['#ffffff'] = by['#ffffff'] || []).push(`M${hx} ${hy - 1}h1v3h-1zM${hx - 1} ${hy}h3v1h-3z`);
      g += `<g opacity="0">${Object.entries(by).map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('')}${C.show(SS + i * fr, SS + (i + 1) * fr)}</g>`;
    }
    out.push(`<g clip-path="url(#${P}glass)">${g}</g>`);
  }

  // ---------------- fairy lights ----------------
  {
    const cols = ['#ff8fa3', '#ffd36a', '#8fe0c0', '#9ac0ff'];
    let g = '';
    garland.forEach(([x, y], i) => {
      if ((x - 96) % 7 !== 3) return;
      const k = Math.floor((x - 96) / 7), c = cols[k % 4];
      const dim = mix(c, '#3a2c3a', 0.45);
      g += `<path fill="#4a3a3a" d="M${x} ${y + 1}h2v1h-2z"/><path fill="${dim}" d="M${x} ${y + 2}h2v2h-2z"/>`;
      const n = 2 + (k % 3), per = [1.4, 2.0, 2.7, 1.7, 2.3][k % 5];
      g += `<g opacity="0"><path fill="${mix(c, '#ffffff', 0.1)}" d="M${x} ${y + 2}h2v2h-2z"/><path fill="${mix(c, '#e2cfb2', 0.55)}" d="M${x - 1} ${y + 2}h1v2h-1zM${x + 2} ${y + 2}h1v2h-1zM${x} ${y + 4}h2v1h-2z"/>${C.loopFrame(k % n, n, per)}</g>`;
    });
    out.push(`<g>${g}</g>`);
  }

  // ---------------- mug steam ----------------
  {
    const frames = [
      [[92, 94], [93, 92], [93, 91], [92, 89]],
      [[93, 95], [92, 93], [92, 91], [93, 90], [93, 88]],
      [[92, 95], [93, 93], [94, 92], [93, 90], [92, 87]],
    ];
    const g = col => frames.map((f, i) => `<g opacity="${i ? 0 : 1}"><path fill="${col}" d="${f.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')}"/>${C.loopFrame(i, 3, 1.2)}</g>`).join('');
    out.push(`<g opacity="0">${C.show(0, LOFF)}${g('#fff0d8')}</g>`);
    out.push(`<g opacity="0">${C.show(LOFF, 60)}${g('#8a96c8')}</g>`);
  }

  // ---------------- lamp pull chain (swings after the click) ----------------
  {
    const chain = (dx, col, bead) => {
      const x0 = LAMP.x + 10, y0 = LAMP.bot + 1;
      let d = ''; for (let j = 0; j < 9; j++) d += `M${x0 + Math.round(dx * j / 8)} ${y0 + j}h1v1h-1z`;
      return `<path fill="${col}" d="${d}"/><path fill="${bead}" d="M${x0 + dx - 1} ${y0 + 9}h3v2h-3z"/>`;
    };
    const sw = [[0, 0], [LOFF - 0.12, 2], [LOFF, 3], [LOFF + 0.1, -2], [LOFF + 0.22, 2], [LOFF + 0.34, -1], [LOFF + 0.46, 1], [LOFF + 0.6, 0]];
    sw.forEach(([ta, dx], i) => {
      const tb = i < sw.length - 1 ? sw[i + 1][0] : 60;
      const warm = ta < LOFF;
      out.push(`<g opacity="0">${C.show(ta, tb)}${chain(dx, warm ? '#8a6a50' : '#4a4a78', warm ? '#e8c070' : '#6a70a8')}</g>`);
    });
  }

  // ---------------- MIKAN ----------------
  const cid = (name, p, moon) => {
    const id = P + name + (moon ? '_m' : '');
    if (!C.size(id)) {
      const cv = cat.drawCat(p);
      if (moon) cv.px = cv.px.map(c => (c ? (c === K ? '#161430' : mul(c, '#8496d0')) : c));
      C.spriteRaw(id, cv.toSVG(), 36, 28);
    }
    return id;
  };
  const walkIds = [0, 1, 2, 3].map(s => cid('walk' + s, { pose: 'walk', step: s, eyes: 'half', tail: 115 + (s % 2) * 8 }));
  const knead = [0, 1].map(s => cid('knead' + s, { pose: 'walk', step: s ? 1 : 3, eyes: 'happy', tail: 100, headDY: 1 }));
  const sitIds = { half: cid('sit_h', { pose: 'sit', eyes: 'half', tail: 10 }), yawn: cid('sit_y', { pose: 'sit', eyes: 'closed', mouth: 'yawn', tail: 20, headDY: -1 }) };
  const crouch = cid('crouch', { pose: 'crouch', eyes: 'open', step: 0, tail: 100 });
  const leap = cid('leap', { pose: 'leap', eyes: 'open', tail: 20 });
  const loaf = cid('loaf', { pose: 'loaf', eyes: 'half' });
  const sleepW = [0, 1].map(b => cid('sleep' + b, { pose: 'sleep', eyes: 'closed', breath: b }));
  const sleepM = [0, 1].map(b => cid('sleep' + b, { pose: 'sleep', eyes: 'closed', breath: b }, true));
  const stirM = cid('stir', { pose: 'sleep', eyes: 'half', breath: 1, headDY: -1 }, true);

  // timings
  const T_WALK = 50.0, T_CROUCH = 51.35, T_HOP = 51.5, T_LAND = 51.72, T_TURN = 52.0, T_LOAF = 52.25, T_SLEEP = 52.5;
  const X0 = 214, X1 = 150; // body-centre x on the floor
  const catPose = t => {
    if (t < 49.55) return sitIds.half;
    if (t < 49.95) return sitIds.yawn;
    if (t < T_WALK) return sitIds.half;
    if (t < T_CROUCH) return walkIds[Math.floor((t - T_WALK) * 8) % 4];
    if (t < T_HOP) return crouch;
    if (t < T_LAND) return leap;
    if (t < T_LOAF) return knead[Math.floor((t - T_LAND) * 7) % 2];
    if (t < T_SLEEP) return loaf;
    const b = Math.floor((t - T_SLEEP) / 1.0) % 2;
    if (t >= LOFF + 0.05 && t < LOFF + 0.35) return stirM;
    return t < LOFF ? sleepW[b] : sleepM[b];
  };
  const catFlip = t => t < T_TURN;
  const catPos = t => {
    const f = catFlip(t);
    const off = f ? 21 : 15; // body centre inside sprite
    let cx, fy;
    if (t < T_WALK) { cx = X0; fy = 128; }
    else if (t < T_CROUCH) { cx = C.lerp(X0, X1, (t - T_WALK) / (T_CROUCH - T_WALK)); fy = 128; }
    else if (t < T_HOP) { cx = X1; fy = 128; }
    else if (t < T_LAND) { const u = (t - T_HOP) / (T_LAND - T_HOP); cx = C.lerp(X1, CUSH.x, u); fy = C.lerp(128, 117, u) + C.hop(u, 8); }
    else { cx = CUSH.x; fy = 117; }
    return [Math.round(cx - off), Math.round(fy - 27)];
  };
  out.push(C.act({ t0: 49, t1: 60, fps: 20, pose: catPose, pos: catPos, flip: catFlip }));

  // cushion front lip over the cat (only when the cat is on it)
  out.push(`<g opacity="0">${C.show(T_LAND, LOFF)}${frWarm}</g>`);
  out.push(`<g opacity="0">${C.show(LOFF, 60)}${frMoon}</g>`);

  // zzz
  {
    let g = '';
    [[52.8, 138, 104], [53.15, 142, 100]].forEach(([ts, x, y]) => {
      for (let i = 0; i < 4; i++) g += `<g opacity="0">${C.show(ts + i * 0.12, ts + (i + 1) * 0.12)}${C.text('z', x + i, y - i * 2, '#fff3e0')}</g>`;
    });
    out.push(g);
  }

  // ---------------- DREAM BUBBLE ----------------
  out.push(require('./s6_dream')({ C, cat, P, cid, mul, mix, K }));

  // "eyes adjusting" darkness right after the click
  out.push(`<rect width="${W}" height="${H}" fill="#07061a" opacity="0">${C.steps('opacity', [[0, 0], [LOFF, 0.55], [LOFF + 0.15, 0.4], [LOFF + 0.3, 0.25], [LOFF + 0.45, 0.12], [LOFF + 0.6, 0]])}</rect>`);
  return out.join('\n');
};
