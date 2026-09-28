// S3 WINDOW, midday (global 19..29). Mikan on the window sill watching the outside world.
// Cues: 21.0 sparrow lands · 22.0-23.5 chatter · 24.0 & 24.4 paw taps glass · 24.8 bird flies off ·
//       25.5 butterfly drifts by · 26.5-28.5 loaf in the sunbeam and doze off.
'use strict';

module.exports = ({ t0, t1, C, cat }) => {
  const { Canvas } = C;
  const W = 256, H = 144;
  const K = '#2b1d2e';
  const out = [];
  // vertical-run rasteriser (much smaller for vertical stripes / folds); svg() picks the shorter encoding
  const toSVGv = cv => {
    const by = {};
    for (let x = 0; x < cv.w; x++) {
      let y = 0;
      while (y < cv.h) {
        const c = cv.px[y * cv.w + x];
        if (!c) { y++; continue; }
        let n = 1; while (y + n < cv.h && cv.px[(y + n) * cv.w + x] === c) n++;
        (by[c] = by[c] || []).push(`M${x} ${y}v${n}h1v-${n}z`);
        y += n;
      }
    }
    return Object.entries(by).map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
  };
  // greedy rectangle merge (per colour)
  const toSVGr = cv => {
    const { w, h, px } = cv, used = new Uint8Array(w * h), by = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, c = px[i];
      if (!c || used[i]) continue;
      let n = 1; while (x + n < w && px[i + n] === c && !used[i + n]) n++;
      let m = 1;
      for (;;) {
        if (y + m >= h) break;
        let ok = true;
        for (let k = 0; k < n; k++) { const j = (y + m) * w + x + k; if (px[j] !== c || used[j]) { ok = false; break; } }
        if (!ok) break; m++;
      }
      for (let jy = 0; jy < m; jy++) for (let k = 0; k < n; k++) used[(y + jy) * w + x + k] = 1;
      (by[c] = by[c] || []).push(`M${x} ${y}h${n}v${m}h-${n}z`);
    }
    return Object.entries(by).map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
  };
  const svg = cv => [cv.toSVG(), toSVGv(cv), toSVGr(cv)].reduce((a, b) => (b.length < a.length ? b : a));
  const full = (id, cv) => C.spriteRaw(id, svg(cv), W, H);
  const at = (a, b, m) => `<g opacity="0">${C.show(a, b)}${m}</g>`; // visible in [a,b)

  // ---------- geometry ----------
  const GX0 = 33, GX1 = 223, GY0 = 9, GY1 = 104;         // glass area
  const MUL = [[76, 80], [176, 180]];                     // mullions [x0,x1)
  const SILL_Y = 104, SILL_F = 113, SILL_B = 119;          // sill top / front / bottom
  const CX = 98, CY = 82;                                 // cat sprite top-left (feet at y 109)

  C.def(`<clipPath id="s3_clip"><rect x="${GX0}" y="${GY0}" width="${GX1 - GX0}" height="${GY1 - GY0}"/></clipPath>`);

  // =====================================================================
  // OUTSIDE
  // =====================================================================
  let outside = C.ditherGradient(GX0, GY0, GX1 - GX0, GY1 - GY0,
    [[GY0, '#4a98e2'], [34, '#62b2f0'], [62, '#8fd3ff'], [84, '#c4ecff'], [GY1, '#e4f7ff']]);

  // ---- clouds (3 parallax layers) ----
  function cloudCv(w, h, seed, cTop, cMid, cBot) {
    const cv = new Canvas(w + 2, h + 2), R = C.rng(seed);
    const n = Math.max(3, Math.round(w / 7));
    for (let i = 0; i < n; i++) {
      const u = (i + .5) / n, cx = 1 + u * w, rr = (h * .55) * (0.55 + 0.45 * Math.sin(u * Math.PI)) + R() * 1.5;
      cv.circle(cx, h + 1 - rr * .9, rr, (x, y) => (y > h - 1 ? cBot : y > h - 3 - (x % 5 === 0 ? 1 : 0) ? cMid : cTop));
    }
    cv.rect(2, h - 1, w - 2, 2, (x, y) => (y > h - 1 ? cBot : cMid));
    return cv;
  }
  const clouds = [
    // [w,h,seed,x0,y,speed(px/s),fps, colors]
    [18, 5, 3, 40, 16, 1.2, 2, ['#e4f4ff', '#cfe8fb', '#bcdcf5']],
    [24, 6, 7, 120, 12, 1.2, 2, ['#e4f4ff', '#cfe8fb', '#bcdcf5']],
    [16, 4, 9, 190, 22, 1.2, 2, ['#e4f4ff', '#cfe8fb', '#bcdcf5']],
    [34, 9, 11, 70, 28, 2.6, 3, ['#ffffff', '#e8f4ff', '#c9e2f6']],
    [30, 8, 5, 170, 36, 2.6, 3, ['#ffffff', '#e8f4ff', '#c9e2f6']],
    [52, 13, 21, 10, 44, 4.5, 4, ['#ffffff', '#f0f8ff', '#d2e6f5']],
    [44, 12, 17, 150, 50, 4.5, 4, ['#ffffff', '#f0f8ff', '#d2e6f5']],
  ];
  clouds.forEach(([w, h, seed, x0, y, v, fps, cols], i) => {
    const cv = cloudCv(w, h, seed, ...cols);
    const id = C.spriteRaw(`s3_cl${i}`, cv.toSVG(), w + 2, h + 2);
    outside += `<g>${C.move(t0, t1, fps, t => [x0 + v * (t - t0), y])}${C.use(id)}</g>`;
  });

  // ---- plane with contrail ----
  {
    const cv = new Canvas(34, 5);
    for (let i = 0; i < 26; i++) if (C.bayer(i, 1) < 16 - i * 0.6) { cv.set(i, 2, '#ffffff'); }
    for (let i = 4; i < 26; i += 3) cv.set(i, 1, '#eef8ff');
    cv.art(`
      ......k.
      .kkkkkkk
      ..kkk...`, { k: '#e8eef6' }, 26, 1);
    cv.set(33, 2, '#ffffff'); cv.set(32, 1, '#9fb0c8');
    const id = C.spriteRaw('s3_plane', cv.toSVG(), 34, 5);
    outside += `<g>${C.move(t0, t1, 6, t => [10 + 20 * (t - t0), 17 - (t - t0) * .4])}${C.use(id)}</g>`;
  }

  outside += '<g transform="translate(0 8)">'; // landscape sits lower in the taller window
  // ---- distant hills + town ----
  {
    const cv = new Canvas(W, H);
    for (let x = GX0; x < GX1; x++) {
      const yf = Math.round(66 + 4 * Math.sin(x / 23) + 2 * Math.sin(x / 9 + 1));
      cv.rect(x, yf, 1, GY1 - yf, (xx, yy) => (C.bayer(xx, yy) < 4 && yy < yf + 2 ? '#c4e2ee' : '#a9d0e2'));
      const yn = Math.round(74 + 3 * Math.sin(x / 17 + 2) + 1.5 * Math.sin(x / 6));
      cv.rect(x, yn, 1, GY1 - yn, (xx, yy) => (yy < yn + 1 ? '#a8d4bc' : C.bayer(xx, yy) < 6 ? '#8fc4ab' : '#86bba2'));
    }
    // distant tower
    cv.rect(160, 60, 1, 16, '#9ab4c8'); cv.rect(158, 64, 5, 1, '#9ab4c8'); cv.rect(159, 60, 3, 1, '#e87a6a');
    // town rows
    const R = C.rng(42);
    const rows = [[84, 0.55, ['#c9d9e4', '#bccfdd'], ['#8aa0bc', '#b58f98', '#7ea8aa']],
                  [90, 1, ['#e6eef2', '#d2dde6'], ['#6f85a8', '#b0737c', '#5f9a96', '#c48a5c']]];
    for (const [base, sc, walls, roofs] of rows) {
      let x = GX0 - 4;
      while (x < GX1) {
        const w = Math.round((6 + R() * 7) * (0.7 + sc * .3)), h = Math.round((3 + R() * 4) * (0.7 + sc * .5));
        const wc = walls[Math.floor(R() * walls.length)], rc = roofs[Math.floor(R() * roofs.length)];
        const top = base - h;
        cv.rect(x, top, w, h + 8, wc);
        cv.rect(x - 1, top - 1, w + 2, 2, rc); cv.rect(x + 1, top - 2, w - 2, 1, rc);
        if (sc > .9) for (let wx = x + 2; wx < x + w - 1; wx += 3) cv.set(wx, top + 2, '#8fa6bc');
        x += w + (R() < .3 ? 2 : 0);
      }
    }
    // near hedge / trees along bottom of the view
    for (let x = GX0; x < GX1; x++) {
      const yh = Math.round(91 + 1.5 * Math.sin(x / 4) + Math.sin(x / 11));
      cv.rect(x, yh, 1, GY1 - yh, (xx, yy) => (yy === yh ? '#7cc36a' : C.bayer(xx, yy) < 7 ? '#4f9a52' : '#5fae5a'));
    }
    outside += C.use(full('s3_town', cv));
  }

  // ---- neighbour house (left pane) with laundry balcony ----
  {
    const cv = new Canvas(W, H);
    const hx0 = GX0, hx1 = 96;
    cv.rect(hx0, 40, hx1 - hx0, GY1 - 40, (x, y) => (x > hx1 - 4 ? '#d6c9b2' : C.bayer(x, y) < 2 ? '#e4d8c2' : '#efe5d3'));
    // sliding glass door behind the laundry
    cv.rect(38, 47, 50, 26, (x, y) => (y < 49 ? '#6f7f98' : (x + y) % 17 < 3 ? '#c8dbea' : '#9fb6cc'));
    cv.rect(62, 47, 1, 26, '#6f7f98');
    // eaves / roof
    cv.rect(hx0, 36, hx1 - hx0 + 3, 5, (x, y) => (y === 36 ? '#7888a6' : y === 40 ? '#3e4660' : (x % 4 === 0 ? '#48526e' : '#56607e')));
    cv.rect(hx0, 41, hx1 - hx0, 1, '#b9ac96');
    // balcony railing
    cv.rect(hx0, 72, hx1 - hx0, 2, '#8c96a8'); cv.rect(hx0, 74, hx1 - hx0, 1, '#6f788c');
    for (let x = hx0 + 1; x < hx1; x += 3) cv.rect(x, 75, 1, 9, '#8c96a8');
    cv.rect(hx0, 84, hx1 - hx0, 2, '#8c96a8');
    cv.rect(hx0, 86, hx1 - hx0, GY1 - 86, (x, y) => (C.bayer(x, y) < 3 ? '#d8ccb6' : '#e7dcc8'));
    // laundry poles
    cv.rect(35, 48, 1, 24, '#9aa2b0'); cv.rect(93, 48, 1, 24, '#9aa2b0');
    outside += C.use(full('s3_house', cv));

    // laundry frames (fluttering to the right)
    const items = [
      // [x, w, h, colA, colB, kind]
      [38, 10, 10, '#ffffff', '#dfe6f0', 'shirt'],
      [51, 6, 11, '#f7a8a0', '#e0877f', 'towel'],
      [60, 2, 4, '#fff3a0', '#e0cf70', 'sock'],
      [64, 2, 4, '#fff3a0', '#e0cf70', 'sock'],
      [70, 7, 9, '#8fd3ff', '#5fb0ee', 'stripe'],
      [83, 7, 10, '#ffffff', '#d7dfe8', 'towel'],
    ];
    const lineY = 50;
    const ids = [0, 1, 2, 3].map(f => {
      const L = new Canvas(W, H);
      L.line(35, lineY, 93, lineY, '#6b6f80');
      items.forEach(([x, w, h, a, b, kind], i) => {
        const ph = f + i;
        for (let j = 0; j < h; j++) {
          const u = j / (h - 1);
          const off = Math.round([0, 1, 2, 1][ph % 4] * u * (kind === 'sock' ? 1 : 1.3));
          let x0 = x + off, ww = w;
          if (kind === 'shirt') { if (j < 3) { x0 -= 1; ww += 2; } else { x0 += 1; ww -= 2; } }
          const rip = ((j + ph) % 3 === 0 && j === h - 1) ? 1 : 0;
          for (let k = 0; k < ww - rip; k++) {
            let c = (k === ww - 1 || j === h - 1) ? b : a;
            if (kind === 'stripe' && j % 3 === 1) c = '#ffffff';
            if (kind === 'shirt' && j === 0 && (k === 4 || k === 5)) c = b;
            L.set(x0 + k, lineY + 1 + j, c);
          }
        }
        L.set(x + 1, lineY, '#e2607a'); if (w > 3) L.set(x + w - 2, lineY, '#e2607a');
      });
      return full(`s3_ldr${f}`, L);
    });
    const lf = t => ids[Math.floor(t * (t > 21.8 && t < 24 ? 6 : 4)) % 4];
    outside += C.act({ t0, t1, fps: 12, pose: lf });
  }

  // ---- tree canopy + branch (bends with the wind and the sparrow's weight) ----
  const BX0 = 238, BY0 = 34, BTX = 134, BTY = 70;
  const branchU = x => C.clamp((BX0 - x) / (BX0 - BTX));
  const branchY = (x, b) => { const u = branchU(x); return BY0 + (BTY - BY0) * Math.pow(u, 1.25) + b * u * u; };
  const LEAF = ['#3f7d4a', '#5fae5a', '#8fd07a'];
  function leaf(cv, x, y, dir) { // small almond leaf pointing along dir (+1 right, -1 left)
    x = Math.round(x); y = Math.round(y);
    const L = dir > 0 ? ['.hhm.', 'hmmmd', '.ddd.'] : ['.mhh.', 'dmmmh', '.ddd.'];
    cv.art(L, { h: LEAF[2], m: LEAF[1], d: LEAF[0] }, x - 2, y - 1);
  }
  const cluster = (cv, x, y, dir, f) => {
    leaf(cv, x + dir * 3, y - 1 + (f % 2), dir); leaf(cv, x, y + 2, -dir); leaf(cv, x + dir, y - 3, dir);
  };
  // canopy (2 sway frames) - separate from the branch so it is cheap
  const canopy = [0, 1].map(f => {
    const cv = new Canvas(W, H);
    const clumps = [[200, 8, 15, 8], [220, 4, 14, 9], [184, 3, 10, 5], [214, 18, 10, 6], [232, 22, 10, 8]];
    clumps.forEach(([x, y, rx, ry], i) => {
      const dx = (f + i) % 2;
      cv.ellipse(x + dx, y, rx, ry, (xx, yy) => {
        const d = yy - y;
        if (d > ry * .5) return (C.bayer(xx, yy) < 6) ? '#2f6a40' : LEAF[0];
        if (d < -ry * .45) return LEAF[2];
        return d > ry * .15 && C.bayer(xx, yy) < 8 ? LEAF[0] : LEAF[1];
      });
    });
    // leafy fringe along the bottom edge
    for (let x = 172; x < 244; x += 5) {
      const yb = 10 + Math.round(8 * Math.max(0, (x - 172) / 72)) + ((x / 5 + f) % 3);
      leaf(cv, x + (f && x % 2 ? 1 : 0), yb + 3, x % 2 ? 1 : -1);
    }
    return full(`s3_can${f}`, cv);
  });
  function drawBranch(b, f) {
    const cv = new Canvas(W, H);
    // main branch (thicker near the trunk side), bark highlight on top
    for (let x = BTX; x <= BX0; x++) {
      const u = branchU(x), y = Math.round(branchY(x, b)), th = u < .35 ? 4 : u < .7 ? 3 : u < .9 ? 2 : 1;
      cv.rect(x, y, 1, th, '#5a3626');
      if (th > 1) cv.set(x, y, '#8a5a3c');
      if (th > 2 && x % 7 === 0) cv.set(x, y + 1, '#8a5a3c');
    }
    // twigs with leaf clusters
    const twigs = [[146, -1, -5], [160, 1, 5], [174, -1, -7], [192, 1, 6], [206, -1, -6], [168, 1, -4]];
    twigs.forEach(([x, dir, len], i) => {
      const y = branchY(x, b);
      const ex = x - 3 + ((f + i) % 2), ey = y + len;
      cv.line(x, Math.round(y), Math.round(ex), Math.round(ey), '#5a3626');
      cluster(cv, ex, ey, dir, f + i);
    });
    cluster(cv, BTX - 2, branchY(BTX, b), -1, f);
    return cv;
  }
  const BIRD_T0 = 21.0, BIRD_T1 = 24.8;
  const bend = t => {
    let v = 0.7 * Math.sin(t * 2.1) + 0.5 * Math.sin(t * 0.7 + 1);
    if (t >= BIRD_T0 && t < BIRD_T1) v += 1.2 + 2.6 * Math.exp(-(t - BIRD_T0) * 3.2) * Math.cos((t - BIRD_T0) * 13);
    if (t >= BIRD_T1) v -= 2.6 * Math.exp(-(t - BIRD_T1) * 3) * Math.cos((t - BIRD_T1) * 13);
    return Math.round(C.clamp(v, -2, 4));
  };
  const brIds = {};
  const brId = (b, f) => { const k = `${b}_${f}`; if (!brIds[k]) brIds[k] = full(`s3_br${b < 0 ? 'm' + -b : b}${f}`, drawBranch(b, f)); return brIds[k]; };
  outside += C.act({ t0, t1, fps: 4, pose: t => canopy[Math.floor(t * 2) % 2] });
  outside += C.act({ t0, t1, fps: 8, pose: t => brId(bend(t), Math.floor(t * 2.5) % 2) });

  // ---- sparrow ----
  const BP = { k: K, b: '#9a6a44', c: '#7a4a2e', l: '#efe2cc', w: '#fbf3e4', d: '#5e3f2a', y: '#3a2a26', f: '#b08058' };
  const birdArt = {
    perch: `
      ..kkk.......
      .kcccck.....
      ykkwccck....
      .kwwbbbdk...
      ..klbdbddkkk
      ..kllbddddk.
      ...kllkkkk..
      ....kkk.....
      ....k.k.....`,
    peck: `
      ............
      ............
      ....kkkk....
      ..kkccbbdk..
      .kcckbdbddkk
      ykwwcbddddk.
      .kkkllkkkk..
      ....kkk.....
      ....k.k.....`,
    look: `
      .kkk........
      kcccck......
      kwkccck.....
      ykwwbbdk....
      .kllbdbddkkk
      ..kllbddddk.
      ...kllkkkk..
      ....kkk.....
      ....k.k.....`,
    up: `
      .....kk.....
      ....kddk....
      ..kkkfddk...
      .kcckfbdk...
      ykwkbbbbdkkk
      .kwllbbbbk..
      ..kklllkk...
      ....kkk.....
      ............`,
    down: `
      ............
      ............
      ..kkk.......
      .kccckkkkkkk
      ykwkbbbbbdk.
      .kwllbbfddk.
      ..kkllkfdk..
      .....kkdk...
      .......k....`,
  };
  Object.entries(birdArt).forEach(([k, a]) => C.sprite(`s3_b_${k}`, a, BP));
  const PX = 146; // perch x (bird feet)
  const perchY = t => Math.round(branchY(PX, bend(t))) - 9;
  const birdPose = t => {
    if (t < 20.2) return null;
    if (t < BIRD_T0) return Math.floor(t * 12) % 2 ? 's3_b_up' : 's3_b_down';
    if (t < BIRD_T1) {
      if ((t >= 24.0 && t < 24.12) || (t >= 24.4 && t < 24.55)) return 's3_b_look';
      const pecks = [[21.5, 21.75], [22.9, 23.1], [23.25, 23.4]];
      if (pecks.some(([a, b]) => t >= a && t < b)) return 's3_b_peck';
      if ((t >= 22.1 && t < 22.6) || (t >= 23.6 && t < 24.0)) return 's3_b_look';
      return 's3_b_perch';
    }
    if (t < 26) return Math.floor(t * 14) % 2 ? 's3_b_up' : 's3_b_down';
    return null;
  };
  const birdPos = t => {
    if (t < BIRD_T0) { // swoop in from upper right, braking
      const u = C.inv(20.2, BIRD_T0, t), e = C.easeOut(u);
      return [C.lerp(232, PX - 6, e), C.lerp(8, perchY(BIRD_T0), e) + C.hop(u, 8)];
    }
    if (t < BIRD_T1) {
      let hopY = 0;
      if (t >= 24.0 && t < 24.12) hopY = -2;
      if (t >= 24.4 && t < 24.55) hopY = -3;
      if (t >= 22.6 && t < 22.75) hopY = -2; // little hop / turn
      return [PX - 6 + (t >= 22.7 ? 1 : 0), perchY(t) + hopY];
    }
    const u = C.inv(BIRD_T1, 25.8, t);
    return [PX - 6 + 110 * C.easeIn(u) + 14 * u, perchY(BIRD_T1) - 75 * C.easeOut(u) + 4 * Math.sin(u * 12)];
  };
  outside += C.act({ t0, t1, fps: 12, pose: birdPose, pos: birdPos, flip: t => t >= BIRD_T1 || (t >= 22.6 && t < 22.75) });
  // startled "!" over the bird at the taps
  const bang = C.text('!', 0, 0, '#ffffff');
  [[24.02, 24.3], [24.42, 24.8]].forEach(([a, b]) => {
    outside += at(a, b, `<g transform="translate(${PX - 2} ${perchY(24.2) - 8})">${C.text('!', 1, 1, K)}${bang}</g>`);
  });

  // ---- butterfly ----
  C.sprite('s3_bf0', `
    kk...kk
    kyyokyyk
    kyyykyyk
    .kyykyk.
    .kyk.kk.`.replace(/\n\s*/g, '\n'), { k: '#6b412c', y: '#fff3a0', o: '#ffc94a' });
  C.sprite('s3_bf1', `
    ...k.k..
    ...kyk..
    ..kyyk..
    ..kyok..
    ...kk...`, { k: '#6b412c', y: '#fff3a0', o: '#ffc94a' });
  const BF0 = 25.0, BF1 = 27.2;
  const bfPos = t => {
    const u = C.inv(BF0, BF1, t);
    return [C.lerp(190, 30, u), 58 + 20 * Math.sin(u * Math.PI) - 14 * u + 3 * Math.sin(u * 17) + 2 * Math.sin(u * 37)];
  };
  outside += C.act({ t0, t1, fps: 10, pose: t => (t >= BF0 && t < BF1 ? (Math.floor(t * 10) % 3 === 0 ? 's3_bf1' : 's3_bf0') : null), pos: bfPos });

  outside += '</g>';
  // ---- glass: reflections + paw smudge ----
  {
    const cv = new Canvas(W, H);
    const streak = (x, y0, len, w) => { for (let i = 0; i < len; i++) cv.rect(x + i, y0 - i, w, 1, '#ffffff'); };
    streak(84, 44, 30, 4); streak(92, 44, 22, 1); streak(40, 34, 20, 2); streak(184, 60, 24, 3); streak(190, 58, 14, 1);
    outside += `<g opacity=".22">${svg(cv)}</g>`;
  }
  const TAPX = CX + 33, TAPY = CY + 15;
  {
    const cv = new Canvas(8, 7);
    cv.rect(2, 3, 4, 3, '#ffffff'); cv.set(1, 1, '#ffffff'); cv.set(3, 0, '#ffffff'); cv.set(5, 0, '#ffffff'); cv.set(7, 1, '#ffffff');
    cv.set(1, 2, '#ffffff'); cv.set(7, 2, '#ffffff');
    const id = C.spriteRaw('s3_smudge', cv.toSVG(), 8, 7);
    outside += `<g opacity="0">${C.steps('opacity', [[0, 0], [24.0, .45], [24.4, .55], [t1, 0]])}${C.use(id, TAPX - 3, TAPY - 3)}</g>`;
  }

  out.push(`<g clip-path="url(#s3_clip)">${outside}</g>`);

  // =====================================================================
  // INSIDE
  // =====================================================================
  // ---- wall + window frame + sill (static) ----
  {
    const cv = new Canvas(W, H);
    cv.rect(0, 0, W, H, (x, y) => {
      const edge = Math.min(x, W - 1 - x) + y * 0.3;
      const lv = C.clamp(Math.round(10 - edge / 3), 0, 16);
      return C.bayer(x, y) < lv ? '#d9b688' : '#ecd0a2';
    });
    // wainscot below the sill
    cv.rect(0, 128, W, H - 128, (x, y) => (y === 128 ? '#c99466' : y === 129 ? '#8a5a3c' : x % 24 === 0 ? '#9a6a48' : x % 24 === 1 ? '#c49062' : '#b07a4f'));
    cv.rect(0, 141, W, 3, '#6b412c');
    // frame
    const F = { hi: '#d7a574', mid: '#b07a4f', sh: '#8a5a3c', dk: '#6b412c' };
    cv.rect(27, 3, 202, 102, F.dk);
    cv.rect(28, 4, 200, 100, F.mid);
    cv.rect(28, 4, 200, 1, F.hi); cv.rect(28, 4, 1, 100, F.hi);
    cv.rect(GX0 - 1, GY0 - 1, GX1 - GX0 + 2, 1, F.dk); cv.rect(GX0 - 1, GY0 - 1, 1, GY1 - GY0 + 1, F.dk);
    cv.rect(GX1, GY0 - 1, 1, GY1 - GY0 + 1, F.sh);
    for (let y = 5; y < 104; y += 7) cv.set(30, y, F.sh), cv.set(226, y + 3, F.sh);
    // clear glass
    cv.rect(GX0, GY0, GX1 - GX0, GY1 - GY0, null);
    // mullions
    MUL.forEach(([a, b]) => {
      cv.rect(a, GY0, b - a, GY1 - GY0, F.mid);
      cv.rect(a, GY0, 1, GY1 - GY0, F.hi); cv.rect(b - 1, GY0, 1, GY1 - GY0, F.sh);
      cv.rect(a - 1, GY0, 1, GY1 - GY0, F.dk);
    });
    // sill
    cv.rect(20, SILL_Y, 216, SILL_F - SILL_Y, (x, y) => (y === SILL_Y ? '#8a5a3c' : (x * 7 + y * 13) % 29 === 0 ? '#b98556' : '#c99466'));
    cv.rect(18, SILL_F, 220, SILL_B - SILL_F, (x, y) => (y === SILL_F ? '#e0ae7a' : y === SILL_B - 1 ? '#6b412c' : '#a8704a'));
    cv.rect(18, SILL_B, 220, 3, (x, y) => (C.bayer(x, y) < 16 - (y - SILL_B) * 6 ? '#b8946c' : null));
    // clear real glass pixels (Canvas has no erase -> rebuild markup without them)
    const px = cv.px;
    for (let y = GY0; y < GY1; y++) for (let x = GX0; x < GX1; x++) {
      if (!MUL.some(([a, b]) => x >= a - 1 && x < b)) px[y * W + x] = null;
    }
    out.push(C.use(full('s3_room', cv)));
  }

  // ---- sun patches on the sill (window light with mullion shadows, slanting) ----
  {
    const cv = new Canvas(W, H);
    for (let y = SILL_Y + 1; y < SILL_F; y++) {
      const o = 6 + (y - SILL_Y) * 2;
      for (let x = 20; x < 236; x++) {
        const sx = x + o;
        const inGlass = sx >= GX0 && sx < GX1 && !MUL.some(([a, b]) => sx >= a - 1 && sx < b);
        if (inGlass) cv.set(x, y, (x * 7 + y * 13) % 29 === 0 ? '#f4c48a' : '#ffdca4');
        else if (sx >= GX0 - 2 && sx < GX1 + 2 && C.bayer(x, y) < 6) cv.set(x, y, '#e0ae7a');
      }
    }
    // shaft of light in the room (subtle)
    const S = new Canvas(W, H);
    [[GX0, 76], [80, 176], [180, GX1]].forEach(([a, b]) => S.poly([[a + 14, GY0], [b, GY0], [b - 22, SILL_F], [a - 8, SILL_F]], '#fff6d6'));
    out.push(`<g opacity=".85">${C.tween('opacity', [[t0, .75], [26.0, .75], [26.8, 1], [t1, 1]])}${svg(cv)}</g>`);
    out.push(`<g opacity=".08">${C.tween('opacity', [[t0, .07], [26.0, .07], [26.8, .16], [t1, .16]])}${svg(S)}</g>`);
  }

  // ---- furin (glass wind chime) hanging in the left pane, paper strip swaying ----
  {
    const ids = [-2, -1, 0, 1, 2].map((sw, i) => {
      const cv = new Canvas(14, 26);
      cv.line(7, 0, 7 + Math.round(sw / 2), 6, '#6b412c');
      const bx = 7 + Math.round(sw / 2);
      cv.ellipse(bx + .5, 10, 4.2, 4, (x, y) => (y < 8 ? '#e8f6ff' : '#bfe4f6'));
      cv.rect(bx - 4, 12, 9, 2, (x, y) => (x === bx - 4 || x === bx + 4 ? null : '#bfe4f6'));
      cv.outline('#4a6a8a');
      cv.set(bx - 1, 9, '#f2657a'); cv.set(bx, 9, '#f2657a'); cv.set(bx + 1, 10, '#f2657a'); cv.set(bx - 2, 8, '#ffffff');
      // clapper string + paper strip (tanzaku)
      cv.line(bx, 14, bx + sw, 17, '#6b412c');
      for (let j = 0; j < 8; j++) {
        const x = bx + sw + Math.round(sw * j / 5);
        cv.rect(x - 1, 17 + j, 3, 1, j === 7 ? '#d94f5c' : '#f2657a');
        if (j % 3 === 1) cv.set(x, 17 + j, '#ffd3a0');
      }
      return C.spriteRaw(`s3_furin${i}`, svg(cv), 14, 26);
    });
    const swing = t => {
      let v = 1.6 * Math.sin(t * 3.1) + 0.6 * Math.sin(t * 7.3);
      if (t > 21.8 && t < 24) v += 0.8 * Math.sin(t * 9);
      return ids[Math.round(C.clamp(v, -2, 2)) + 2];
    };
    out.push(C.act({ t0, t1, fps: 8, pose: swing, pos: () => [50, GY0] }));
  }
  // ---- curtains (flutter frames) ----
  {
    const CP = { a: '#f4b3a4', b: '#d98c86', c: '#ffd6c4', k: '#9a5a66' };
    const rod = new Canvas(W, 8);
    rod.rect(4, 2, 248, 2, '#6b412c'); rod.rect(4, 2, 248, 1, '#8a5a3c');
    rod.rect(2, 1, 3, 4, '#b07a4f'); rod.rect(251, 1, 3, 4, '#b07a4f');
    const curtain = (side, f) => {
      const cv = new Canvas(W, H);
      const y0 = 3, y1 = 108;
      for (let y = y0; y < y1 + 3; y++) {
        const u = (y - y0) / (y1 - y0);
        const wv = Math.round((1.2 + 1.8 * u) * Math.sin(y / 9 - f * Math.PI / 2));
        const hem = y1 + Math.round(1.5 * Math.sin(f * Math.PI / 2 + (side ? 2 : 0)));
        if (y > hem) continue;
        let xa, xb;
        if (!side) { xa = 6; xb = 36 + Math.round(u * 3) + wv; }
        else { xa = 220 - Math.round(u * 3) - wv; xb = 250; }
        for (let x = xa; x < xb; x++) {
          const fold = ((x - (side ? xa : 0) + Math.round(u * 2 * Math.sin(f + y / 13))) % 7 + 7) % 7;
          let c = fold === 0 ? CP.b : fold === 1 ? CP.c : CP.a;
          if (y >= hem - 2) c = y === hem ? CP.b : CP.c;
          if (x === xa && side) c = CP.k;
          if (x === xb - 1 && !side) c = CP.k;
          cv.set(x, y, c);
        }
      }
      // tiny dot pattern
      for (let y = y0 + 4; y < y1 - 3; y += 6) for (let x = side ? 224 : 8; x < (side ? 248 : 34); x += 6) {
        const xx = x + ((y / 6) % 2) * 3;
        if (cv.get(xx, y) === CP.a) cv.set(xx, y, '#fff3e0');
      }
      // rings
      for (let x = side ? 222 : 8; x < (side ? 250 : 36); x += 5) cv.set(x, 4, '#6b412c');
      return cv;
    };
    const ids = [];
    for (let f = 0; f < 4; f++) {
      const cv = curtain(0, f), cr = curtain(1, (f + 1) % 4);
      cr.px.forEach((c, i) => { if (c) cv.px[i] = c; });
      ids.push(full(`s3_cur${f}`, cv));
    }
    out.push(C.act({ t0, t1, fps: 6, pose: t => ids[Math.floor(t * 3) % 4] }));
    out.push(svg(rod));
  }

  // ---- potted plant (right of sill) ----
  {
    const ids = [0, 1].map(f => {
      const cv = new Canvas(W, H);
      const px = 194, base = 111;
      const Lv = new Canvas(W, H);
      const heart = ['.hh.h.', 'hhmmmm', '.mmmmd', '..mmd.', '...d..'];
      const heartR = heart.map(r => [...r].reverse().join(''));
      const lmap = { h: '#8fd07a', m: '#5fae5a', d: '#3f7d4a' };
      // [stem end dx, dy, mirrored]
      const lv = [[-8, -30, 1], [0, -36, 0], [8, -31, 0], [13, -22, 0], [-12, -21, 1], [4, -25, 0], [-4, -26, 1], [-1, -18, 0], [9, -16, 0]];
      lv.forEach(([dx, dy, m], i) => {
        const sw = (f + i) % 2 && dy < -24 ? (m ? -1 : 1) : 0;
        const sx = px + 8 + Math.sign(dx) * 2, sy = base - 14;
        const lx = px + 8 + dx + sw, ly = base + dy;
        Lv.line(sx, sy, lx + 2, ly + 3, '#3f7d4a');
        Lv.art(m ? heartR : heart, lmap, lx, ly);
      });
      // trailing vine over the right rim, dangling down the sill front
      const vine = [[px + 16, base - 14], [px + 19, base - 10], [px + 21, base - 3], [px + 22, base + 4], [px + 21, base + 10]];
      for (let i = 0; i < vine.length - 1; i++) Lv.line(...vine[i], ...vine[i + 1], '#3f7d4a');
      [[px + 19, base - 9, 0], [px + 20, base - 1, 1], [px + 22 - f, base + 7, 0]].forEach(([x, y, m]) => Lv.art(m ? heartR : heart, lmap, x - 2, y - 2));
      Lv.outline('#24503a');
      const Pt = new Canvas(W, H);
      Pt.poly([[px, base - 13], [px + 17, base - 13], [px + 15, base], [px + 2, base]], (x, y) => (x < px + 4 ? '#e08a64' : x > px + 12 ? '#a8503a' : (y === base - 5 ? '#a8503a' : '#c9674a')));
      Pt.rect(px - 1, base - 15, 19, 3, (x, y) => (y === base - 15 ? '#e8a07a' : '#b85a40'));
      Pt.outline(K);
      cv.px = Pt.px; cat.over(cv, Lv);
      // re-draw the rim over the stems so the stems come out of the soil
      Pt.rect(px - 1, base - 15, 19, 3, (x, y) => (y === base - 15 ? '#e8a07a' : '#b85a40'));
      for (let x = px - 1; x < px + 18; x++) for (let y = base - 15; y < base - 12; y++) cv.set(x, y, Pt.get(x, y));
      cv.rect(px + 1, base - 16, 15, 1, '#5a3626');
      // saucer shadow
      return full(`s3_plant${f}`, cv);
    });
    out.push(C.act({ t0, t1, fps: 4, pose: t => ids[Math.floor(t * 1.5) % 2] }));
  }

  // =====================================================================
  // MIKAN
  // =====================================================================
  const cache = {};
  let nCat = 0;
  // sit pose with the right fore-paw reaching forward to the glass (reach 1 = half, 2 = touching)
  const catCanvas = p => {
    const { reach, ...q } = p;
    if (reach) q.paw = 3;
    const cv = cat.drawCat(q);
    if (reach) {
      const P = cat.PAL, L = new Canvas(cat.CW, cat.CH);
      const tip = reach === 2 ? [30, 16] : [28, 18];
      cat.thick(L, [[22, 21], [25.5, 19], tip], 1.25, P.w);
      L.outline(P.k);
      cat.over(cv, L);
      cv.set(tip[0] + 1, tip[1], P.p); if (reach === 2) cv.set(tip[0] + 1, tip[1] - 1, P.k);
      cv.set(tip[0] - 1, tip[1] + 1, P.s);
    }
    return cv;
  };
  const catId = p => {
    const k = JSON.stringify(p);
    if (!cache[k]) { cache[k] = `s3_cat${nCat++}`; C.spriteRaw(cache[k], svg(catCanvas(p)), cat.CW, cat.CH); }
    return cache[k];
  };
  const LOAF = 26.5;
  const inT = (t, a, b) => t >= a && t < b;
  const catParams = t => {
    const br = Math.floor((t - t0) / 0.8) % 2;
    if (t >= LOAF) {
      // settle into the loaf, doze in the sun: open -> half -> (fight) -> half -> closed
      let eyes = 'open';
      if (inT(t, 27.0, 27.45)) eyes = 'half';
      else if (inT(t, 27.45, 27.6)) eyes = 'open';
      else if (inT(t, 27.6, 28.0)) eyes = 'half';
      else if (t >= 28.0) eyes = 'closed';
      if (inT(t, 26.5, 26.62)) eyes = 'happy';
      const slow = Math.floor((t - LOAF) / 1.1) % 2;
      return { pose: 'loaf', eyes, mouth: 'cat', tail: 20, curl: 40 + (t < 27.6 ? [0, 12][Math.floor(t * 2) % 2] : 0), breath: slow, headDY: t >= 28.0 ? 1 : 0 };
    }
    const p = { pose: 'sit', eyes: 'open', mouth: 'cat', tail: 20, curl: 100, breath: 0, headDY: 0, paw: 0 };
    if (t < 20.4) { // idle watching, slow tail swish, a blink
      p.tail = [10, 20, 30, 20][Math.floor(t * 2.5) % 4];
      p.breath = br;
      if (inT(t, 19.9, 20.05)) p.eyes = 'half';
      if (inT(t, 20.05, 20.15)) p.eyes = 'closed';
    } else if (t < BIRD_T0) { // spots the bird coming
      p.eyes = 'look'; p.tail = 25;
    } else if (t < 22.0) { // alert: wide eyes, tail tip twitching
      p.eyes = 'wide'; p.headDY = -1;
      p.tail = 30; p.curl = [100, 130][Math.floor(t * 6) % 2];
    } else if (t < 23.5) { // CHATTER: fast mouth
      p.eyes = 'wide'; p.headDY = -1;
      p.mouth = Math.floor(t * 12) % 2 ? 'open' : 'cat';
      p.tail = [30, 45][Math.floor(t * 4) % 2]; p.curl = 120;
    } else if (t < 24.8) { // paw taps glass (24.0, 24.4)
      p.eyes = 'wide'; p.headDY = -1; p.tail = 40; p.curl = 110;
      p.paw = C.pick(t, [[23.5, 0], [23.7, 1], [23.8, 2], [23.9, 3], [24.55, 2], [24.65, 1], [24.72, 0]]);
      p.reach = C.pick(t, [[23.5, 0], [23.9, 1], [24.0, 2], [24.14, 1], [24.4, 2], [24.55, 0]]);
      if (!p.reach) delete p.reach;
    } else if (t < 25.5) { // bird gone: stares after it, then deflates
      p.eyes = t < 25.1 ? 'wide' : 'open'; p.headDY = t < 25.1 ? -2 : 0;
      p.tail = [20, 10][Math.floor(t * 3) % 2]; p.curl = 90;
    } else { // butterfly drifting by, lazily watched
      p.eyes = t < 26.0 ? 'look' : 'open'; p.headDY = t > 25.8 && t < 26.2 ? -1 : 0;
      p.tail = [10, 20, 30, 20][Math.floor(t * 2) % 4]; p.breath = br;
      if (inT(t, 26.2, 26.35)) p.eyes = 'half';
    }
    return p;
  };
  // shadow on sill
  {
    const cv = new Canvas(W, H);
    cv.ellipse(CX + 12, 109.5, 14, 2.2, (x, y) => (C.bayer(x, y) < 12 ? '#a8764c' : null));
    out.push(C.use(full('s3_shadow', cv)));
  }
  out.push(C.act({ t0, t1, fps: 12, pose: t => catId(catParams(t)), pos: t => [CX + (t >= 23.9 && t < 24.6 ? 1 : 0), CY] }));

  // chatter marks near the mouth (22.0-23.5)
  {
    // two alternating frames of little outlined "chatter" dashes fanning out toward the bird
    const mk = (segs) => { const cv = new Canvas(12, 12); segs.forEach(([x0, y0, x1, y1]) => cv.line(x0, y0, x1, y1, '#fff3e0')); cv.outline(K); return svg(cv); };
    const f1 = mk([[2, 6, 4, 6], [2, 2, 3, 1], [3, 10, 4, 11]]);
    const f2 = mk([[5, 6, 8, 6], [4, 2, 6, 0], [5, 10, 7, 11]]);
    const st = ph => C.sample(22.0, 23.5, 12, t => (Math.floor(t * 12) % 2 === ph ? 1 : 0)).concat([[23.5, 0]]);
    out.push(`<g transform="translate(${CX + 27} ${CY + 7})"><g opacity="0">${f1}${C.steps('opacity', [[0, 0], ...st(1)])}</g><g opacity="0">${f2}${C.steps('opacity', [[0, 0], ...st(0)])}</g></g>`);
  }
  // tap bursts at the glass
  {
    const star = (r, gap) => { const cv = new Canvas(13, 13); const c = 6;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => cv.line(c + dx * gap, c + dy * gap, c + dx * r, c + dy * r, '#fff3a0'));
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([dx, dy]) => cv.set(c + dx * (gap), c + dy * (gap), '#ffffff'));
      cv.outline(K); return svg(cv); };
    const big = star(5, 2), small = star(5, 4);
    [24.0, 24.4].forEach(tt => {
      out.push(at(tt, tt + 0.15, `<g transform="translate(${TAPX - 6} ${TAPY - 6})">${big}</g>`));
      out.push(at(tt + 0.15, tt + 0.27, `<g transform="translate(${TAPX - 6} ${TAPY - 6})">${small}</g>`));
    });
  }
  // dust motes in the sunbeam
  {
    const R = C.rng(77);
    for (let i = 0; i < 10; i++) {
      const x0 = 50 + R() * 150, y0 = 30 + R() * 60, ph = R() * 6, sp = 1 + R() * 2;
      const tw = C.sample(t0, t1, 3, t => ((Math.floor(t * 3 + ph * 3) % 5) ? 1 : 0.3));
      out.push(`<g>${C.move(t0, t1, 4, t => [x0 + 3 * Math.sin((t + ph) * 0.8), y0 + sp * (t - t0) * 0.6])}<rect width="1" height="1" fill="#fff6d6" opacity=".8">${C.steps('opacity', tw.map(([t, v]) => [t, v * 0.8]))}</rect></g>`);
    }
  }
  // sleepy z's (from 28.0)
  {
    const hx = CX + 28, hy = CY + 6;
    [[28.0, 0], [28.3, 1]].forEach(([a, k]) => {
      const z = `<g>${C.text('z', 1, 1, K)}${C.text('z', 0, 0, '#fff3e0')}</g>`;
      out.push(`<g opacity="0">${C.show(a, t1)}<g>${C.move(a, t1, 5, t => [hx + k * 3 + 2 * Math.sin((t - a) * 5), hy - k * 2 - (t - a) * 9])}${z}</g></g>`);
    });
  }

  return out.join('\n');
};
